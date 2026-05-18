"""Compose 8-panel tract: 6 SDXL panels + 2 reused (panel 7 = panel 2, panel 8 = panel 1).

Output: handouts/tract/tract.svg (self-contained, base64-embedded images).
"""
import base64
import os
import textwrap

IMG_DIR = "handouts/tract/images"
OUT_PATH = "handouts/tract/tract.svg"

PANELS = [
    {
        "img": "v2-01-good-world.png",
        "title": "1. GOD MADE A GOOD WORLD.",
        "body": "In the beginning, everything was beautiful, whole, and at peace. "
                "Made on purpose. Made good.",
    },
    {
        "img": "v2-02-messed-it-up.png",
        "title": "2. WE MESSED IT UP.",
        "body": "Pride, fear, greed, violence — ours and everyone else's. "
                "The world we live in is the world we built when we walked away from Him.",
    },
    {
        "img": "v2-03-loves-anyway.png",
        "title": "3. HE LOVES US ANYWAY.",
        "body": "Not because we are good. Because He is good. "
                "His love never depended on us deserving it.",
    },
    {
        "img": "v2-04-sent-his-son.png",
        "title": "4. HE SENT HIS SON.",
        "body": "God did not stay distant. He came in person — born to a poor family, "
                "growing up among ordinary people, calling us home.",
    },
    {
        "img": "v2-05-gave-life.png",
        "title": "5. JESUS GAVE HIS LIFE FOR THE KINGDOM.",
        "body": "He absorbed our brokenness on the cross, defeated death three days later, "
                "and reopened the door to the world as it was meant to be.",
    },
    {
        "img": "v2-06-join-it.png",
        "title": "6. NOW WE CAN JOIN IT.",
        "body": "The good Kingdom is here now, growing wherever people trust Him — "
                "and one day it will fill the whole renewed earth.",
    },
    {
        "img": "v2-02-messed-it-up.png",
        "title": "7. WILL YOU STAY IN YOUR KINGDOM...",
        "body": "the one you built by yourself, with you on the throne, "
                "that ends in the broken world above?",
    },
    {
        "img": "v2-01-good-world.png",
        "title": "...OR JOIN HIS?",
        "body": "the one He built for you, with Him on the throne, "
                "that ends in the good world above? He is asking.",
    },
]


def embed_image(path):
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def wrap_text(text, max_chars):
    return textwrap.wrap(text, width=max_chars)


