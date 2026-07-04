"""読み取り専用: prod 投入前の Excel データ品質検証。

DB へは一切接続しない。Excel と migration の master seed を突き合わせて、
silent drop / UNIQUE 衝突 / 必須欠落 を洗い出す。
"""
from __future__ import annotations
import re, sys, unicodedata
from collections import Counter, defaultdict
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[2]
XLSX = ROOT / "Farmille_BS_materials_DB_template_detailed_prompt.xlsx"
MIG = ROOT / "supabase" / "migrations"

# ── helper（excel_to_seed_sql.py と同一ロジック）──
_KABU = [re.compile(r"株式会社"), re.compile(r"（株）"), re.compile(r"\(株\)")]
def norm_maker(name):
    if name is None: return ""
    s = unicodedata.normalize("NFKC", str(name))
    for p in _KABU: s = p.sub("", s)
    return s.strip()

_JBSA_PREFIX = re.compile(r"^\s*(?:\d+|推定：\d+)\.\s*")
def split_jbsa(raw):
    if raw is None or not str(raw).strip(): return []
    out=[]
    for p in re.split(r"[、,，]", str(raw)):
        c=_JBSA_PREFIX.sub("", p.strip()).strip()
        if c: out.append(c)
    return out

def split_crops(raw):
    if raw is None or not str(raw).strip(): return []
    out=[]
    for p in re.split(r"[、,，]", str(raw)):
        p=re.sub(r"[（(].*?[)）]","",p)
        p=re.sub(r"(など|等|ほか)$","",p).strip()
        if p: out.append(p)
    return out

def blank(v): return v is None or str(v).strip()==""

# ── master 抽出 ──
def extract_crops():
    txt=(MIG/"20260415000001_farmille_seed.sql").read_text(encoding="utf-8")
    # ('l1','l2','crop') の3要素タプル → 3要素目
    names=set()
    for m in re.finditer(r"\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)", txt):
        names.add(m.group(3))
    return names

def extract_benefits():
    txt=(MIG/"20260415000002_farmille_seedgenre.sql").read_text(encoding="utf-8")
    blk=re.search(r"INSERT INTO product_benefits.*?;", txt, re.S).group(0)
    return {m.group(2) for m in re.finditer(r"\(\s*'([^']*)'\s*,\s*'([^']*)'", blk)}

def extract_types():
    txt=(MIG/"20260415000002_farmille_seedgenre.sql").read_text(encoding="utf-8")
    blk=re.search(r"INSERT INTO product_types.*?;", txt, re.S).group(0)
    return {m.group(1) for m in re.finditer(r"\(\s*'([^']*)'", blk)}

def extract_certs():
    txt=(MIG/"20260424000000_certifications_seed.sql").read_text(encoding="utf-8")
    return {m.group(1) for m in re.finditer(r"'([^']*)'", txt)}

crops_master=extract_crops()
benefits_master=extract_benefits()
types_master=extract_types()

# ── Excel ──
wb=openpyxl.load_workbook(XLSX, data_only=True)
def sheet(name):
    ws=wb[name]; rows=list(ws.iter_rows(values_only=True)); hdr=rows[0]
    return [dict(zip(hdr,r)) for r in rows[1:] if any(c is not None and str(c).strip() for c in r)]

products=sheet("products")
recipes=sheet("application_recipes")
images=sheet("product_images")

print("="*70)
print(f"crops master={len(crops_master)} / benefits={len(benefits_master)} / types={sorted(types_master)}")
print(f"products={len(products)} recipes={len(recipes)} images={len(images)}")
print("="*70)

# 1. UNIQUE(name, maker_id) 衝突 = 同一(製品名, 正規化社名) 重複
print("\n■ 1. (product_name, normalized_maker) 重複 → UNIQUE衝突/UPSERT統合の危険")
keys=Counter((str(p.get("product_name")).strip(), norm_maker(p.get("company_name"))) for p in products)
dups=[(k,c) for k,c in keys.items() if c>1]
if dups:
    for (pn,mk),c in dups: print(f"  ⚠ {c}件: name='{pn}' maker='{mk}'")
