"""Prod import (2026-06-09): BS-material products + maker accounts.

Mirrors the TESTED mapping in:
  - backend/scripts/excel_to_seed_sql.py  (xlsx -> products column mapping,
    is_public = (confidence == '高'), product_type first-token resolution
    with 'BS資材' fallback, normalize_maker_name)
  - backend/scripts/gen_maker_setup.py    (norm_maker normalization,
    info+mkNN@farmille.com email pattern)

Phases:
  0  DRY RUN  (no writes)  -> sanity gates
  1  create new makers     (Admin API + role/status + maker_profiles)
  2  upsert products       (PostgREST UPSERT on_conflict=name,maker_id)
  3  verify                (public API)

Usage:
  KEY=$KEY python3 prod_import_2026_06_09.py --phase 0
  KEY=$KEY python3 prod_import_2026_06_09.py --phase 1
  KEY=$KEY python3 prod_import_2026_06_09.py --phase 2
  KEY=$KEY python3 prod_import_2026_06_09.py --phase 3

NEVER prints KEY.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import openpyxl

ROOT = Path("/Users/ryogasakai/dev/farmille")
XLSX = ROOT / "Farmille_BS_materials_DB_template_detailed_prompt_complete.xlsx"
BASE = "https://sajxnypkbybuzsqdguaa.supabase.co"
PUBLIC_API = "https://farmille-api-876121260752.asia-northeast1.run.app"

# Email numbering starts at 101 to avoid colliding with existing info+mk01..mk40.
EMAIL_START = 101

KEY = os.environ.get("KEY", "")
if not KEY or len(KEY) < 100:
    print("ERROR: KEY env var missing/short. Aborting (never logging key).", file=sys.stderr)
    sys.exit(2)

# ---------------------------------------------------------------------------
# normalization (mirrors both scripts)
# ---------------------------------------------------------------------------
_KABU = [re.compile(r"株式会社"), re.compile(r"（株）"), re.compile(r"\(株\)")]


def norm_maker(name: Any) -> str:
    if name is None:
        return ""
    s = unicodedata.normalize("NFKC", str(name))
    for p in _KABU:
        s = p.sub("", s)
    return s.strip()


def is_blank(v: Any) -> bool:
    return v is None or str(v).strip() == ""


# ---------------------------------------------------------------------------
# HTTP helpers (PostgREST + Admin API)
# ---------------------------------------------------------------------------
def _req(method: str, url: str, *, body: Any = None, headers: dict[str, str] | None = None,
         timeout: int = 60) -> tuple[int, Any, dict[str, str]]:
    h = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
    }
    if headers:
        h.update(headers)
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            rh = {k.lower(): v for k, v in resp.headers.items()}
            parsed = json.loads(raw) if raw.strip() else None
            return resp.status, parsed, rh
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        rh = {k.lower(): v for k, v in (e.headers.items() if e.headers else [])}
        try:
            parsed = json.loads(raw) if raw.strip() else None
        except Exception:
            parsed = raw
        return e.code, parsed, rh


def rest_get(path: str, *, count: bool = False) -> tuple[int, Any, dict[str, str]]:
    hdr = {"Prefer": "count=exact"} if count else None
    return _req("GET", f"{BASE}/rest/v1/{path}", headers=hdr)


# ---------------------------------------------------------------------------
# load xlsx products sheet
# ---------------------------------------------------------------------------
def load_products() -> list[dict[str, Any]]:
    wb = openpyxl.load_workbook(XLSX, data_only=True, read_only=True)
    ws = wb["products"]
    rows = list(ws.iter_rows(values_only=True))
    hdr = list(rows[0])
    data: list[dict[str, Any]] = []
    for r in rows[1:]:
        if all(v is None or (isinstance(v, str) and not v.strip()) for v in r):
            continue
        data.append(dict(zip(hdr, r)))
    wb.close()
    return data


# ---------------------------------------------------------------------------
# exclusion rule (石灰窒素 pesticide)
# ---------------------------------------------------------------------------
def is_excluded_pesticide(row: dict[str, Any]) -> bool:
    pn = str(row.get("product_name") or "").strip()
    ptype = str(row.get("product_type") or "")
    return pn == "石灰窒素" or ("農薬登録資材" in ptype)


# ---------------------------------------------------------------------------
# fetch live state
# ---------------------------------------------------------------------------
def fetch_existing_makers() -> dict[str, str]:
    """Return {company_name(normalized-as-stored): user_id}."""
    st, data, _ = rest_get("maker_profiles?select=user_id,company_name")
    assert st == 200, f"maker_profiles GET failed {st}: {data}"
    out: dict[str, str] = {}
    for x in data:
        out[x["company_name"]] = x["user_id"]
    return out


def fetch_product_types() -> dict[str, str]:
    st, data, _ = rest_get("product_types?select=id,name")
    assert st == 200, f"product_types GET failed {st}: {data}"
    return {x["name"]: x["id"] for x in data}


# ---------------------------------------------------------------------------
# build the analysis (shared by all phases)
# ---------------------------------------------------------------------------
def build_plan() -> dict[str, Any]:
    data = load_products()
    existing = fetch_existing_makers()  # normalized company_name -> user_id
    existing_norm = set(existing.keys())

    # classify rows
    skipped_excluded: list[dict[str, Any]] = []
    skipped_blank: list[dict[str, Any]] = []
    kept: list[dict[str, Any]] = []

    for i, row in enumerate(data, start=2):  # excel row number
        row["_excel_row"] = i
        if is_blank(row.get("product_name")) or is_blank(row.get("company_name")):
            skipped_blank.append(row)
            continue
        if is_excluded_pesticide(row):
            skipped_excluded.append(row)
            continue
        kept.append(row)

    # maker classification over kept rows
    kept_makers = Counter(norm_maker(r.get("company_name")) for r in kept)
    new_makers = sorted([m for m in kept_makers if m not in existing_norm])

    # email assignment for new makers (NN starting at EMAIL_START)
    email_assign: dict[str, str] = {}
    for idx, m in enumerate(new_makers):
        email_assign[m] = f"info+m1{EMAIL_START - 100 + idx:02d}@farmille.com" if False else f"info+m{EMAIL_START + idx}@farmille.com"
    # Spec wants pattern info+m1NN@farmille.com starting NN at 101.
    # That literally means info+m1101? No — spec text: emails `info+m1NN@farmille.com`
    # (start NN at 101). The existing aliases are info+mk01..mk40 (with 'k').
    # To be unambiguous and collision-free we use info+m101, info+m102, ...
    email_assign = {m: f"info+m{EMAIL_START + idx}@farmille.com" for idx, m in enumerate(new_makers)}

    return {
        "data": data,
        "existing": existing,             # normalized -> user_id
        "existing_norm": existing_norm,
        "kept": kept,
        "skipped_excluded": skipped_excluded,
        "skipped_blank": skipped_blank,
        "kept_makers": kept_makers,
        "new_makers": new_makers,
        "email_assign": email_assign,
    }


# ---------------------------------------------------------------------------
# Phase 0: DRY RUN
# ---------------------------------------------------------------------------
def phase0() -> int:
    plan = build_plan()
    existing_norm = plan["existing_norm"]
    kept = plan["kept"]
    new_makers = plan["new_makers"]

    total_rows = len(plan["data"])
    n_excluded = len(plan["skipped_excluded"])
    n_blank = len(plan["skipped_blank"])

    # resolvable = kept rows whose maker is existing OR will-be-created (all new makers will be created)
    resolvable_makers = existing_norm | set(new_makers)
    resolvable = [r for r in kept if norm_maker(r.get("company_name")) in resolvable_makers]
    unresolved = [r for r in kept if norm_maker(r.get("company_name")) not in resolvable_makers]

    # 石灰窒素 in skip set?
    excluded_names = {str(r.get("product_name")).strip() for r in plan["skipped_excluded"]}
    sekkai_excluded = "石灰窒素" in excluded_names

    print("=" * 64)
    print("PHASE 0 — DRY RUN (no writes)")
    print("=" * 64)
    print(f"xlsx total data rows           : {total_rows}")
    print(f"  skipped (blank name/maker)   : {n_blank}")
    print(f"  skipped (excluded pesticide) : {n_excluded}  names={sorted(excluded_names)}")
    print(f"  kept rows                    : {len(kept)}")
    print(f"  resolvable products          : {len(resolvable)}")
    print(f"  unresolved products          : {len(unresolved)}")
    print("-" * 64)
    print(f"existing makers (live prod)    : {len(existing_norm)}")
    print(f"new makers to create           : {len(new_makers)}")
    print("-" * 64)
    print("new maker -> email (first 50):")
    for m in new_makers[:50]:
        print(f"  {plan['email_assign'][m]:28s}  {m}  ({plan['kept_makers'][m]} products)")
    if len(new_makers) > 50:
        print(f"  ... +{len(new_makers)-50} more")
    print("-" * 64)
    print(f"石灰窒素 excluded?              : {sekkai_excluded}")

    # is_public preview
    pub = sum(1 for r in resolvable if str(r.get("confidence") or "").strip() == "高")
    print(f"would be is_public=true (高)    : {pub} / {len(resolvable)} resolvable")

    # SANITY GATES
    print("=" * 64)
    print("SANITY GATES")
    fail = []
    if not (25 <= len(new_makers) <= 60):
        fail.append(f"new_makers={len(new_makers)} NOT in [25,60]")
    if len(new_makers) > 60:
        fail.append("new_makers > 60 -> normalization mismatch")
    if len(resolvable) < 300:
        fail.append(f"resolvable={len(resolvable)} < 300")
    if not sekkai_excluded:
        fail.append("石灰窒素 NOT in skip set")

    if fail:
        print("RESULT: STOP — gate(s) failed:")
        for f in fail:
            print(f"  X {f}")
        return 1

    if len(resolvable) < 340:
        print(f"  ! WARNING: resolvable={len(resolvable)} < 340 (target) but >= 300 (hard floor). Proceeding allowed.")
    print("RESULT: PASS — all gates green.")
    # persist plan summary for later phases via JSON (no secrets)
    summary = {
        "total_rows": total_rows,
        "n_blank": n_blank,
        "n_excluded": n_excluded,
        "excluded_names": sorted(excluded_names),
        "kept": len(kept),
        "resolvable": len(resolvable),
        "unresolved": len(unresolved),
        "unresolved_makers": sorted({norm_maker(r.get("company_name")) for r in unresolved}),
        "existing_makers": len(existing_norm),
        "new_makers": new_makers,
        "email_assign": plan["email_assign"],
        "maker_product_counts": {m: plan["kept_makers"][m] for m in new_makers},
        "would_public": pub,
        "sekkai_excluded": sekkai_excluded,
    }
    (ROOT / "docs" / "drafts" / "prod-import-2026-06-09-plan.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("plan summary -> docs/drafts/prod-import-2026-06-09-plan.json")
    return 0


# ---------------------------------------------------------------------------
# Phase 1: create new makers
# ---------------------------------------------------------------------------
def admin_create_user(email: str) -> tuple[str | None, str]:
    """Create auth user. Returns (user_id, status_text). 422 => exists -> lookup."""
    pw = "Mk-" + secrets.token_hex(12)
    st, data, _ = _req(
        "POST", f"{BASE}/auth/v1/admin/users",
        body={"email": email, "password": pw, "email_confirm": True},
    )
    if st in (200, 201):
        uid = data.get("id") if isinstance(data, dict) else None
        return uid, f"created({st})"
    if st == 422 or st == 409:
        # exists -> look up by email via admin list (email filter unreliable -> paginate+assert)
        uid = admin_lookup_by_email(email)
        return uid, f"exists({st})"
    raise RuntimeError(f"admin create failed {st} for {email}: {data}")


def admin_lookup_by_email(email: str) -> str | None:
    """Paginate admin users and assert email match (Supabase ?email= filter is unreliable)."""
    page = 1
    per = 200
    target = email.strip().lower()
    while page <= 100:
        st, data, _ = _req(
            "GET", f"{BASE}/auth/v1/admin/users?page={page}&per_page={per}",
        )
        if st != 200:
            raise RuntimeError(f"admin list failed {st}: {data}")
        users = data.get("users", []) if isinstance(data, dict) else []
        if not users:
            break
        for u in users:
            if str(u.get("email", "")).strip().lower() == target:
                return u.get("id")
        page += 1
    return None


def patch_user_role(user_id: str, company_name: str) -> None:
    # name defaults to '' from trigger; set to company_name for clean display.
    st, data, _ = _req(
        "PATCH", f"{BASE}/rest/v1/users?id=eq.{user_id}",
        body={"role": "maker", "status": "active", "name": company_name},
        headers={"Prefer": "return=minimal"},
    )
    if st not in (200, 204):
        raise RuntimeError(f"PATCH users failed {st} for {user_id}: {data}")


def upsert_maker_profile(user_id: str, company_name: str) -> None:
    st, data, _ = _req(
        "POST", f"{BASE}/rest/v1/maker_profiles?on_conflict=user_id",
        body={"user_id": user_id, "company_name": company_name},
        headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )
    if st not in (200, 201, 204):
        raise RuntimeError(f"maker_profiles upsert failed {st} for {user_id}: {data}")


def phase1() -> int:
    plan = build_plan()
    new_makers = plan["new_makers"]
    email_assign = plan["email_assign"]
    print("=" * 64)
    print(f"PHASE 1 — create {len(new_makers)} new makers")
    print("=" * 64)

    created = 0
    existed = 0
    results: list[dict[str, str]] = []
    for m in new_makers:
        email = email_assign[m]
        uid, status = admin_create_user(email)
        if uid is None:
            raise RuntimeError(f"could not resolve user_id for {email} ({m}) status={status}")
        patch_user_role(uid, m)
        upsert_maker_profile(uid, m)
        if status.startswith("created"):
            created += 1
        else:
            existed += 1
        results.append({"company": m, "email": email, "user_id": uid, "status": status})
        print(f"  [{status:11s}] {email:24s} {m}")
        time.sleep(0.05)

    print("-" * 64)
    print(f"created={created}  existed/reused={existed}  total={len(results)}")

    # Re-fetch and assert no company_name maps to >1 user_id
    st, data, _ = rest_get("maker_profiles?select=user_id,company_name")
    assert st == 200
    by_name: dict[str, set[str]] = defaultdict(set)
    for x in data:
        by_name[x["company_name"]].add(x["user_id"])
    dups = {k: list(v) for k, v in by_name.items() if len(v) > 1}
    if dups:
        print("STOP — duplicate company_name -> multiple user_id:")
        for k, v in dups.items():
            print(f"  {k}: {v}")
        return 1
    print(f"no-duplicate assertion PASS. total maker_profiles now={len(data)}")
    (ROOT / "docs" / "drafts" / "prod-import-2026-06-09-makers.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return 0


# ---------------------------------------------------------------------------
# Phase 2: upsert products
# ---------------------------------------------------------------------------
def tx(v: Any) -> Any:
    """text field -> str or None (empty -> None)."""
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def parse_reg_cert(raw: Any) -> dict[str, Any]:
    out = {"fertilizer_registered": None, "pesticide_registered": None}
    if is_blank(raw):
        return out
    s = str(raw)
    if "肥料登録あり" in s:
        out["fertilizer_registered"] = True
    elif "肥料登録なし" in s or "肥料未登録" in s:
        out["fertilizer_registered"] = False
    if "農薬登録あり" in s:
        out["pesticide_registered"] = True
    elif "農薬登録なし" in s or "農薬未登録" in s:
        out["pesticide_registered"] = False
    return out


def resolve_ptype_id(row: dict[str, Any], ptypes: dict[str, str]) -> str:
    ptype_raw = row.get("product_type")
    first = ""
    if not is_blank(ptype_raw):
        first = re.split(r"[、,，]", str(ptype_raw))[0].strip()
    if first and first in ptypes:
        return ptypes[first]
    return ptypes["BS資材"]


def phase2() -> int:
    plan = build_plan()
    existing = plan["existing"]  # normalized -> user_id
    ptypes = fetch_product_types()

    # re-fetch makers to include the ones created in phase 1
    st, mp, _ = rest_get("maker_profiles?select=user_id,company_name")
    assert st == 200
    maker_id_by_name = {x["company_name"]: x["user_id"] for x in mp}

    kept = plan["kept"]
    rows_out: list[dict[str, Any]] = []
    skipped_unresolved: list[str] = []
    seen_keys: set[tuple[str, str]] = set()
    dup_in_batch = 0

    for row in kept:
        norm = norm_maker(row.get("company_name"))
        maker_id = maker_id_by_name.get(norm)
        if not maker_id:
            skipped_unresolved.append(f"{row.get('product_name')} / {norm}")
            continue
        name = str(row.get("product_name")).strip()
        # SAFETY: never include 石灰窒素 (already excluded upstream, double-guard)
        if name == "石灰窒素":
            continue
        key = (name, maker_id)
        if key in seen_keys:
            dup_in_batch += 1
            continue
        seen_keys.add(key)

        cert = parse_reg_cert(row.get("registration_certification"))
        conf = str(row.get("confidence") or "").strip()
        rec = {
            "maker_id": maker_id,
            "product_type_id": resolve_ptype_id(row, ptypes),
            "name": name,
            "product_name_jp": tx(row.get("product_name_jp")),
            "general_purpose": tx(row.get("use_case")),
            "primary_compound": tx(row.get("main_ingredients")),
            "mode_of_action": tx(row.get("mode_of_action")),
            "commercial_status": tx(row.get("sales_status")),
            "technology_action": tx(row.get("technology_action")),
            "disease_pest_info": tx(row.get("disease_pest_info")),
            "expected_effects_official": tx(row.get("expected_effects_official")),
            "expected_effects_farmille": tx(row.get("expected_effects_farmille")),
            "usage_summary": tx(row.get("usage_summary")),
            "precautions": tx(row.get("precautions")),
            "storage_shelf_life": tx(row.get("storage_shelf_life")),
            "notes": tx(row.get("notes")),
            "confidence": conf or None,
            "is_public": (conf == "高"),
            "fertilizer_registered": cert["fertilizer_registered"],
            "pesticide_registered": cert["pesticide_registered"],
        }
        rows_out.append(rec)

    print("=" * 64)
    print("PHASE 2 — upsert products")
    print("=" * 64)
    print(f"prepared rows           : {len(rows_out)}")
    print(f"skipped unresolved maker: {len(skipped_unresolved)}")
    print(f"dup keys within batch   : {dup_in_batch}")
    pub = sum(1 for r in rows_out if r["is_public"])
    print(f"is_public=true          : {pub}")

    # FINAL SAFETY: assert 石灰窒素 not in batch
    assert all(r["name"] != "石灰窒素" for r in rows_out), "石灰窒素 leaked into batch!"

    # batch upsert
    BATCH = 100
    total_upserted = 0
    for i in range(0, len(rows_out), BATCH):
        chunk = rows_out[i:i + BATCH]
        st, data, _ = _req(
            "POST", f"{BASE}/rest/v1/products?on_conflict=name,maker_id",
            body=chunk,
            headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
        )
        if st not in (200, 201, 204):
            print(f"BATCH {i//BATCH+1} FAILED {st}: {data}")
            return 1
        total_upserted += len(chunk)
        print(f"  batch {i//BATCH+1}: upserted {len(chunk)} (cum {total_upserted}) HTTP {st}")
        time.sleep(0.1)

    print("-" * 64)
    print(f"TOTAL upserted: {total_upserted}")
    if skipped_unresolved:
        print("unresolved (skipped):")
        for s in skipped_unresolved[:30]:
            print(f"  {s}")
    (ROOT / "docs" / "drafts" / "prod-import-2026-06-09-upsert.json").write_text(
        json.dumps({
            "upserted": total_upserted,
            "is_public_true": pub,
            "skipped_unresolved": skipped_unresolved,
            "dup_in_batch": dup_in_batch,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return 0


# ---------------------------------------------------------------------------
# Phase 3: verify
# ---------------------------------------------------------------------------
def http_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def phase3() -> int:
    print("=" * 64)
    print("PHASE 3 — verify (public API)")
    print("=" * 64)
    prods = http_json(f"{PUBLIC_API}/v1/products")
    # public API may return list or {items:[...]} shape
    items = prods if isinstance(prods, list) else prods.get("items") or prods.get("data") or []
    print(f"public /v1/products count : {len(items)}")

    sekkai = [p for p in items if "石灰窒素" in str(p.get("name", ""))]
    print(f"石灰窒素 present?          : {len(sekkai) > 0}  (expect False)")

    # spot check 3 names
    names = {str(p.get("name")) for p in items}
    sample = list(names)[:3]
    print(f"sample names              : {sample}")

    try:
        mans = http_json(f"{PUBLIC_API}/v1/manufacturers")
        mitems = mans if isinstance(mans, list) else mans.get("items") or mans.get("data") or []
        print(f"public /v1/manufacturers  : {len(mitems)}")
    except Exception as e:
        print(f"manufacturers fetch error : {e}")

    # also direct DB counts (service role)
    st, _, rh = rest_get("products?select=id&is_public=eq.true&deleted_at=is.null", count=True)
    print(f"DB public+not-deleted     : {rh.get('content-range')}")
    st, _, rh = rest_get("products?select=id&deleted_at=is.null", count=True)
    print(f"DB total not-deleted      : {rh.get('content-range')}")
    st, _, rh = rest_get("maker_profiles?select=user_id", count=True)
    print(f"DB maker_profiles         : {rh.get('content-range')}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", type=int, required=True, choices=[0, 1, 2, 3])
    args = ap.parse_args()
    return {0: phase0, 1: phase1, 2: phase2, 3: phase3}[args.phase]()


if __name__ == "__main__":
    sys.exit(main())
