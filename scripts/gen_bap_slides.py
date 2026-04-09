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
H_MARGIN  = 48   # pixels from each side — keeps glow off the edge


def text_width(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def wrap_line(draw, text, font, max_w):
    """Word-wrap a single string to fit within max_w pixels. Returns list of lines."""
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
    """Draw white text with a black glow for legibility over any background."""
    x, y = pos
    for dx in range(-glow_radius, glow_radius + 1):
        for dy in range(-glow_radius, glow_radius + 1):
            if dx == 0 and dy == 0:
                continue
            draw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0, 220))
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))


def add_verse_text(image, reference, lines):
    """Overlay verse text: large white with black glow, auto-wrapped, centered."""
    draw = ImageDraw.Draw(image, 'RGBA')
    w, h = image.size
    avail_w = w - 2 * H_MARGIN

    font_ref  = ImageFont.truetype(FONT_REF,  52)
    font_text = ImageFont.truetype(FONT_TEXT, 38)

    # Auto-wrap every quote line to available width
    wrapped = []
    for line in lines:
        wrapped.extend(wrap_line(draw, line, font_text, avail_w))

    lh_ref  = 62
    lh_text = 50
    gap     = 12
    total_h = lh_ref + gap + lh_text * len(wrapped)
    y = (h - total_h) // 2

    # Reference
    rw = text_width(draw, reference, font_ref)
    draw_with_glow(draw, (H_MARGIN + (avail_w - rw) // 2, y), reference, font_ref, glow_radius=4)
    y += lh_ref + gap

    # Quote lines
    for line in wrapped:
        lw = text_width(draw, line, font_text)
        draw_with_glow(draw, (H_MARGIN + (avail_w - lw) // 2, y), line, font_text, glow_radius=3)
        y += lh_text

    return image

slides = [
    {
        "id": "bap-ephesians-1-13",
        "prompt": "ancient rolled letter with red wax seal on dark stone table, single candle flame casting warm light, aged parchment texture, desaturated warm amber tones, moody dramatic lighting, still life, wide aspect ratio",
        "reference": "Ephesians 1:13-14",
        "lines": ['"...you were sealed with the promised Holy Spirit, who is the guarantee of our inheritance."'],
    },
    {
        "id": "bap-ephesians-5-18",
        "prompt": "tall white sails fully billowing on dark open ocean at night, soft silver moonlight reflecting on calm water, desaturated blue-silver tones, minimal atmospheric composition, wide aspect ratio",
        "reference": "Ephesians 5:18",
        # Two lines: the verse, then a translation note — kept separate intentionally
        "lines": [
            '"...be filled with the Spirit."',
            "[present tense \u2014 keep on being filled]",
        ],
    },
    {
        "id": "bap-acts-8-16",
        "prompt": "mosaic artwork of many diverse faces from different nations and ethnicities, fragmented tile pattern, desaturated warm earth tones, dark background, painterly ancient style, wide aspect ratio",
        "reference": "Acts 8:16",
        "lines": ['"The Holy Spirit had not yet come on any of them; they had simply been baptized in the name of the Lord Jesus."'],
    },
    {
        "id": "bap-1-cor-12-13",
        "prompt": "aerial view looking down on three separate footpaths through dark forest converging toward a single distant warm light at the center, deeply desaturated, dark moody atmosphere, wide aspect ratio",
        "reference": "1 Corinthians 12:13",
        "lines": ['"We were all baptized by one Spirit so as to form one body."'],
    },
    {
        "id": "bap-matt-3-11",
        "prompt": "solitary figure standing in vast open field with tall grass bending visibly in wind, wide dramatic sky with scattered clouds, desaturated blue-gray tones, cinematic landscape, wide aspect ratio",
        "reference": "Matthew 3:11",
        "lines": ['"He will baptize you with the Holy Spirit and fire."'],
    },
    {
        "id": "bap-acts-4-31",
        "prompt": "ancient stone vaulted chamber with warm golden light gradually filling from deep within, dark stone archways receding into distance, desaturated gold on dark stone, atmospheric, wide aspect ratio",
        "reference": "Acts 4:31",
        "lines": ['"They were all filled with the Holy Spirit and spoke the word of God boldly."'],
    },
    {
        "id": "bap-galatians-5-25",
        "prompt": "lone person walking along an ordinary empty city street in early morning blue dawn light, long shadows, desaturated cool blue tones, cinematic wide shot, quiet atmospheric, wide aspect ratio",
        "reference": "Galatians 5:25",
        "lines": ['"If we live by the Spirit, let us also keep in step with the Spirit."'],
    },
    # --- original 5 slides ---
    {
        "id": "romans-8-9",
        "prompt": "single candle flame reflecting on dark still water surface, photorealistic, desaturated deep navy blue tones, dark moody atmosphere, minimal composition, cinematic lighting, wide aspect ratio",
        "reference": "Romans 8:9",
        "lines": ['"If anyone does not have the Spirit of Christ, they do not belong to Christ."'],
    },
    {
        "id": "john-14-16",
        "prompt": "pair of open cupped hands reaching upward with soft warm ethereal light descending from above into palms, desaturated indigo purple tones, very dark background, painterly style, spiritual contemplative atmosphere, wide aspect ratio",
        "reference": "John 14:16-17",
        "lines": ['"He will give you another advocate to help you and be with you forever \u2014 the Spirit of truth."'],
    },
    {
        "id": "acts-1-8",
        "prompt": "dramatic golden rays of light breaking through dark storm clouds over a distant flat horizon at dawn, desaturated warm amber tones against dark sky, wide landscape, cinematic atmosphere, wide aspect ratio",
        "reference": "Acts 1:8",
        "lines": ['"You will receive power when the Holy Spirit comes on you; and you will be my witnesses..."'],
    },
    {
        "id": "exodus-40-34",
        "prompt": "ancient desert tabernacle tent with a luminous glowing cloud descending from the sky onto the tent roof, desaturated gold and earth tones, dark atmospheric, biblical scene, painterly, wide aspect ratio",
        "reference": "Exodus 40:34",
        "lines": ['"The cloud covered the tent of meeting, and the glory of the LORD filled the tabernacle."'],
    },
    {
        "id": "ephesians-4-30",
        "prompt": "ancient cracked red wax seal impression on dark aged parchment paper, visible fracture lines radiating from seal, warm muted earth tones, macro detail, moody dramatic lighting, still life, wide aspect ratio",
        "reference": "Ephesians 4:30",
        "lines": ['"Do not grieve the Holy Spirit of God, with whom you were sealed for the day of redemption."'],
    },
]

neg = "text, words, letters, numbers, watermark, signature, bright saturated colors, neon, cartoon, anime, high key, white background, cheerful, modern"

OUT_DIR = "/mnt/d/Projects/systematic-theology/storyboards/images"
os.makedirs(OUT_DIR, exist_ok=True)

total = len(slides)
for i, s in enumerate(slides):
    print(f"Generating {i+1}/{total}: {s['id']}...", flush=True)
    image = pipe(
        prompt=s["prompt"],
        negative_prompt=neg,
        width=800,
        height=448,
        num_inference_steps=30,
        guidance_scale=7.5,
    ).images[0]

    image = image.convert('RGBA')
    image = add_verse_text(image, s["reference"], s["lines"])
    image = image.convert('RGB')

    path = os.path.join(OUT_DIR, f"{s['id']}.png")
    image.save(path, optimize=True)
    print(f"  Saved {path}", flush=True)

print(f"All {total} slides generated!", flush=True)
