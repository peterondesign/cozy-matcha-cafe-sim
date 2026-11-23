#!/usr/bin/env python3
"""Split the supplied café sheets into transparent, size-aligned game assets."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "generated_images" / "cafes"
OUTPUT = ROOT / "menu" / "layers" / "shop" / "cafes"
SHEETS = {
    "none": "cafes_without_anything.png",
    "s": "cafes_without_L_and_G.png",
    "g": "cafes_without_s_g.png",
    "sl": "cafes_without_g.png",
    "sg": "cafes_without_l.png",
    "lg": "cafes_without_s.png",
    "slg": "cafes_with_everything.webp",
}
ROWS = [("small", 0, 306), ("medium", 306, 650), ("large", 650, 1152)]


def clean(image, white_background=False):
    pixels = np.array(image.convert("RGBA"))
    rgb = pixels[:, :, :3].astype(np.float32)
    alpha = pixels[:, :, 3].astype(np.int16)
    bright = np.min(rgb, axis=2)
    if white_background:
        # Recover antialiasing against white instead of leaving a white fringe.
        alpha = np.minimum(alpha, np.clip((255 - bright) * 16, 0, 255))
        pixels[:, :, :3] = np.where(
            alpha[:, :, None] > 0,
            np.clip(255 - (255 - rgb) * 255 / np.maximum(alpha[:, :, None], 1), 0, 255),
            0,
        ).astype(np.uint8)
        regions, _ = ndimage.label(bright > 215)
        counts = np.bincount(regions.ravel())
        alpha[(regions != 0) & (counts[regions] > 200)] = 0
    else:
        # Some supplied transparent sheets still contain large white holes.
        white = (bright > 225) & (alpha > 100)
        regions, _ = ndimage.label(white)
        counts = np.bincount(regions.ravel())
        remove = counts[regions] > 300
        remove &= regions != 0
        alpha[remove] = 0
        alpha = np.where(alpha < 24, 0, alpha)
    pixels[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(pixels)


def add_lighting(image):
    # The provided sheets omit lighting-only; add lights to the plain artwork.
    overlay = Image.new("RGBA", image.size)
    draw = ImageDraw.Draw(overlay)
    bounds = image.getchannel("A").getbbox()
    left, right = bounds[0] + 16, bounds[2] - 16
    base = 466
    for x in (left, right):
        draw.line((x, 300, x, base), fill=(99, 62, 35, 255), width=7)
        draw.ellipse((x - 5, 295, x + 5, 305), fill=(134, 83, 43, 255))
    for start, end in ((left, 490), (534, right)):
        points = [(round(start + (end - start) * t / 40),
                   round(300 + 24 * 4 * (t / 40) * (1 - t / 40))) for t in range(41)]
        draw.line(points, fill=(99, 62, 35, 255), width=3)
        for t in (8, 16, 24, 32):
            x, y = points[t]
            draw.ellipse((x - 4, y, x + 4, y + 9), fill=(255, 221, 130, 255),
                         outline=(162, 112, 52, 255), width=1)
    return Image.alpha_composite(overlay, image)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for variant, name in SHEETS.items():
        source = Image.open(SOURCE / name).convert("RGBA")
        if source.size != (2048, 1152):
            source = source.resize((2048, 1152), Image.Resampling.LANCZOS)
        source = clean(source, name.endswith(".webp"))
        for size, top, bottom in ROWS:
            row = source.crop((300, top, 1750, bottom))
            alpha = np.array(row.getchannel("A"))
            regions, _ = ndimage.label(alpha > 24)
            for edge in (0, alpha.shape[0] - 1):
                labels = np.unique(regions[edge])
                for label in labels[labels != 0]:
                    component = regions == label
                    ys = np.nonzero(component)[0]
                    if ys.max() - ys.min() < 24:
                        alpha[component] = 0
            row.putalpha(Image.fromarray(alpha))
            row.thumbnail((1024, 500), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (1024, 512))
            canvas.alpha_composite(row, ((1024 - row.width) // 2, 510 - row.height))
            canvas.save(OUTPUT / f"{size}-{variant}.png", optimize=True)
            if variant == "none":
                add_lighting(canvas).save(OUTPUT / f"{size}-l.png", optimize=True)


if __name__ == "__main__":
    main()