else:
    print("  OK 重複なし")

# 2. 必須欠落
print("\n■ 2. 必須(product_name / company_name) 欠落")
miss=[i for i,p in enumerate(products,2) if blank(p.get("product_name")) or blank(p.get("company_name"))]
print(f"  欠落 {len(miss)} 行" + (f": {miss}" if miss else " (OK)"))

# 3. target_crops マスタ未収載 → product_crops silent drop
print("\n■ 3. target_crops のうち crops マスタに無い値 → product_crops が silent drop")
crop_miss=Counter()
for p in products:
    for c in split_crops(p.get("target_crops")):
        if c not in crops_master: crop_miss[c]+=1
print(f"  未収載クロップ種類数={len(crop_miss)} (出現上位)")
for c,n in crop_miss.most_common(40): print(f"    '{c}' ×{n}")

# 4. jbsa_effect_class マスタ未収載 → benefit silent drop
print("\n■ 4. jbsa_effect_class のうち product_benefits マスタに無い値 → silent drop")
ben_miss=Counter()
for p in products:
    for b in split_jbsa(p.get("jbsa_effect_class")):
        if b not in benefits_master: ben_miss[b]+=1
if ben_miss:
    for b,n in ben_miss.most_common(): print(f"    '{b}' ×{n}")
else:
    print("    OK 全て master に一致")

# 5. product_type 第1トークンの master 一致率
print("\n■ 5. product_type 第1トークン → master一致 / BS資材 fallback")
type_first=Counter()
for p in products:
    raw=p.get("product_type")
    first=re.split(r"[、,，]", str(raw))[0].strip() if not blank(raw) else ""
    type_first[first]+=1
matched=sum(n for t,n in type_first.items() if t in types_master)
print(f"  master一致={matched} / fallback(BS資材)={len(products)-matched}")
print("  第1トークン上位:")
for t,n in type_first.most_common(10): print(f"    '{t}' ×{n}  {'(master一致)' if t in types_master else '(→BS資材)'}")

# 6. confidence 値
print("\n■ 6. confidence 値分布（高→is_public=true）")
for k,n in Counter(str(p.get("confidence")).strip() for p in products).most_common():
    print(f"    '{k}' ×{n}")

# 7. recipes/images が products に存在しない (product_name,maker) を参照
prod_keys=set(keys.keys())
print("\n■ 7. recipes/images の (product_name, maker) が products に無い → silent skip")
for label,rows in (("recipes",recipes),("images",images)):
    orphan=Counter()
    for r in rows:
        k=(str(r.get("product_name")).strip(), norm_maker(r.get("company_name")))
        if k not in prod_keys: orphan[k]+=1
    print(f"  {label}: orphan {sum(orphan.values())}行 / {len(orphan)}種")
    for k,n in list(orphan.items())[:10]: print(f"    {k} ×{n}")

# 8. images: image_url skip 見込み
print("\n■ 8. product_images: image_url skip 見込み")
skipvals={"不明","TODO","明記なし","—","ー","-"}
img_skip=sum(1 for r in images if blank(r.get("image_url")) or str(r.get("image_url")).strip() in skipvals)
print(f"  skip見込み {img_skip} / {len(images)} 行")

# 9. メーカー一覧（作成対象40社）
print("\n■ 9. 正規化メーカー一覧（= maker_profiles.company_name として作成する社名）")
mk=Counter(norm_maker(p.get("company_name")) for p in products)
print(f"  ユニーク社数 = {len(mk)}")
existing={"ICL JAPAN","アグロ カネショウ","愛知製鋼"}
for m,n in sorted(mk.items()):
    tag="【既存】" if m in existing else "【新規作成】"
    print(f"    {tag} '{m}' : {n}製品")
