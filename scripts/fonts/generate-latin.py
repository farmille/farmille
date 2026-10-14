"""Gen Interface JP の英数字を、本文の字間との差分だけ詰めて出力する。"""
from pathlib import Path
import hashlib
import re
import shutil

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "node_modules/gen-interface-jp"
OUTPUT = ROOT / "src/theme/fonts"
WEIGHTS = (400, 500, 600, 700, 800)
ASCII = set(range(48, 58)) | set(range(65, 91)) | set(range(97, 123))
FAMILY = "Farmille Gen Latin"
# 日本語の 0.04em から英数字の 0.02em へ、送り幅で差分を補正する。
ADJUSTMENT_EM = 0.02


def codepoints(ranges):
    result = set()
    for item in ranges.split(","):
        bounds = item.strip().removeprefix("U+").split("-")
        result.update(range(int(bounds[0], 16), int(bounds[-1], 16) + 1))
    return result


def generate():
    OUTPUT.mkdir(exist_ok=True)
    faces = []
    sources = []
    license_text = (SOURCE / "OFL.txt").read_text()
    copyright_text = license_text.split("\n\n", 1)[0]
    for weight in WEIGHTS:
        css = (SOURCE / f"{weight}.css").read_text()
        covered = set()
        for filename, ranges in re.findall(r'url\("([^\"]+)"\).*?unicode-range:([^;]+);', css):
            selected = codepoints(ranges) & ASCII
            if not selected:
                continue
            source = SOURCE / filename
            font = TTFont(source, recalcTimestamp=False)
            adjustment = round(font["head"].unitsPerEm * ADJUSTMENT_EM)
            options = subset.Options()
            # 数字の等幅表示とカーニングを保つ。合字は1文字ずつの字間と両立しない。
            options.layout_features = ["kern", "tnum"]
            options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
            subsetter = subset.Subsetter(options=options)
            subsetter.populate(unicodes=selected)
            subsetter.subset(font)
            glyphs = set(font.getBestCmap().values())
            if "GSUB" in font:
                for lookup in font["GSUB"].table.LookupList.Lookup:
                    if lookup.LookupType != 1:
                        raise ValueError("数字の置換以外の GSUB が残っている")
                    for table in lookup.SubTable:
                        glyphs.update(table.mapping.values())
            for glyph in glyphs:
                advance, bearing = font["hmtx"].metrics[glyph]
                font["hmtx"].metrics[glyph] = (advance - adjustment, bearing)
            for record in font["name"].names:
                names = {1: FAMILY, 2: str(weight), 3: f"FarmilleGenLatin-{weight}",
                         4: f"{FAMILY} {weight}", 6: f"FarmilleGenLatin-{weight}",
                         16: FAMILY, 17: str(weight)}
                if record.nameID in names:
                    record.string = names[record.nameID].encode(record.getEncoding())
            # 配信される WOFF2 単体にも著作権表示と OFL を含める。
            for name_id, value in ((0, copyright_text), (13, license_text),
                                   (14, "https://openfontlicense.org/")):
                font["name"].setName(value, name_id, 3, 1, 0x409)
            target = f"gen-latin-{weight}-{source.stem}.woff2"
            font.flavor = "woff2"
            font.save(OUTPUT / target)
            unicode_range = ", ".join(f"U+{cp:04X}" for cp in sorted(selected))
            faces.append(f'''@font-face {{
  font-family: "{FAMILY}";
  font-style: normal;
  font-weight: {weight};
  font-display: swap;
  src: url("./{target}") format("woff2");
  unicode-range: {unicode_range};
}}''')
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            sources.append(f"{digest}  {weight}:{filename}")
            covered.update(selected)
        if covered != ASCII:
            raise ValueError(f"weight {weight}: 英数字の収録範囲が不足している")
    (OUTPUT / "latin.css").write_text("\n\n".join(faces) + "\n")
    (OUTPUT / "sources.sha256").write_text("\n".join(sources) + "\n")
    shutil.copyfile(SOURCE / "OFL.txt", OUTPUT / "OFL.txt")


if __name__ == "__main__":
    generate()
