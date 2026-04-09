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

def draw_with_glow(draw, pos, text, font, glow_radius=4):
    """Draw white text with a black glow/stroke for legibility over any background."""
    x, y = pos
    # Draw black glow at all offsets within radius
    for dx in range(-glow_radius, glow_radius + 1):
        for dy in range(-glow_radius, glow_radius + 1):
            if dx == 0 and dy == 0:
                continue
            draw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0, 220))
    # Draw white text on top
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))


def add_verse_text(image, reference, lines):
    """Composite large white verse text with black glow, centered over the image."""
    draw = ImageDraw.Draw(image, 'RGBA')
    w, h = image.size

    try:
        font_ref = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 52)
        font_text = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 38)
    except:
        font_ref = ImageFont.load_default()
        font_text = font_ref

    line_height_ref = 60
    line_height_text = 48
    gap = 10  # gap between reference and quote lines

    total_height = line_height_ref + gap + line_height_text * len(lines)
    y = (h - total_height) // 2  # vertically centered

    # Reference line
    ref_bbox = draw.textbbox((0, 0), reference, font=font_ref)
    ref_w = ref_bbox[2] - ref_bbox[0]
    draw_with_glow(draw, ((w - ref_w) // 2, y), reference, font_ref, glow_radius=4)
    y += line_height_ref + gap

    # Quote lines
    for line in lines:
        line_bbox = draw.textbbox((0, 0), line, font=font_text)
        line_w = line_bbox[2] - line_bbox[0]
        draw_with_glow(draw, ((w - line_w) // 2, y), line, font_text, glow_radius=3)
        y += line_height_text

    return image

slides = [
    {
        "id": "bap-ephesians-1-13",
        "prompt": "ancient rolled letter with red wax seal on dark stone table, single candle flame casting warm light, aged parchment texture, desaturated warm amber tones, moody dramatic lighting, still life, wide aspect ratio",
        "reference": "Ephesians 1:13-14",
        "lines": [
            '"...you were sealed with the promised Holy Spirit,',
            'who is the guarantee of our inheritance."',
        ],
    },
    {
        "id": "bap-ephesians-5-18",
        "prompt": "tall white sails fully billowing on dark open ocean at night, soft silver moonlight reflecting on calm water, desaturated blue-silver tones, minimal atmospheric composition, wide aspect ratio",
        "reference": "Ephesians 5:18",
        "lines": [
            '"...be filled with the Spirit."',
            "[present tense \u2014 keep on being filled]",
        ],
    },
    {
        "id": "bap-acts-8-16",
        "prompt": "mosaic artwork of many diverse faces from different nations and ethnicities, fragmented tile pattern, desaturated warm earth tones, dark background, painterly ancient style, wide aspect ratio",
        "reference": "Acts 8:16",
        "lines": [
            '"The Holy Spirit had not yet come on any of them;',
            'they had simply been baptized in the name of the Lord Jesus."',
        ],
    },
    {
        "id": "bap-1-cor-12-13",
        "prompt": "aerial view looking down on three separate footpaths through dark forest converging toward a single distant warm light at the center, deeply desaturated, dark moody atmosphere, wide aspect ratio",
        "reference": "1 Corinthians 12:13",
        "lines": [
            '"We were all baptized by one Spirit',
            'so as to form one body."',
        ],
    },
    {
        "id": "bap-matt-3-11",
        "prompt": "solitary figure standing in vast open field with tall grass bending visibly in wind, wide dramatic sky with scattered clouds, desaturated blue-gray tones, cinematic landscape, wide aspect ratio",
        "reference": "Matthew 3:11",
        "lines": [
            '"He will baptize you with the Holy Spirit and fire."',
        ],
    },
    {
        "id": "bap-acts-4-31",
        "prompt": "ancient stone vaulted chamber with warm golden light gradually filling from deep within, dark stone archways receding into distance, desaturated gold on dark stone, atmospheric, wide aspect ratio",
        "reference": "Acts 4:31",
        "lines": [
            '"They were all filled with the Holy Spirit',
            'and spoke the word of God boldly."',
        ],
    },
    {
        "id": "bap-galatians-5-25",
        "prompt": "lone person walking along an ordinary empty city street in early morning blue dawn light, long shadows, desaturated cool blue tones, cinematic wide shot, quiet atmospheric, wide aspect ratio",
        "reference": "Galatians 5:25",
        "lines": [
            '"If we live by the Spirit,',
            'let us also keep in step with the Spirit."',
        ],
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
