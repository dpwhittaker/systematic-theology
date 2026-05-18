"""Generate 6 panel images for the v2 gospel tract via SDXL.

Output: handouts/tract/images/v2-NN-slug.png (768x768).
"""
import torch
from diffusers import StableDiffusionXLPipeline
import os

OUT_DIR = "handouts/tract/images"
os.makedirs(OUT_DIR, exist_ok=True)

STYLE = (
    "warm hopeful painterly illustration, soft natural light, "
    "modern religious art, cinematic composition, "
    "muted earthy palette with golden highlights"
)
NEG = (
    "text, words, letters, numbers, watermark, signature, logo, "
    "neon, anime, cartoon, kitsch, malformed face, distorted face, "
    "extra limbs, deformed hands, high key, white background"
)

PANELS = [
    ("v2-01-good-world",
     "Lush Eden garden at golden hour, clear river flowing through verdant fields, "
     "fruit trees laden with ripe fruit, gentle animals grazing peacefully, "
     "distant rolling mountains, perfect untouched creation, warm peaceful, " + STYLE),
    ("v2-02-messed-it-up",
     "Polluted industrial city skyline at dusk, dark smog over the horizon, "
     "cracked parched earth in foreground, scattered debris and rubble, "
     "sense of human-caused devastation, muted somber palette, " + STYLE),
    ("v2-03-loves-anyway",
     "Warm divine golden light streaming down from above onto a small huddled silhouetted figure, "
     "gentle protective rays embracing the figure, sense of unconditional love, "
     "tender soft, vast sky above, " + STYLE),
    ("v2-04-sent-his-son",
     "Humble ancient stable interior at night, dim warm lantern light, "
     "a young mother holding a newborn infant wrapped in cloth, "
     "simple shepherds kneeling nearby, soft holy quiet reverence, " + STYLE),
    ("v2-05-gave-life",
     "Single rugged wooden cross silhouetted on a barren hilltop, "
     "dramatic stormy clouds parting to reveal radiant golden light breaking through, "
     "sacrificial somber transitioning to hopeful, cinematic wide composition, " + STYLE),
    ("v2-06-join-it",
     "Diverse group of ordinary people walking together along a sunlit dirt path "
     "through golden fields toward a distant luminous city on a hill, "
     "sense of pilgrimage belonging and welcome, warm hopeful, " + STYLE),
]


def main():
    print("Loading SDXL...")
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True,
    ).to("cuda")
    pipe.enable_attention_slicing()

    gen = torch.Generator(device="cuda").manual_seed(20260511)

    for slug, prompt in PANELS:
        out_path = os.path.join(OUT_DIR, f"{slug}.png")
        print(f"  -> {out_path}")
        image = pipe(
            prompt=prompt,
            negative_prompt=NEG,
            width=768, height=768,
            num_inference_steps=30, guidance_scale=7.5,
            generator=gen,
        ).images[0]
        image.save(out_path)
    print("Done.")


if __name__ == "__main__":
    main()
