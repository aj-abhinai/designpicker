# build.py generates the static picker site into dist/.
# Reads the catalog from data.designs, computes palette contrast ratios,
# and emits index.html plus one page per design in dist/design/.

import datetime
import json
import shutil
from pathlib import Path

from data.designs import DESIGNS, FONTS, PAIRINGS, PALETTES, POSTER, PRINCIPLES, TEXTURES

ROOT = Path(__file__).parent
DIST = ROOT / "dist"


def _relative_luminance(hex_color: str) -> float:
    value = hex_color.lstrip("#")
    r, g, b = (int(value[i : i + 2], 16) / 255 for i in (0, 2, 4))
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in (r, g, b)]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def _contrast_ratio(a: str, b: str) -> float:
    la, lb = _relative_luminance(a), _relative_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def _contrast_line(palette: dict) -> str:
    bg = palette["background"]
    text = _contrast_ratio(palette["foreground"], bg)
    muted = _contrast_ratio(palette["muted"], bg)
    accent = _contrast_ratio(palette["accent"], bg)
    return f"text {text:.1f}:1, muted {muted:.1f}:1, accent {accent:.1f}:1 against primary"


def _data_json() -> str:
    palettes = [{**p, "contrast": _contrast_line(p)} for p in PALETTES]
    data = {
        "palettes": palettes,
        "pairings": PAIRINGS,
        "designs": DESIGNS,
        "poster": POSTER,
        "principles": PRINCIPLES,
        "textures": TEXTURES,
    }
    return json.dumps(data, ensure_ascii=False)


def _fonts_url() -> str:
    return "https://fonts.googleapis.com/css2?" + "&".join(f"family={f}" for f in FONTS) + "&display=swap"


def _render(template_name: str, out_path: Path, title: str, design_id: str, root: str) -> None:
    html = (ROOT / "site" / template_name).read_text(encoding="utf-8")
    html = (
        html.replace("__TITLE__", title)
        .replace("__DESIGN_ID__", design_id)
        .replace("__ROOT__", root)
        .replace("__YEAR__", str(datetime.date.today().year))
        .replace("__FONTS_URL__", _fonts_url())
        .replace("__DATA_JSON__", _data_json())
    )
    out_path.write_text(html, encoding="utf-8")


def _validate() -> None:
    palette_ids = {p["id"] for p in PALETTES}
    pairing_ids = {p["id"] for p in PAIRINGS}
    principle_ids = {p["id"] for p in PRINCIPLES}
    problems = []
    for design in DESIGNS:
        if design["palette"] not in palette_ids:
            problems.append(f"{design['id']}: unknown palette '{design['palette']}'")
        if design["pairing"] not in pairing_ids:
            problems.append(f"{design['id']}: unknown pairing '{design['pairing']}'")
        for pid in design.get("principles", []):
            if pid not in principle_ids:
                problems.append(f"{design['id']}: unknown principle '{pid}'")
        for key in ("structure", "spacing", "density", "corners"):
            if not design["layout"].get(key):
                problems.append(f"{design['id']}: layout.{key} is empty")
    if problems:
        raise ValueError("Invalid catalog references:\n  " + "\n  ".join(problems))


def build() -> None:
    _validate()
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    (DIST / "design").mkdir()

    _render("index.template.html", DIST / "index.html", "Design Picker — design.md", "", "")

    for design in DESIGNS:
        _render(
            "design.template.html",
            DIST / "design" / f"{design['id']}.html",
            f"{design['name']} — design.md",
            design["id"],
            "../",
        )

    shutil.copy(ROOT / "site" / "style.css", DIST / "style.css")
    shutil.copy(ROOT / "site" / "app.js", DIST / "app.js")

    print(f"built {len(DESIGNS)} designs -> {DIST}")


if __name__ == "__main__":
    build()