def main():
    PAGE_W, PAGE_H = 850, 1100
    M = 36
    TITLE_H = 96
    FOOTER_H = 70
    GRID_TOP = M + TITLE_H + 14
    GRID_H = PAGE_H - GRID_TOP - FOOTER_H - 14
    COLS, ROWS = 2, 4
    GAP_X, GAP_Y = 20, 14
    PANEL_W = (PAGE_W - 2 * M - GAP_X * (COLS - 1)) // COLS
    PANEL_H = (GRID_H - GAP_Y * (ROWS - 1)) // ROWS
    IMG_H = int(PANEL_H * 0.60)
    CAPTION_TOP = IMG_H + 6

    # Embed each unique image only once, keyed by filename
    image_cache = {}
    for p in PANELS:
        if p["img"] not in image_cache:
            image_cache[p["img"]] = embed_image(os.path.join(IMG_DIR, p["img"]))

    parts = [
        f'<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {PAGE_W} {PAGE_H}" '
        f'font-family="\'Atkinson Hyperlegible\', \'Helvetica Neue\', Arial, sans-serif">',
        '<defs>',
        '<linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">',
        '<stop offset="0%" stop-color="#fdfaf2"/>',
        '<stop offset="100%" stop-color="#f5ecd5"/>',
        '</linearGradient>',
    ]
    for i in range(len(PANELS)):
        parts.append(
            f'<clipPath id="clip-{i}">'
            f'<rect x="0" y="0" width="{PANEL_W - 12}" height="{IMG_H}" rx="6"/>'
            f'</clipPath>'
        )
    parts.append('</defs>')

    parts.append(f'<rect width="{PAGE_W}" height="{PAGE_H}" fill="url(#bgGrad)"/>')

    # Title block
    parts.append(
        f'<text x="{PAGE_W//2}" y="{M + 44}" text-anchor="middle" '
        f'font-family="Georgia, serif" font-size="40" font-weight="700" fill="#1a1108">'
        f'An Invitation</text>'
    )
    parts.append(
        f'<text x="{PAGE_W//2}" y="{M + 70}" text-anchor="middle" '
        f'font-size="12" letter-spacing="3" fill="#5a4a20">'
        f'THE GOSPEL, WITHOUT THE THREAT</text>'
    )
    parts.append(
        f'<line x1="{PAGE_W//2 - 90}" y1="{M + 84}" x2="{PAGE_W//2 + 90}" y2="{M + 84}" '
        f'stroke="#c9a32b" stroke-width="1"/>'
    )

    # Panels
    for i, p in enumerate(PANELS):
        col = i % COLS
        row = i // COLS
        px = M + col * (PANEL_W + GAP_X)
        py = GRID_TOP + row * (PANEL_H + GAP_Y)

        img_data = image_cache[p["img"]]
        align = p.get("align", "xMidYMid slice")

        # Final row panels (7 and 8) get a distinguishing accent border
        is_final = i >= 6
        border_color = "#7a3a1a" if is_final else "#c9a32b"
        border_width = 2 if is_final else 1.5

        parts.append(f'<g transform="translate({px},{py})">')
        parts.append(
            f'<rect x="0" y="0" width="{PANEL_W}" height="{PANEL_H}" '
            f'fill="#ffffff" stroke="{border_color}" stroke-width="{border_width}" rx="8"/>'
        )
        parts.append(f'<g transform="translate(6,6)" clip-path="url(#clip-{i})">')
        parts.append(
            f'<image href="{img_data}" x="0" y="0" '
            f'width="{PANEL_W - 12}" height="{IMG_H}" '
            f'preserveAspectRatio="{align}"/>'
        )
        parts.append('</g>')
        parts.append(
            f'<line x1="18" y1="{6 + IMG_H + 5}" x2="{PANEL_W - 18}" y2="{6 + IMG_H + 5}" '
            f'stroke="{border_color}" stroke-width="0.5" stroke-dasharray="2,2"/>'
        )

        # Caption title — slightly smaller for long titles
        title_font_size = 12 if len(p["title"]) > 32 else 13
        parts.append(
            f'<text x="{PANEL_W//2}" y="{CAPTION_TOP + 22}" text-anchor="middle" '
            f'font-size="{title_font_size}" font-weight="700" fill="#1a1108">{p["title"]}</text>'
        )

        # Body wrapped
        lines = wrap_text(p["body"], 52)
        body_y_start = CAPTION_TOP + 38
        for li, line in enumerate(lines):
            parts.append(
                f'<text x="{PANEL_W//2}" y="{body_y_start + li * 12}" text-anchor="middle" '
                f'font-size="9.5" fill="#3a2c08">{line}</text>'
            )
        parts.append('</g>')

    # Footer
    foot_y = PAGE_H - FOOTER_H + 18
    parts.append(
        f'<line x1="{M + 60}" y1="{foot_y - 12}" x2="{PAGE_W - M - 60}" y2="{foot_y - 12}" '
        f'stroke="#c9a32b" stroke-width="0.8"/>'
    )
    parts.append(
        f'<text x="{PAGE_W//2}" y="{foot_y + 4}" text-anchor="middle" '
        f'font-size="12" font-weight="700" fill="#1a1108">'
        f'Not avoiding punishment. Saying yes to a Kingdom worth belonging to.</text>'
    )
    parts.append(
        f'<text x="{PAGE_W//2}" y="{foot_y + 22}" text-anchor="middle" '
        f'font-size="11" font-style="italic" fill="#5a4a20">'
        f'Curious? Read the Gospel of John. Or talk to whoever gave you this.</text>'
    )

    parts.append('</svg>')

    out = "\n".join(parts)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        f.write(out)
    print(f"Wrote {OUT_PATH} ({len(out)//1024} KB)")


if __name__ == "__main__":
    main()
