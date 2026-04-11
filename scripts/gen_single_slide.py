"""Generate a single SDXL slide image with PIL text compositing.

Usage: python3 gen_single_slide.py --bg "prompt" --text "verse text" --out "path.png"

The --text argument supports markdown-style formatting:
  **bold**        → rendered in bold
  *italic*        → rendered in italic
  # Heading       → large text (36pt)
  ## Subheading   → medium text (32pt)
  ### Small head  → slightly larger than body (30pt)
  ---             → horizontal rule line
  Newlines        → preserved as line breaks
"""

import argparse
import re
import torch
from diffusers import StableDiffusionXLPipeline
from PIL import Image, ImageDraw, ImageFont

NEGATIVE = (
    "text, words, letters, numbers, watermark, signature, "
    "bright saturated colors, neon, cartoon, anime, high key, white background"
)
WIDTH, HEIGHT = 800, 448
STEPS = 30
GUIDANCE = 7.5

# Font paths (tried in order)
FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
FONT_PATHS_ITALIC = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
]


def load_font(size, italic=False):
    paths = FONT_PATHS_ITALIC if italic else FONT_PATHS
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def strip_md(text):
    """Strip markdown markers, returning plain text."""
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    return text


def parse_text_blocks(text):
    """Parse markdown text into a list of render blocks.

    Each block is a dict: {type, text, font_size, bold, italic}
    Types: 'text', 'heading', 'hr'
    """
    blocks = []
    for line in text.split('\n'):
        # HR
        if line.strip() == '---':
            blocks.append({'type': 'hr'})
            continue

        # Headings
        hm = re.match(r'^(#{1,3}) (.+)', line)
        if hm:
            level = len(hm.group(1))
            sizes = {1: 48, 2: 42, 3: 38}
            blocks.append({
                'type': 'heading',
                'text': strip_md(hm.group(2)),
                'font_size': sizes.get(level, 28),
            })
            continue

        # Regular text line — may contain inline bold/italic
        # Split into segments: bold, italic, plain
        if line.strip():
            blocks.append({
                'type': 'text',
                'segments': parse_inline(line),
            })
        else:
            # Blank line = spacer
            blocks.append({'type': 'spacer'})

    return blocks


def parse_inline(line):
    """Parse inline **bold** and *italic* into segments.

    Returns list of (text, bold, italic) tuples.
    """
    segments = []
    pattern = re.compile(r'\*\*([^*]+)\*\*|\*([^*]+)\*|([^*]+)')
    for m in pattern.finditer(line):
        if m.group(1) is not None:
            segments.append((m.group(1), True, False))
        elif m.group(2) is not None:
            segments.append((m.group(2), False, True))
        else:
            segments.append((m.group(3), False, False))
    return segments


def word_wrap_segments(draw, segments, font_normal, font_bold, font_italic, max_width):
    """Word-wrap a list of segments, returning wrapped lines.

    Each line is a list of (text, font) tuples.
    """
    lines = [[]]
    current_width = 0

    for text, bold, italic in segments:
        font = font_bold if bold else (font_italic if italic else font_normal)
        words = text.split(' ')
        for wi, word in enumerate(words):
            # Add space before word if not at line start
            prefix = ' ' if (current_width > 0 and wi > 0) or (current_width > 0 and wi == 0) else ''
            test = prefix + word
            bbox = draw.textbbox((0, 0), test, font=font)
            w = bbox[2] - bbox[0]

            if current_width + w > max_width and current_width > 0:
                # Wrap to new line
                lines.append([])
                current_width = 0
                prefix = ''
                test = word

            bbox = draw.textbbox((0, 0), test, font=font)
            w = bbox[2] - bbox[0]
            lines[-1].append((test, font))
            current_width += w

    return lines


def draw_text_glow(draw, x, y, text, font, fill=(255, 255, 255)):
    """Draw text with dark glow/outline for legibility."""
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            draw.text((x + dx, y + dy), text, fill=(0, 0, 0), font=font)
    draw.text((x, y), text, fill=fill, font=font)


def composite_text(image, text):
    """Composite markdown-formatted text onto the image."""
    draw = ImageDraw.Draw(image)
    max_width = WIDTH - 80

    # Parse into blocks
    text_blocks = parse_text_blocks(text)

    # Pre-calculate total height
    body_size = 34
    font_normal = load_font(body_size)
    font_bold = load_font(body_size)  # DejaVu Bold is the default
    font_italic = load_font(body_size, italic=True)

    render_items = []  # list of (type, data, height)

    for block in text_blocks:
        if block['type'] == 'hr':
            render_items.append(('hr', None, 16))

        elif block['type'] == 'spacer':
            render_items.append(('spacer', None, 12))

        elif block['type'] == 'heading':
            font = load_font(block['font_size'])
            # Word wrap heading as plain text
            words = block['text'].split()
            lines = []
            current = ""
            for w in words:
                test = (current + " " + w).strip()
                bbox = draw.textbbox((0, 0), test, font=font)
                if bbox[2] - bbox[0] > max_width and current:
                    lines.append(current)
                    current = w
                else:
                    current = test
            if current:
                lines.append(current)
            line_h = block['font_size'] + 6
            render_items.append(('heading', (lines, font, block['font_size']), len(lines) * line_h))

        elif block['type'] == 'text':
            wrapped = word_wrap_segments(draw, block['segments'], font_normal, font_bold, font_italic, max_width)
            line_h = body_size + 6
            render_items.append(('text', (wrapped, body_size), len(wrapped) * line_h))

    total_height = sum(h for _, _, h in render_items)
    y = (HEIGHT - total_height) // 2

    for rtype, rdata, rheight in render_items:
        if rtype == 'hr':
            line_y = y + rheight // 2
            draw.line([(60, line_y), (WIDTH - 60, line_y)], fill=(180, 180, 180), width=1)

        elif rtype == 'spacer':
            pass  # just takes up vertical space

        elif rtype == 'heading':
            lines, font, fsize = rdata
            line_h = fsize + 6
            for i, line in enumerate(lines):
                bbox = draw.textbbox((0, 0), line, font=font)
                x = (WIDTH - (bbox[2] - bbox[0])) // 2
                draw_text_glow(draw, x, y + i * line_h, line, font)

        elif rtype == 'text':
            wrapped, fsize = rdata
            line_h = fsize + 6
            for i, segments in enumerate(wrapped):
                # Calculate total line width for centering
                total_w = sum(draw.textbbox((0, 0), t, font=f)[2] - draw.textbbox((0, 0), t, font=f)[0] for t, f in segments)
                x = (WIDTH - total_w) // 2
                for seg_text, seg_font in segments:
                    draw_text_glow(draw, x, y + i * line_h, seg_text, seg_font)
                    bbox = draw.textbbox((0, 0), seg_text, font=seg_font)
                    x += bbox[2] - bbox[0]

        y += rheight


def generate(bg_prompt, text, out_path):
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        variant="fp16",
    ).to("cuda")

    image = pipe(
        prompt=bg_prompt,
        negative_prompt=NEGATIVE,
        width=WIDTH,
        height=HEIGHT,
        num_inference_steps=STEPS,
        guidance_scale=GUIDANCE,
    ).images[0]

    if text:
        composite_text(image, text)

    image.save(out_path)
    print(f"Saved: {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bg", required=True, help="Background prompt")
    parser.add_argument("--text", default="", help="Overlay text (supports markdown: **bold**, *italic*, # headings, ---)")
    parser.add_argument("--out", required=True, help="Output path")
    args = parser.parse_args()
    generate(args.bg, args.text, args.out)
