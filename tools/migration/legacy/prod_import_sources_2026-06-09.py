"""PROD import of product_sources for NEW (zero-source) products.

Mirrors backend/scripts/excel_to_sources_sql.py mapping exactly:
  source_type <- source_type, title <- source_title, url <- source_url,
  rank <- source_rank (only S/A/B/C, else NULL), extracted_date, notes.
  norm_maker via normalize_maker_name (NFKC + strip 株式会社/（株）/(株)).
  SKIP invalid url: empty / 不明 / 明記なし / TODO / non-http(s).

SCOPE: only products with ZERO existing product_sources AND deleted_at IS NULL.
Idempotency: within a product, dedupe by url.

Phases: --mode dry|execute (default dry). VERIFY done separately via curl.

Read service_role from env KEY. NEVER print it.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from excel_to_seed_sql import is_blank, normalize_maker_name  # noqa: E402

REF = "sajxnypkbybuzsqdguaa"
REST = f"https://{REF}.supabase.co/rest/v1"
XLSX = Path(
    "/Users/ryogasakai/dev/farmille/"
    "Farmille_BS_materials_DB_template_detailed_prompt_complete.xlsx"
)
VALID_RANKS = {"S", "A", "B", "C"}
INVALID_URL_TOKENS = {"不明", "明記なし", "todo", "—", "ー", "-", ""}

KEY = os.environ["KEY"]
HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}


def req(method: str, url: str, body=None, extra_headers=None):
    h = dict(HEADERS)
    if extra_headers:
        h.update(extra_headers)
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")


def get_all(path_qs: str, page_size: int = 1000):
    """Paginate via Range header."""
    out = []
    offset = 0
    while True:
        url = f"{REST}/{path_qs}"
        h = {"Range-Unit": "items", "Range": f"{offset}-{offset + page_size - 1}"}
        status, data = req("GET", url, extra_headers=h)
        if status not in (200, 206):
            raise SystemExit(f"GET {path_qs} failed {status}: {data}")
        if not data:
            break
        out.extend(data)
        if len(data) < page_size:
            break
        offset += page_size
    return out


def url_is_invalid(url) -> bool:
    if is_blank(url):
        return True
    s = str(url).strip()
    if s.lower() in INVALID_URL_TOKENS:
        return True
    if not (s.startswith("http://") or s.startswith("https://")):
        return True
    return False


def load_xlsx_index():
    """(norm_maker, product_name) -> list of {source_type,title,url,rank,extracted_date,notes}.

    Skips invalid urls. Logs skips.
    """
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["sources"]
    it = ws.iter_rows(values_only=True)
    header = [str(c).strip() if c is not None else "" for c in next(it)]
    index: dict[tuple[str, str], list[dict]] = {}
    skips: list[str] = []
    total_rows = 0
    for i, raw in enumerate(it, start=2):
        if raw is None or all(c is None for c in raw):
            continue
        row = dict(zip(header, raw))
        total_rows += 1
        product_name = row.get("product_name")
        company_raw = row.get("company_name")
        url = row.get("source_url")
        if is_blank(product_name) or is_blank(company_raw):
            skips.append(f"row {i}: product_name/company_name 空")
            continue
        if url_is_invalid(url):
            skips.append(
                f"row {i}: url無効 ({str(url).strip()[:40]!r}) "
                f"product={str(product_name)[:30]} maker={company_raw}"
            )
            continue
        rank_raw = row.get("source_rank")
        rank = (
            str(rank_raw).strip()
            if not is_blank(rank_raw) and str(rank_raw).strip() in VALID_RANKS
            else None
        )
        ed = row.get("extracted_date")
        if isinstance(ed, (dt.datetime, dt.date)):
            ed_val = ed.date().isoformat() if isinstance(ed, dt.datetime) else ed.isoformat()
        elif not is_blank(ed):
            try:
                ed_val = dt.date.fromisoformat(str(ed).strip()[:10]).isoformat()
            except ValueError:
                ed_val = None
        else:
            ed_val = None
        notes = row.get("notes")
        notes_val = str(notes).strip() if not is_blank(notes) else None
        st = row.get("source_type")
        title = row.get("source_title")
        rec = {
            "source_type": (str(st).strip() if not is_blank(st) else None),
            "title": (str(title).strip() if not is_blank(title) else None),
            "url": str(url).strip(),
            "rank": rank,
            "extracted_date": ed_val,
            "notes": notes_val,
        }
        key = (normalize_maker_name(company_raw), str(product_name).strip())
        index.setdefault(key, []).append(rec)
    return index, skips, total_rows


def main():
    mode = "dry"
    for a in sys.argv[1:]:
        if a.startswith("--mode="):
            mode = a.split("=", 1)[1]
        elif a == "--mode" :
            pass
    if "--mode" in sys.argv:
        i = sys.argv.index("--mode")
        if i + 1 < len(sys.argv):
            mode = sys.argv[i + 1]

    print(f"[mode] {mode}", file=sys.stderr)

    # 1. maker_id -> normalized company_name
    makers = get_all("maker_profiles?select=user_id,company_name")
    maker_map = {
        m["user_id"]: normalize_maker_name(m.get("company_name"))
        for m in makers
    }
    print(f"[makers] {len(maker_map)}", file=sys.stderr)

    # 2. products with their source counts
    products = get_all(
        "products?select=id,name,maker_id,deleted_at,product_sources(id)"
    )
    print(f"[products] total fetched: {len(products)}", file=sys.stderr)

    # target = zero sources AND not deleted
    targets = [
        p for p in products
        if not p.get("deleted_at") and len(p.get("product_sources") or []) == 0
    ]
    print(f"[targets] zero-source, not-deleted: {len(targets)}", file=sys.stderr)

    # 3. xlsx index
    index, xlsx_skips, total_xlsx_rows = load_xlsx_index()
    print(
        f"[xlsx] sources rows={total_xlsx_rows} valid-keys={len(index)} "
        f"skipped={len(xlsx_skips)}",
        file=sys.stderr,
    )

    # 4. match
    matched_products = []          # products with >=1 matching xlsx source
    unmatched_products = []        # zero-source product with no xlsx match
    no_maker = []                  # maker_id not in maker_map
    insert_rows = []               # final POST payload
    per_product_counts = []
    for p in targets:
        mid = p.get("maker_id")
        name = (p.get("name") or "").strip()
        company = maker_map.get(mid)
        if company is None:
            no_maker.append((p["id"], name))
            unmatched_products.append((p["id"], name, "(no maker)"))
            continue
        recs = index.get((company, name))
        if not recs:
            unmatched_products.append((p["id"], name, company))
            continue
        # dedupe by url within product
        seen_urls = set()
        prod_rows = []
        for rec in recs:
            if rec["url"] in seen_urls:
                continue
            seen_urls.add(rec["url"])
            prod_rows.append({
                "product_id": p["id"],
                "source_type": rec["source_type"] or "公式製品ページ",
                "title": rec["title"],
                "url": rec["url"],
                "rank": rec["rank"],
                "extracted_date": rec["extracted_date"],
                "notes": rec["notes"],
            })
        if prod_rows:
            matched_products.append((p["id"], name, company, len(prod_rows)))
            per_product_counts.append(len(prod_rows))
            insert_rows.extend(prod_rows)

    summary = {
        "targets_zero_source": len(targets),
        "matched_products": len(matched_products),
        "unmatched_products": len(unmatched_products),
        "products_no_maker": len(no_maker),
        "total_insert_rows": len(insert_rows),
        "xlsx_total_rows": total_xlsx_rows,
        "xlsx_valid_keys": len(index),
        "xlsx_skips": len(xlsx_skips),
    }
    print("\n=== DRY RUN SUMMARY ===", file=sys.stderr)
    for k, v in summary.items():
        print(f"  {k}: {v}", file=sys.stderr)

    # GATES
    gate_ok = True
    if len(targets) > 280:
        print(f"!! GATE TRIP: targets {len(targets)} > 280 — STOP", file=sys.stderr)
        gate_ok = False
    if len(insert_rows) > 1500:
        print(f"!! GATE TRIP: inserts {len(insert_rows)} > 1500 — STOP", file=sys.stderr)
        gate_ok = False
    if not gate_ok:
        # dump details for audit
        _dump_audit(summary, matched_products, unmatched_products, xlsx_skips, no_maker, gated=True)
        raise SystemExit("GATE TRIPPED — no writes performed")

    # Always write audit note
    _dump_audit(summary, matched_products, unmatched_products, xlsx_skips, no_maker, gated=False)

    if mode != "execute":
        print("\n[dry] no writes performed. Re-run with --mode execute.", file=sys.stderr)
        return

    # EXECUTE: batch insert
    print(f"\n[execute] inserting {len(insert_rows)} rows...", file=sys.stderr)
    BATCH = 200
    inserted = 0
    for i in range(0, len(insert_rows), BATCH):
        chunk = insert_rows[i:i + BATCH]
        status, data = req(
            "POST",
            f"{REST}/product_sources",
            body=chunk,
            extra_headers={"Prefer": "return=minimal"},
        )
        if status not in (200, 201, 204):
            raise SystemExit(f"INSERT batch {i} failed {status}: {data}")
        inserted += len(chunk)
        print(f"  batch {i//BATCH}: +{len(chunk)} (total {inserted})", file=sys.stderr)
    print(f"[execute] done. inserted={inserted}", file=sys.stderr)


def _dump_audit(summary, matched, unmatched, xlsx_skips, no_maker, gated):
    out = Path("/Users/ryogasakai/dev/farmille/docs/drafts/prod-sources-import-2026-06-09.md")
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    lines.append("# prod product_sources import — 2026-06-09 (新規製品分)")
    lines.append("")
    lines.append(f"Generated: {dt.datetime.now().isoformat()}")
    lines.append(f"Prod ref: {REF}  |  GATE_TRIPPED: {gated}")
    lines.append("")
    lines.append("## Summary")
    for k, v in summary.items():
        lines.append(f"- {k}: {v}")
    lines.append("")
    lines.append(f"## Matched products (zero-source → +sources): {len(matched)}")
    for pid, name, company, n in sorted(matched, key=lambda x: x[1]):
        lines.append(f"- [{n}] {name} / {company} ({pid})")
    lines.append("")
    lines.append(f"## Products still without sources (no xlsx match): {len(unmatched)}")
    for pid, name, company in sorted(unmatched, key=lambda x: x[1]):
        lines.append(f"- {name} / {company} ({pid})")
    lines.append("")
    lines.append(f"## Target products whose maker_id missing from maker_profiles: {len(no_maker)}")
    for pid, name in no_maker:
        lines.append(f"- {name} ({pid})")
    lines.append("")
    lines.append(f"## Skipped xlsx source rows (invalid url / blank): {len(xlsx_skips)}")
    for s in xlsx_skips:
        lines.append(f"- {s}")
    lines.append("")
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[audit] wrote {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
