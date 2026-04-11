"""Generate a single SDXL slide image with PIL text compositing.

Usage: python3 gen_single_slide.py --bg "prompt" --text "verse text" --out "path.png"
"""

import argparse
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

    # Composite text
    if text:
        draw = ImageDraw.Draw(image)

        # Try to load a good font, fall back to default
        font_size = 28
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except (IOError, OSError):
            font = ImageFont.load_default()

        # Word wrap
        max_width = WIDTH - 80
        words = text.split()
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

        # Draw with glow effect
        line_height = font_size + 6
        total_height = len(lines) * line_height
        y_start = HEIGHT - total_height - 40

        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            x = (WIDTH - (bbox[2] - bbox[0])) // 2
            y = y_start + i * line_height
            # Glow (dark outline)
            for dx in range(-2, 3):
                for dy in range(-2, 3):
                    draw.text((x + dx, y + dy), line, fill=(0, 0, 0), font=font)
            # Main text
            draw.text((x, y), line, fill=(255, 255, 255), font=font)

    image.save(out_path)
    print(f"Saved: {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bg", required=True, help="Background prompt")
    parser.add_argument("--text", default="", help="Overlay text")
    parser.add_argument("--out", required=True, help="Output path")
    args = parser.parse_args()
    generate(args.bg, args.text, args.out)
