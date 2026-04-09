"""Re-generate only the bap-intro slide."""
import torch
from diffusers import StableDiffusionXLPipeline
from PIL import Image, ImageDraw, ImageFont
import os

pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
    variant="fp16",
    use_safetensors=True
)
pipe = pipe.to("cuda")
pipe.enable_attention_slicing()

FONT_REF  = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
FONT_TEXT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
H_MARGIN  = 48


def text_width(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def wrap_line(draw, text, font, max_w):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = (current + " " + word).strip()
        if text_width(draw, candidate, font) <= max_w:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def draw_with_glow(draw, pos, text, font, glow_radius=4):
    x, y = pos
    for dx in range(-glow_radius, glow_radius + 1):
        for dy in range(-glow_radius, glow_radius + 1):
            if dx == 0 and dy == 0:
                continue
            draw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0, 220))
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))


def add_verse_text(image, reference, lines, valign="center"):
    """valign: 'center' (default), 'top', or 'bottom'"""
    draw = ImageDraw.Draw(image, 'RGBA')
    w, h = image.size
    avail_w = w - 2 * H_MARGIN

    font_ref  = ImageFont.truetype(FONT_REF,  52)
    font_text = ImageFont.truetype(FONT_TEXT, 38)

    wrapped = []
    for line in lines:
        wrapped.extend(wrap_line(draw, line, font_text, avail_w))

    lh_ref  = 62
    lh_text = 50
    gap     = 12
    total_h = lh_ref + gap + lh_text * len(wrapped)

    if valign == "top":
        y = H_MARGIN
    elif valign == "bottom":
        y = h - total_h - H_MARGIN
    else:
        y = (h - total_h) // 2

    rw = text_width(draw, reference, font_ref)
    draw_with_glow(draw, (H_MARGIN + (avail_w - rw) // 2, y), reference, font_ref, glow_radius=4)
    y += lh_ref + gap

    for line in wrapped:
        lw = text_width(draw, line, font_text)
        draw_with_glow(draw, (H_MARGIN + (avail_w - lw) // 2, y), line, font_text, glow_radius=3)
        y += lh_text

    return image


prompt = (
    "wide angle conference panel, four chairs behind a long table with four nameplates "
    "and four microphones, two men and two women seated facing audience, "
    "dark drapes background, amber overhead lighting, academic seminar, photorealistic, "
    "cinematic, desaturated"
)
neg = (
    "text, words, letters, numbers, watermark, signature, bright saturated colors, neon, cartoon, anime, "
    "high key, white background, cheerful, modern, empty chairs"
)

OUT_DIR = "/mnt/d/Projects/systematic-theology/storyboards/images"
os.makedirs(OUT_DIR, exist_ok=True)

seeds = [42, 1337, 7777, 99999]

for seed in seeds:
    print(f"Generating bap-intro seed={seed}...", flush=True)
    generator = torch.Generator("cuda").manual_seed(seed)
    image = pipe(
        prompt=prompt,
        negative_prompt=neg,
        width=800,
        height=448,
        num_inference_steps=40,
        guidance_scale=8.0,
        generator=generator,
    ).images[0]

    image = image.convert('RGBA')
    image = add_verse_text(image, "Baptism in the Spirit", ["A Panel Discussion"], valign="top")
    image = image.convert('RGB')

    path = os.path.join(OUT_DIR, f"bap-intro-{seed}.png")
    image.save(path, optimize=True)
    print(f"  Saved {path}", flush=True)

print("All seeds done!", flush=True)
