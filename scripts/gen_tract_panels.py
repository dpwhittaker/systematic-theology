"""Generate 6 panel images for the gospel tract via SDXL.

Output: handouts/tract/images/panel-NN-slug.png (768x768).
No text composited — SVG layout overlays captions.
"""
import torch
from diffusers import StableDiffusionXLPipeline
import os

OUT_DIR = "handouts/tract/images"
os.makedirs(OUT_DIR, exist_ok=True)

STYLE = (
    "warm hopeful painterly illustration, soft natural light, "
    "modern religious art, cinematic composition, "
    "muted earthy palette with golden highlights, no text, no words, no letters, no signage"
)

NEG = (
    "text, words, letters, numbers, watermark, signature, logo, "
    "bright saturated colors, neon, cartoon, anime, kitsch, "
    "creepy face, distorted face, malformed hands, extra limbs, "
    "high key, white background"
)

PANELS = [
    ("01-broken-world",
     "Earth seen from space, swirling storm clouds covering parts of continents, "
     "warm light still glowing through breaks in clouds, vast deep starfield behind, "
     "sense of beauty and damage together, " + STYLE),
    ("02-made-for-more",
     "A solitary silhouetted figure standing on a grassy hilltop at dawn, "
     "looking up at a vast star-filled twilight sky, "
     "golden horizon, sense of longing and wonder, expansive, " + STYLE),
    ("03-god-came-down",
     "Ancient Middle Eastern marketplace at golden hour, "
     "a figure in simple robes gently touching the hand of a kneeling person, "
     "diverse villagers gathered, faces turned in attention, "
     "soft warm light radiating from the central scene, " + STYLE),
    ("04-defeated-death",
     "Empty stone tomb at sunrise, large round stone rolled aside, "
     "brilliant warm light pouring out of the entrance into morning mist, "
     "ancient garden setting, hopeful triumphant, no figures, " + STYLE),
    ("05-kingdom-coming",
     "A magnificent luminous city descending from a golden sky onto a renewed earth, "
     "river of clear water flowing through verdant green hills, "
     "fruit trees lining the riverbanks, distant figures of every nation walking together in peace, "
     "wide cinematic landscape, hopeful, " + STYLE),
    ("06-invitation",
     "An open wooden door in an ancient stone wall, warm golden light spilling out onto a garden path, "
     "soft inviting glow, dawn light, a path leading to the threshold, "
     "sense of welcome and homecoming, no figures, " + STYLE),
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

    generator = torch.Generator(device="cuda").manual_seed(20260510)

    for slug, prompt in PANELS:
        out_path = os.path.join(OUT_DIR, f"panel-{slug}.png")
        print(f"  -> {out_path}")
        image = pipe(
            prompt=prompt,
            negative_prompt=NEG,
            width=768,
            height=768,
            num_inference_steps=30,
            guidance_scale=7.5,
            generator=generator,
        ).images[0]
        image.save(out_path)

    print("Done.")


if __name__ == "__main__":
    main()
