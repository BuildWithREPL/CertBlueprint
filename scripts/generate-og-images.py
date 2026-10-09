"""Generate per-section Open Graph images (1200x630) into public/og/.

BaseLayout picks the most specific image that exists for a URL:
  /vendors/<slug>/...  -> og/vendor-<slug>.png
  /<section>/...       -> og/<section>.png
  anything else        -> og-default.png

Run after adding a vendor:  python scripts/generate-og-images.py
Requires Pillow and the Windows Segoe UI fonts (falls back to Arial).
"""
import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og"
FONTS = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"

W, H = 1200, 630
BG_TOP, BG_BOTTOM = (15, 23, 42), (30, 58, 138)
ACCENT = (96, 165, 250)


def font(names, size):
    for name in names:
        p = FONTS / name
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


BOLD = ["segoeuib.ttf", "arialbd.ttf"]
SEMI = ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"]
REG = ["segoeui.ttf", "arial.ttf"]


def wrap(draw, text, fnt, width):
    words, lines, line = text.split(), [], ""
    for w in words:
        trial = f"{line} {w}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def render(filename, eyebrow, title, subtitle):
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        c = tuple(round(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = c
    d = ImageDraw.Draw(img)

    # Brand mark + wordmark (mirrors the site header logo).
    d.rounded_rectangle((80, 70, 128, 118), radius=8, fill=(37, 64, 120))
    for y0, x1 in ((84, 116), (94, 112), (104, 104)):
        d.line((90, y0, x1, y0), fill=ACCENT, width=4)
    d.ellipse((108, 98, 122, 112), fill=ACCENT)
    brand = font(SEMI, 34)
    d.text((144, 74), "Cert", font=brand, fill=(241, 245, 249))
    d.text((144 + d.textlength("Cert", font=brand), 74), "Blueprint", font=brand, fill=ACCENT)

    d.text((80, 190), eyebrow.upper(), font=font(SEMI, 26), fill=ACCENT)

    tf = font(BOLD, 72)
    lines = wrap(d, title, tf, W - 160)
    if len(lines) > 2:
        tf = font(BOLD, 58)
        lines = wrap(d, title, tf, W - 160)[:3]
    y = 236
    for ln in lines:
        d.text((80, y), ln, font=tf, fill=(255, 255, 255))
        y += int(tf.size * 1.15)

    sf = font(REG, 32)
    for ln in wrap(d, subtitle, sf, W - 160)[:2]:
        d.text((80, y + 18), ln, font=sf, fill=(191, 219, 254))
        y += 44

    d.text((80, H - 70), "certblueprint.com", font=font(REG, 26), fill=(148, 163, 184))
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / filename, optimize=True)
    print("wrote", filename)


SECTIONS = {
    "navigator.png": ("IT Career Navigator", "Find the IT work you actually enjoy", "Free, scenario-based, runs in your browser. 41 interest dimensions, honest downsides for every role."),
    "vendors.png": ("Certification guides", "IT certification roadmaps & study plans", "What each exam tests, who it is for, and where to study — free and paid."),
    "paths.png": ("Career paths", "Role-by-role IT career roadmaps", "From first job to senior — the certifications and skills in the order that works."),
    "compare.png": ("Comparisons", "Honest certification head-to-heads", "The short answer first, a real side-by-side, and who should pick which."),
    "legal.png": ("CertBlueprint", "Policies & disclosures", "Privacy, affiliate disclosure, and terms of use."),
}

for fname, (eyebrow, title, sub) in SECTIONS.items():
    render(fname, eyebrow, title, sub)

for f in sorted((ROOT / "src" / "content" / "vendors").glob("*.json")):
    data = json.loads(f.read_text(encoding="utf-8"))
    slug = data["slug"]
    name = data.get("title") or data.get("vendor") or data.get("name") or slug
    render(f"vendor-{slug}.png", "Certification guides", f"{name} certifications", "Exam details, study paths, and honest resource picks for every level.")
