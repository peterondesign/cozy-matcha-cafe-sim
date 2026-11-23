#!/usr/bin/env python3
"""Build compact park sprite sheets from the registered source artwork."""
import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
source_dir = root / "rigging-test"
output_dir = root / "park" / "sprites"
manifest = json.loads((source_dir / "action-assets.json").read_text())
output_dir.mkdir(exist_ok=True)

for action, entries in manifest.items():
    for character, entry in entries.items():
        if character != "barista" and (character not in {"01", "02", "03", "04", "05", "06"} or not action.startswith("walk_")):
            continue
        if "file" not in entry or "columns" not in entry:
            continue
        name = Path(entry["file"])
        if name.name != str(name) or name.suffix.lower() != ".png":
            raise ValueError(f"Park sprite must be a PNG in rigging-test/: {name}")
        with Image.open(source_dir / name) as image:
            columns, rows = entry["columns"], entry["rows"]
            if image.width % columns or image.height % rows:
                raise ValueError(f"Invalid grid dimensions: {name}")
            cell_width, cell_height = image.width // columns, image.height // rows
            scale = min(1, 320 / cell_width)
            size = (round(cell_width * scale) * columns, round(cell_height * scale) * rows)
            image.convert("RGBA").resize(size, Image.Resampling.LANCZOS).save(
                output_dir / name.with_suffix(".webp"), "WEBP", lossless=True, method=4
            )
