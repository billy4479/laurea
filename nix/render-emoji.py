"""Rasterize the game's emoji from the Nix-provided Noto Color Emoji font."""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

font = ImageFont.truetype(sys.argv[1], 109)  # Noto's native bitmap strike.
glyphs = json.loads(Path(sys.argv[2]).read_text())
output = Path(sys.argv[3])
for name, glyph in glyphs.items():
    left, top, right, bottom = font.getbbox(glyph)
    image = Image.new("RGBA", (right - left, bottom - top))
    ImageDraw.Draw(image).text((-left, -top), glyph, font=font, embedded_color=True)
    image = image.crop(image.getbbox())
    scale = 14 / max(image.size)
    image = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.NEAREST,
    )
    tile = Image.new("RGBA", (16, 16))
    tile.paste(image, ((16 - image.width) // 2, (16 - image.height) // 2))
    tile.save(output / f"emoji-{name}.png")
