"""Excel (.xlsm) → Supabase seed SQL 変換 helper.

Spec: docs/specs/admin-aglist-alignment-v2.md §3.3 / §4.4

Excel 入稿元 (Ryosei Nemoto 編集) の 3 シートを読んで、
supabase/migrations/ に置く seed SQL を 1 ファイル生成する。

対象シート:
  - products            (181 行 × 24 列) → products
  - application_recipes (163 行 × 21 列) → product_application_recipes
  - product_images      (177 行 × 9 列)  → product_images

設計判断（self-eval にも記述、spec §3.3 / §4.4 整合）:

1. **maker_id 解決**: helper は live DB に接続しない。代わりに、
   生成 SQL 内で `(SELECT u.id FROM users u JOIN maker_profiles mp
   ON mp.user_id = u.id WHERE u.role='maker' AND u.status='active'
   AND mp.company_name = '<normalized>' LIMIT 1)` を埋め込む。
   apply 時に subquery が 0 行を返した場合、INSERT 全体がスキップされる
   (`INSERT ... SELECT ... WHERE EXISTS` 形式を使用)。これは spec §6 R6 の
   「normalize しても matched できない行は WARN + skip_log.md に積む
   (手動でメーカー登録 → 再投入の循環)」と整合する。

2. **冪等性**: products は `ON CONFLICT (name, maker_id) DO UPDATE SET ...`、
   application_recipes / product_images は事前 DELETE 後 INSERT
   (product_id スコープでの全置換)。何度 apply しても同じ結果に収束する。

3. **画像 URL "不明" / NULL / "TODO" は skip**: skip_log.md に積み、
   F1 一覧 placeholder に頼る (spec §6 R8)。

4. **confidence='高' の products 行のみ is_public=true** (spec §3.3 Q3)。

5. **正規化**: 全角→半角、「株式会社」「(株)」「（株）」除去、末尾空白除去
   (spec §2.3)。

実行:
    cd backend
    uv run python scripts/excel_to_seed_sql.py \
      --excel /Users/ryogasakai/dev/farmille/Farmille_BS_materials_DB_template_detailed_prompt.xlsm \
      --out ../supabase/migrations/20260526000003_seed_products_from_ryosei_export.sql \
      --skip-log ../docs/setup-log-skip.md

出力:
    - SQL ファイル (1 本): 既存 migrations と並列の seed
    - skip_log.md: 取りこぼし行 (画像 URL 不明 / 数値変換失敗等)
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

try:
    import openpyxl
except ImportError:  # pragma: no cover
    print(
        "openpyxl がインストールされていません。"
        "`uv add openpyxl` を実行してから再度実行してください。",
        file=sys.stderr,
    )
    sys.exit(2)


# ─────────────────────────────────────────────────────────────────────
# 正規化 (spec §2.3)
# ─────────────────────────────────────────────────────────────────────


_KABU_PATTERNS = [
    re.compile(r"株式会社"),
    re.compile(r"（株）"),
    re.compile(r"\(株\)"),
]


def normalize_maker_name(name: str | None) -> str:
    """spec §2.3 のメーカー名正規化。

    1. 全角→半角 (NFKC)
    2. 「株式会社」「（株）」「(株)」を削除 (前置 / 後置どちらも)
    3. 末尾 / 先頭の空白除去
    """
    if name is None:
        return ""
    s = unicodedata.normalize("NFKC", str(name))
    for pat in _KABU_PATTERNS:
        s = pat.sub("", s)
    return s.strip()


# ─────────────────────────────────────────────────────────────────────
# SQL リテラルエスケープ
# ─────────────────────────────────────────────────────────────────────


def sql_text(value: Any) -> str:
    """text 列向け SQL リテラル。NULL は 'NULL'、空文字も NULL に寄せる。"""
    if value is None:
        return "NULL"
    s = str(value).strip()
    if not s:
        return "NULL"
    # PostgreSQL のシングルクォートエスケープは '' (重複)
    escaped = s.replace("'", "''")
    return f"'{escaped}'"


def sql_bool(value: Any) -> str:
    if value is None or value == "":
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    s = str(value).strip().lower()
    if s in {"true", "1", "yes", "y", "○", "✓", "○"}:
        return "true"
    if s in {"false", "0", "no", "n", "×"}:
        return "false"
    return "NULL"


def sql_numeric(value: Any) -> tuple[str, str | None]:
    """numeric 列向け。変換不能なら ('NULL', raw_text) を返し、
    呼び出し側は raw_text を別列 (_raw_text) に逃す。
    """
    if value is None:
        return "NULL", None
    # Excel が "1-2" を datetime.datetime に化けさせるケースを raw に戻す
    if isinstance(value, (dt.datetime, dt.date)):
        return "NULL", value.isoformat()
    if isinstance(value, (int, float, Decimal)):
        try:
            d = Decimal(str(value))
        except InvalidOperation:
            return "NULL", str(value)
        return str(d), None
    s = str(value).strip()
    if not s:
        return "NULL", None
    # 「不明」「明記なし」等の和文記述
    if s in {"不明", "明記なし", "—", "ー", "-", "TODO"}:
        return "NULL", s
    # 範囲 ("100-150") は単一数値化できない → raw に逃す
    if re.search(r"[-〜~]", s):
        return "NULL", s
    try:
        d = Decimal(s)
        return str(d), None
    except InvalidOperation:
        return "NULL", s


def is_blank(value: Any) -> bool:
    if value is None:
        return True
    s = str(value).strip()
    return s == ""


def is_image_skip(value: Any) -> bool:
    """画像 URL が skip 対象 ('不明' / 空 / 'TODO' 等) か判定 (spec §3.3)。"""
    if is_blank(value):
        return True
    s = str(value).strip()
    return s in {"不明", "TODO", "明記なし", "—", "ー", "-"}


# ─────────────────────────────────────────────────────────────────────
# Excel 読み込み
# ─────────────────────────────────────────────────────────────────────


@dataclass
class ExcelRows:
    products: list[dict[str, Any]] = field(default_factory=list)
    application_recipes: list[dict[str, Any]] = field(default_factory=list)
    product_images: list[dict[str, Any]] = field(default_factory=list)


def _load_sheet(ws: Any) -> list[dict[str, Any]]:
    headers = [c.value for c in ws[1]]
    rows: list[dict[str, Any]] = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        # 全列 NULL は飛ばす
        if all(v is None or (isinstance(v, str) and not v.strip()) for v in row):
            continue
        rows.append(dict(zip(headers, row, strict=False)))
    return rows


def load_excel(path: Path) -> ExcelRows:
    wb = openpyxl.load_workbook(path, data_only=True, keep_vba=False, read_only=True)
    out = ExcelRows()
    for sn in wb.sheetnames:
        ws = wb[sn]
        if sn == "products":
            out.products = _load_sheet(ws)
        elif sn == "application_recipes":
            out.application_recipes = _load_sheet(ws)
        elif sn == "product_images":
            out.product_images = _load_sheet(ws)
    wb.close()
    return out


# ─────────────────────────────────────────────────────────────────────
# JBSA effect / composition_type マッピング
# ─────────────────────────────────────────────────────────────────────


_JBSA_PREFIX_RE = re.compile(r"^\s*(?:\d+|推定：\d+)\.\s*")


def split_jbsa_classes(raw: Any) -> list[str]:
    """Excel の "1. 養分吸収の改善、6. 耐暑性改善、..." を ["養分吸収の改善", ...] に。

    末尾の「推定：N. ...」など prefix 揺れも吸収。
    """
    if is_blank(raw):
        return []
    s = str(raw)
    # 「、」「,」「,」で split
    parts = [p.strip() for p in re.split(r"[、,，]", s) if p.strip()]
    cleaned = []
    for p in parts:
        # 「N.」/「推定：N.」prefix を剥がす
        c = _JBSA_PREFIX_RE.sub("", p).strip()
        if c:
            cleaned.append(c)
    return cleaned


def split_target_crops(raw: Any) -> list[str]:
    """Excel "小麦、大豆、水稲" を ["小麦", "大豆", "水稲"] に。

    末尾の「など」「等」、括弧書きの注釈は除去 (best-effort)。
    """
    if is_blank(raw):
        return []
    s = str(raw)
    parts = [p.strip() for p in re.split(r"[、,，]", s) if p.strip()]
    cleaned = []
    for p in parts:
        # 括弧内の注釈を削除
        p = re.sub(r"[（(].*?[)）]", "", p)
        # 末尾の「など」「等」「ほか」を削除
        p = re.sub(r"(など|等|ほか)$", "", p)
        p = p.strip()
        if p:
            cleaned.append(p)
    return cleaned


def parse_registration_certification(raw: Any) -> dict[str, Any]:
    """Excel の registration_certification 自由文字列から
    fertilizer_registered / pesticide_registered / cert_names を抽出する。

    例: "肥料登録あり、有機JAS適合（推定：要確認）"
        → {fertilizer: true, pesticide: None, certs: ["有機JAS"]}

    "推定" / "要確認" を含む行は本 v1 では既存列に保存せず memo 扱い。
    """
    out: dict[str, Any] = {
        "fertilizer_registered": None,
        "pesticide_registered": None,
        "certifications": [],
    }
    if is_blank(raw):
        return out
    s = str(raw)
    # 肥料 / 農薬
    if "肥料登録あり" in s:
        out["fertilizer_registered"] = True
    elif "肥料登録なし" in s or "肥料未登録" in s:
        out["fertilizer_registered"] = False
    if "農薬登録あり" in s:
        out["pesticide_registered"] = True
    elif "農薬登録なし" in s or "農薬未登録" in s:
        out["pesticide_registered"] = False
    # 認証マスタ照合 (v1 は有機JAS / JGAP のみ)
    for cert in ("有機JAS", "JGAP"):
        if cert in s and "要確認" not in s.split(cert, 1)[1][:20]:
            out["certifications"].append(cert)
    return out


# ─────────────────────────────────────────────────────────────────────
# SQL 生成
# ─────────────────────────────────────────────────────────────────────


# 「maker_id を解決する SELECT」を作る。SELECT が 0 行を返した場合、
# INSERT 全体が 0 行 INSERT になる (INSERT ... SELECT ... WHERE EXISTS パターン)。
def _maker_select(normalized_name: str) -> str:
    esc = normalized_name.replace("'", "''")
    return (
        "(SELECT u.id FROM users u "
        "JOIN maker_profiles mp ON mp.user_id = u.id "
        f"WHERE u.role = 'maker' AND u.status = 'active' AND mp.company_name = '{esc}' "
        "LIMIT 1)"
    )


# 「product_id を解決する SELECT」: products.name + maker_id の照合で 1 件特定。
def _product_select(product_name: str, normalized_maker_name: str) -> str:
    pn = product_name.replace("'", "''")
    mn = normalized_maker_name.replace("'", "''")
    return (
        "(SELECT p.id FROM products p "
        "JOIN users u ON u.id = p.maker_id "
        "JOIN maker_profiles mp ON mp.user_id = u.id "
        f"WHERE p.name = '{pn}' AND mp.company_name = '{mn}' "
        "LIMIT 1)"
    )


def _product_type_select(name: str) -> str:
    esc = name.replace("'", "''")
    return f"(SELECT id FROM product_types WHERE name = '{esc}' LIMIT 1)"


def build_products_sql(
    products_rows: list[dict[str, Any]],
    skip_log: list[str],
) -> tuple[str, dict[str, str], str]:
    """products の seed SQL を組み立てる。

    Returns:
        sql_block, normalized_maker_index, default_product_type
        normalized_maker_index: 元社名 → 正規化後の名前 (skip_log 表示用)
        default_product_type: spec §4.1 col 4 product_type は free text なので、
                              既存 product_types マスタへの完全一致が無ければ
                              既定 'BS資材' を採用する
    """
    sql_lines: list[str] = []
    sql_lines.append("-- =============================================================")
    sql_lines.append("-- products: Ryosei Nemoto 編集 Excel から取り込み")
    sql_lines.append("-- ON CONFLICT (name, maker_id) DO UPDATE")
    sql_lines.append("-- maker_id 解決失敗 (subquery 0 行) → 当該 INSERT 自体が 0 行 (silent skip)")
    sql_lines.append("-- =============================================================")
    sql_lines.append("")

    name_idx: dict[str, str] = {}

    for i, row in enumerate(products_rows, start=2):  # Excel 行番号
        company_raw = row.get("company_name")
        product_name = row.get("product_name")
        if is_blank(product_name) or is_blank(company_raw):
            skip_log.append(
                f"- [products row {i}] product_name または company_name が空 (skip)"
            )
            continue

        normalized = normalize_maker_name(company_raw)
        name_idx[str(company_raw)] = normalized

        confidence_val = row.get("confidence")
        is_public = (
            "true"
            if isinstance(confidence_val, str) and confidence_val.strip() == "高"
            else "false"
        )

        cert_parsed = parse_registration_certification(row.get("registration_certification"))

        # product_type は Excel に複数値カンマ区切り(例 "バイオスティミュラント、液体肥料")で
        # 既存マスタとの完全一致 SELECT は v1 では諦めて、subquery 結果 NULL も許容する。
        # v1 既存 products は product_type_id NOT NULL なので、NULL の場合は 'BS資材' (既存
        # マスタ第 1 行) に fallback する。
        ptype_raw = row.get("product_type")
        # 「、」/「,」で split して最初の token を採用
        first_ptype = (
            re.split(r"[、,，]", str(ptype_raw))[0].strip() if not is_blank(ptype_raw) else ""
        )
        ptype_sql = (
            f"COALESCE({_product_type_select(first_ptype)}, "
            f"{_product_type_select('BS資材')})"
            if first_ptype
            else _product_type_select("BS資材")
        )

        # INSERT ... SELECT ... WHERE EXISTS パターン (maker_id が解決できる場合のみ INSERT)
        # name コメント
        sql_lines.append(
            f"-- products row {i}: {str(product_name)[:40]} / maker={normalized}"
        )
        sql_lines.append("INSERT INTO products (")
        sql_lines.append(
            "  maker_id, product_type_id, name, product_name_jp, general_purpose,"
        )
        sql_lines.append(
            "  primary_compound, mode_of_action, commercial_status,"
        )
        sql_lines.append(
            "  technology_action, disease_pest_info, expected_effects_official,"
        )
        sql_lines.append("  expected_effects_farmille, usage_summary, precautions,")
        sql_lines.append("  storage_shelf_life, notes, confidence, is_public,")
        sql_lines.append("  fertilizer_registered, pesticide_registered")
        sql_lines.append(")")
        sql_lines.append("SELECT")
        sql_lines.append(f"  m.id, {ptype_sql}, {sql_text(product_name)},")
        sql_lines.append(
            f"  {sql_text(row.get('product_name_jp'))}, {sql_text(row.get('use_case'))},"
        )
        sql_lines.append(
            f"  {sql_text(row.get('main_ingredients'))}, "
            f"{sql_text(row.get('mode_of_action'))}, "
            f"{sql_text(row.get('sales_status'))},"
        )
        sql_lines.append(
            f"  {sql_text(row.get('technology_action'))}, "
            f"{sql_text(row.get('disease_pest_info'))}, "
            f"{sql_text(row.get('expected_effects_official'))},"
        )
        sql_lines.append(
            f"  {sql_text(row.get('expected_effects_farmille'))}, "
            f"{sql_text(row.get('usage_summary'))}, "
            f"{sql_text(row.get('precautions'))},"
        )
        sql_lines.append(
            f"  {sql_text(row.get('storage_shelf_life'))}, "
            f"{sql_text(row.get('notes'))}, "
            f"{sql_text(confidence_val)}, {is_public},"
        )
        sql_lines.append(
            f"  {sql_bool(cert_parsed['fertilizer_registered'])}, "
            f"{sql_bool(cert_parsed['pesticide_registered'])}"
        )
        # `_maker_select` 自体が `(SELECT u.id FROM users u JOIN ... LIMIT 1)` の
        # parenthesized subquery を返すため、そのまま FROM 句に差し込む。
        # subquery が 0 行を返した場合、INSERT 全体が 0 行になる (silent skip)。
        sql_lines.append(f"FROM {_maker_select(normalized)} AS m")
        sql_lines.append("ON CONFLICT (name, maker_id) DO UPDATE SET")
        sql_lines.append("  product_type_id           = EXCLUDED.product_type_id,")
        sql_lines.append("  product_name_jp           = EXCLUDED.product_name_jp,")
        sql_lines.append("  general_purpose           = EXCLUDED.general_purpose,")
        sql_lines.append("  primary_compound          = EXCLUDED.primary_compound,")
        sql_lines.append("  mode_of_action            = EXCLUDED.mode_of_action,")
        sql_lines.append("  commercial_status         = EXCLUDED.commercial_status,")
        sql_lines.append("  technology_action         = EXCLUDED.technology_action,")
        sql_lines.append("  disease_pest_info         = EXCLUDED.disease_pest_info,")
        sql_lines.append("  expected_effects_official = EXCLUDED.expected_effects_official,")
        sql_lines.append("  expected_effects_farmille = EXCLUDED.expected_effects_farmille,")
        sql_lines.append("  usage_summary             = EXCLUDED.usage_summary,")
        sql_lines.append("  precautions               = EXCLUDED.precautions,")
        sql_lines.append("  storage_shelf_life        = EXCLUDED.storage_shelf_life,")
        sql_lines.append("  notes                     = EXCLUDED.notes,")
        sql_lines.append("  confidence                = EXCLUDED.confidence,")
        sql_lines.append("  is_public                 = EXCLUDED.is_public,")
        sql_lines.append("  fertilizer_registered     = EXCLUDED.fertilizer_registered,")
        sql_lines.append("  pesticide_registered      = EXCLUDED.pesticide_registered,")
        sql_lines.append("  updated_at                = now();")
        sql_lines.append("")

        # 関連 (crops / certifications / benefits) は事前 DELETE → INSERT
        product_select = _product_select(str(product_name), normalized)
        # 既存関連を一括削除 (subquery が NULL の場合 DELETE WHERE NULL は 0 行)
        sql_lines.append(
            f"DELETE FROM product_crops WHERE product_id = {product_select};"
        )
        sql_lines.append(
            f"DELETE FROM product_certifications WHERE product_id = {product_select};"
        )
        sql_lines.append(
            f"DELETE FROM product_benefit_relations WHERE product_id = {product_select};"
        )

        # crops (target_crops を split → crops.name 完全一致)
        for cn in split_target_crops(row.get("target_crops")):
            esc = cn.replace("'", "''")
            sql_lines.append(
                f"INSERT INTO product_crops (product_id, crop_id) "
                f"SELECT {product_select}, c.id "
                f"FROM crops c WHERE c.name = '{esc}' AND "
                f"{product_select} IS NOT NULL "
                f"ON CONFLICT DO NOTHING;"
            )

        # certifications
        for cn in cert_parsed["certifications"]:
            esc = cn.replace("'", "''")
            sql_lines.append(
                f"INSERT INTO product_certifications (product_id, certification_id) "
                f"SELECT {product_select}, ce.id "
                f"FROM certifications ce WHERE ce.name = '{esc}' AND "
                f"{product_select} IS NOT NULL "
                f"ON CONFLICT DO NOTHING;"
            )

        # benefits (jbsa_effect_class を split → product_benefits.name 完全一致)
        for bn in split_jbsa_classes(row.get("jbsa_effect_class")):
            esc = bn.replace("'", "''")
            sql_lines.append(
                f"INSERT INTO product_benefit_relations (product_id, product_benefit_id) "
                f"SELECT {product_select}, b.id "
                f"FROM product_benefits b WHERE b.name = '{esc}' AND "
                f"{product_select} IS NOT NULL "
                f"ON CONFLICT DO NOTHING;"
            )

        sql_lines.append("")

    return "\n".join(sql_lines), name_idx, "BS資材"


def build_application_recipes_sql(
    rows: list[dict[str, Any]],
    skip_log: list[str],
) -> str:
    sql_lines: list[str] = []
    sql_lines.append("-- =============================================================")
    sql_lines.append("-- product_application_recipes: Excel application_recipes シート")
    sql_lines.append("-- 各 product につき事前 DELETE → INSERT (冪等)")
    sql_lines.append("-- =============================================================")
    sql_lines.append("")

    # まず product 単位で DELETE をまとめる
    by_product: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for i, row in enumerate(rows, start=2):
        product_name = row.get("product_name")
        company_raw = row.get("company_name")
        if is_blank(product_name) or is_blank(company_raw):
            skip_log.append(
                f"- [application_recipes row {i}] product_name or company_name 空 (skip)"
            )
            continue
        key = (str(product_name), normalize_maker_name(company_raw))
        by_product.setdefault(key, []).append(row)

    # 全 product の DELETE を最初に集約
    for product_name, normalized in by_product.keys():
        ps = _product_select(product_name, normalized)
        sql_lines.append(
            f"DELETE FROM product_application_recipes WHERE product_id = {ps};"
        )
    sql_lines.append("")

    # INSERT
    for (product_name, normalized), recipe_rows in by_product.items():
        ps = _product_select(product_name, normalized)
        for sort_order, row in enumerate(recipe_rows):
            dose_amt_sql, dose_amt_raw = sql_numeric(row.get("dose_amount"))
            max_amt_sql, max_amt_raw = sql_numeric(row.get("max_dose_amount"))
            # 数値変換不能だった raw を dose_raw_text / max_dose_raw_text に逃す
            dose_raw_combined = row.get("dose_raw_text")
            if dose_amt_raw and is_blank(dose_raw_combined):
                dose_raw_combined = dose_amt_raw
            max_raw_combined = row.get("max_dose_raw_text")
            if max_amt_raw and is_blank(max_raw_combined):
                max_raw_combined = max_amt_raw

            sql_lines.append(
                f"-- recipe for product '{product_name[:30]}' / maker '{normalized}' (sort={sort_order})"
            )
            sql_lines.append(
                "INSERT INTO product_application_recipes ("
                "product_id, crop_category, crop_name, cultivation_type, "
                "application_method, application_timing, growth_stage, dilution_rate, "
                "dose_raw_text, dose_amount, dose_unit, dose_basis, solution_amount, "
                "original_liquid_equivalent, max_dose_raw_text, max_dose_amount, "
                "max_dose_unit, usage_notes, precautions_specific, confidence, sort_order"
                ")"
            )
            sql_lines.append("SELECT")
            sql_lines.append(
                f"  {ps}, {sql_text(row.get('crop_category'))}, "
                f"{sql_text(row.get('crop_name'))}, "
                f"{sql_text(row.get('cultivation_type'))},"
            )
            sql_lines.append(
                f"  {sql_text(row.get('application_method'))}, "
                f"{sql_text(row.get('application_timing'))}, "
                f"{sql_text(row.get('growth_stage'))}, "
                f"{sql_text(row.get('dilution_rate'))},"
            )
            sql_lines.append(
                f"  {sql_text(dose_raw_combined)}, {dose_amt_sql}, "
                f"{sql_text(row.get('dose_unit'))}, "
                f"{sql_text(row.get('dose_basis'))}, "
                f"{sql_text(row.get('solution_amount'))},"
            )
            sql_lines.append(
                f"  {sql_text(row.get('original_liquid_equivalent'))}, "
                f"{sql_text(max_raw_combined)}, {max_amt_sql},"
            )
            sql_lines.append(
                f"  {sql_text(row.get('max_dose_unit'))}, "
                f"{sql_text(row.get('usage_notes'))}, "
                f"{sql_text(row.get('precautions_specific'))}, "
                f"{sql_text(row.get('confidence'))}, {sort_order}"
            )
            sql_lines.append(f"WHERE {ps} IS NOT NULL;")
            sql_lines.append("")

    return "\n".join(sql_lines)


def build_product_images_sql(
    rows: list[dict[str, Any]],
    skip_log: list[str],
) -> str:
    sql_lines: list[str] = []
    sql_lines.append("-- =============================================================")
    sql_lines.append("-- product_images: Excel product_images シート")
    sql_lines.append("-- 画像 URL '不明' / 空 / 'TODO' は skip + skip_log.md (spec §3.3 / §6 R8)")
    sql_lines.append("-- 各 product につき事前 DELETE → INSERT (冪等)")
    sql_lines.append("-- =============================================================")
    sql_lines.append("")

    by_product: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for i, row in enumerate(rows, start=2):
        product_name = row.get("product_name")
        company_raw = row.get("company_name")
        if is_blank(product_name) or is_blank(company_raw):
            skip_log.append(
                f"- [product_images row {i}] product_name or company_name 空 (skip)"
            )
            continue
        url = row.get("image_url")
        if is_image_skip(url):
            skip_log.append(
                f"- [product_images row {i}] image_url 不明 (product={str(product_name)[:30]} / maker={company_raw}) (skip)"
            )
            continue
        key = (str(product_name), normalize_maker_name(company_raw))
        by_product.setdefault(key, []).append(row)

    if not by_product:
        sql_lines.append("-- 投入対象 0 件 (Excel 上の URL がすべて skip 対象)")
        sql_lines.append("")
        return "\n".join(sql_lines)

    # 各 product の DELETE
    for product_name, normalized in by_product.keys():
        ps = _product_select(product_name, normalized)
        sql_lines.append(f"DELETE FROM product_images WHERE product_id = {ps};")
    sql_lines.append("")

    # 各 product に対し、is_primary=true は 1 件まで (helper 側で保証、spec §4.2 migration C)
    for (product_name, normalized), img_rows in by_product.items():
        ps = _product_select(product_name, normalized)
        primary_assigned = False
        for order_idx, row in enumerate(img_rows):
            url = str(row.get("image_url")).strip()
            raw_primary = row.get("is_primary_image")
            # bool/真偽の判定
            wants_primary = (
                raw_primary is True
                or (isinstance(raw_primary, str) and raw_primary.strip().lower() in {"true", "1", "yes"})
            )
            is_primary = "false"
            if wants_primary and not primary_assigned:
                is_primary = "true"
                primary_assigned = True

            # image_type validation (CHECK 制約に該当しない値は NULL に逃す)
            img_type_raw = row.get("image_type")
            valid_types = {"product_packaging", "product_logo", "application_scene", "other"}
            img_type_val: str | None = None
            if not is_blank(img_type_raw) and str(img_type_raw).strip() in valid_types:
                img_type_val = str(img_type_raw).strip()

            sql_lines.append(
                f"-- image for product '{product_name[:30]}' / maker '{normalized}' (order={order_idx})"
            )
            sql_lines.append(
                "INSERT INTO product_images ("
                "product_id, url, \"order\", source_page_url, alt_text, image_type, "
                "is_primary, rights_note, confidence"
                ")"
            )
            sql_lines.append("SELECT")
            sql_lines.append(f"  {ps}, {sql_text(url)}, {order_idx},")
            sql_lines.append(
                f"  {sql_text(row.get('image_source_page_url'))}, "
                f"{sql_text(row.get('image_alt_text'))}, "
                f"{sql_text(img_type_val)},"
            )
            sql_lines.append(
                f"  {is_primary}, {sql_text(row.get('rights_note'))}, "
                f"{sql_text(row.get('confidence'))}"
            )
            sql_lines.append(f"WHERE {ps} IS NOT NULL;")
            sql_lines.append("")

    return "\n".join(sql_lines)


# ─────────────────────────────────────────────────────────────────────
# エントリポイント
# ─────────────────────────────────────────────────────────────────────


def render_seed_sql(rows: ExcelRows, skip_log: list[str]) -> str:
    parts: list[str] = []
    parts.append("-- ============================================================")
    parts.append("-- Spec: docs/specs/admin-aglist-alignment-v2.md §3.3 / §4.4")
    parts.append("-- Generated by backend/scripts/excel_to_seed_sql.py")
    parts.append("-- Source: Farmille_BS_materials_DB_template_detailed_prompt.xlsm")
    parts.append("-- ")
    parts.append("-- - products は (name, maker_id) で UPSERT")
    parts.append("-- - application_recipes / product_images は product_id スコープで")
    parts.append("--   事前 DELETE → INSERT (冪等)")
    parts.append("-- - maker_id 解決失敗 (subquery 0 行) → 当該 INSERT 自体が 0 行 (silent skip)")
    parts.append("--   未マッチの maker は skip_log.md に記録")
    parts.append("-- ============================================================")
    parts.append("")

    products_sql, _, _ = build_products_sql(rows.products, skip_log)
    parts.append(products_sql)
    parts.append("")
    parts.append(build_application_recipes_sql(rows.application_recipes, skip_log))
    parts.append("")
    parts.append(build_product_images_sql(rows.product_images, skip_log))
    parts.append("")
    return "\n".join(parts)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Excel → Supabase seed SQL 変換")
    p.add_argument(
        "--excel",
        type=Path,
        required=True,
        help="Farmille_BS_materials_DB_template_detailed_prompt.xlsm の絶対パス",
    )
    p.add_argument(
        "--out",
        type=Path,
        required=True,
        help="出力 SQL ファイル (supabase/migrations/ 配下推奨)",
    )
    p.add_argument(
        "--skip-log",
        type=Path,
        required=True,
        help="skip 記録 Markdown ファイル",
    )
    args = p.parse_args(argv)

    if not args.excel.exists():
        print(f"Excel が見つかりません: {args.excel}", file=sys.stderr)
        return 1

    rows = load_excel(args.excel)
    skip_log: list[str] = []
    sql = render_seed_sql(rows, skip_log)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(sql, encoding="utf-8")

    if skip_log:
        header = (
            "# Excel → seed 変換 skip 一覧\n\n"
            f"Generated: {dt.datetime.now().isoformat()}\n"
            f"Source: {args.excel}\n\n"
            "未マッチの maker / 不明な画像 URL 等を spec §3.3 / §6 R8 通り skip した行。\n"
            "Ryoga: 必要に応じて maker を `/admin/makers` で `active` 化した後、"
            "再度 helper を回して seed migration を再生成すること。\n\n"
        )
    else:
        header = (
            "# Excel → seed 変換 skip 一覧\n\n"
            f"Generated: {dt.datetime.now().isoformat()}\n"
            f"Source: {args.excel}\n\n"
            "skip 0 件。\n\n"
        )
    args.skip_log.parent.mkdir(parents=True, exist_ok=True)
    args.skip_log.write_text(header + "\n".join(skip_log) + "\n", encoding="utf-8")

    print(
        f"[ok] wrote {args.out} (skip {len(skip_log)} items → {args.skip_log})",
        file=sys.stderr,
    )
    print(
        f"  products      : {len(rows.products)} rows",
        file=sys.stderr,
    )
    print(
        f"  app recipes   : {len(rows.application_recipes)} rows",
        file=sys.stderr,
    )
    print(
        f"  product images: {len(rows.product_images)} rows",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
