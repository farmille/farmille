"""画像ゼロの公開製品に、公式製品ページの og:image を best-effort で取り込む。

product_sources (rank S > A > B > C、公式製品ページ優先 = API と同じ序列) の
ページを取得し、og:image / twitter:image を抽出 → product-images バケットに
複製保存 → product_images へ INSERT する。

品質ガード:
- mime は bucket 許可の jpeg/png/webp のみ (SVG ロゴ等は弾く)
- 寸法が読めて min(w, h) < 200px はロゴ/アイコンとみなし skip
- 1 製品 1 枚 (is_primary=true)、image_type='other'、confidence='中'
- source_page_url に取得元ページを記録 (出典キャプションのリンク先になる)

Usage:
    export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
    python backend/scripts/fetch_og_images.py [--limit N] [--report <path>]
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import struct
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
)
ALLOWED = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MIN_DIM = 200
TIMEOUT = 20

# サイト共通 OGP / ロゴ画像の典型パス。製品固有画像ではないため弾く
# (pilot 実測: sanyo-chemical assets/img/common/OGP.jpg, sakataseed common/images/ogimage.png)
GENERIC_IMG_RE = re.compile(
    r"/common/|ogp|og[-_]?image|logo|favicon|default|/sns[/_.]|/share[/_.]|/site[/_.]",
    re.I,
)

OG_RE = re.compile(
    r'<meta[^>]+(?:property|name)\s*=\s*["\'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["\'][^>]*>',
    re.I,
)
CONTENT_RE = re.compile(r'content\s*=\s*["\']([^"\']+)["\']', re.I)


def api(base: str, key: str, method: str, path: str, body: bytes | None = None,
        content_type: str = "application/json", extra: dict | None = None) -> bytes:
    req = urllib.request.Request(
        base + path, data=body, method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": content_type,
            **(extra or {}),
        },
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def fetch(url: str, max_bytes: int = 10 * 1024 * 1024) -> tuple[bytes, str]:
    safe_url = urllib.parse.quote(url, safe=":/?&=%~.-_+,$@!*'()#")
    req = urllib.request.Request(safe_url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        ct = (res.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        return res.read(max_bytes), ct


def image_dimensions(data: bytes, ct: str) -> tuple[int, int] | None:
    """PNG / JPEG / WebP のヘッダから (width, height)。読めなければ None。"""
    try:
        if ct == "image/png" and data[:8] == b"\x89PNG\r\n\x1a\n":
            w, h = struct.unpack(">II", data[16:24])
            return w, h
        if ct in ("image/jpeg", "image/jpg"):
            i = 2
            while i < len(data) - 9:
                if data[i] != 0xFF:
                    i += 1
                    continue
                marker = data[i + 1]
                if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                    h, w = struct.unpack(">HH", data[i + 5:i + 9])
                    return w, h
                seg_len = struct.unpack(">H", data[i + 2:i + 4])[0]
                i += 2 + seg_len
        if ct == "image/webp" and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            fmt = data[12:16]
            if fmt == b"VP8X":
                w = int.from_bytes(data[24:27], "little") + 1
                h = int.from_bytes(data[27:30], "little") + 1
                return w, h
            if fmt == b"VP8L":
                bits = int.from_bytes(data[21:25], "little")
                return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    except Exception:  # noqa: BLE001
        return None
    return None


def extract_og_image(page: bytes, page_url: str) -> str | None:
    text = page.decode("utf-8", errors="replace")
    for tag in OG_RE.findall(text):
        m = CONTENT_RE.search(tag)
        if m:
            return urllib.parse.urljoin(page_url, html.unescape(m.group(1).strip()))
    return None


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--report", default="/tmp/og_images_report.json")
    args = p.parse_args()

    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base or not key:
        print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を環境変数で指定", file=sys.stderr)
        return 1

    products = json.loads(api(
        base, key, "GET",
        "/rest/v1/products?select=id,name,is_public,deleted_at,"
        "product_images(id),product_sources(source_type,url,rank)"
        "&is_public=is.true&deleted_at=is.null&order=name",
    ))
    rank_order = {"S": 0, "A": 1, "B": 2, "C": 3}
    targets = []
    for prod in products:
        if prod["product_images"]:
            continue
        sources = sorted(
            prod["product_sources"],
            key=lambda s: (
                rank_order.get(s.get("rank") or "", 9),
                0 if s.get("source_type") == "公式製品ページ" else 1,
            ),
        )
        pages = [s["url"] for s in sources if not s["url"].lower().endswith(".pdf")]
        if pages:
            targets.append({"id": prod["id"], "name": prod["name"], "pages": pages[:2]})
    if args.limit:
        targets = targets[: args.limit]
    print(f"no-image public products with sources: {len(targets)}", file=sys.stderr)

    ok: list[dict] = []
    failed: list[dict] = []

    # ── Phase A: og:image 候補の解決 (download はまだしない) ──
    def resolve(t: dict) -> None:
        last_err = "no og:image found"
        for page_url in t["pages"]:
            try:
                page, _ = fetch(page_url, max_bytes=2 * 1024 * 1024)
                img_url = extract_og_image(page, page_url)
                if not img_url:
                    continue
                if GENERIC_IMG_RE.search(urllib.parse.urlparse(img_url).path):
                    last_err = f"generic og:image (site-wide): {img_url[:80]}"
                    continue
                t["candidate"] = {"page": page_url, "image": img_url}
                return
            except Exception as e:  # noqa: BLE001
                last_err = str(e)[:200]
        t["error"] = last_err

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(resolve, targets))

    # ── Phase B: 複数製品が同一画像を指す = サイト共通画像とみなし全て除外 ──
    img_counts: dict[str, int] = {}
    for t in targets:
        c = t.get("candidate")
        if c:
            img_counts[c["image"]] = img_counts.get(c["image"], 0) + 1
    for t in targets:
        c = t.get("candidate")
        if c and img_counts[c["image"]] > 1:
            t["error"] = (
                f"shared og:image across {img_counts[c['image']]} products: {c['image'][:80]}"
            )
            t.pop("candidate")

    # ── Phase C: download / 検証 / upload / INSERT ──
    def ingest(t: dict) -> None:
        c = t.get("candidate")
        if not c:
            failed.append({"name": t["name"], "product_id": t["id"],
                           "pages": t["pages"], "error": t.get("error", "no candidate")})
            return
        try:
            data, ct = fetch(c["image"])
            if ct not in ALLOWED:
                raise ValueError(f"mime not allowed: {ct or 'unknown'}")
            dims = image_dimensions(data, ct)
            if dims and min(dims) < MIN_DIM:
                raise ValueError(f"too small {dims[0]}x{dims[1]}")
            path = f"og/{t['id']}/og.{ALLOWED[ct]}"
            api(base, key, "POST", f"/storage/v1/object/product-images/{path}",
                body=data, content_type=ct, extra={"x-upsert": "true"})
            public_url = f"{base}/storage/v1/object/public/product-images/{path}"
            api(base, key, "POST", "/rest/v1/product_images",
                body=json.dumps({
                    "product_id": t["id"],
                    "url": public_url,
                    "order": 0,
                    "source_page_url": c["page"],
                    "alt_text": f"{t['name']} 公式ページOG画像",
                    "image_type": "other",
                    "is_primary": True,
                    "rights_note": "公式サイトOG画像。利用時は権利確認が必要",
                    "confidence": "中",
                }).encode(),
                extra={"Prefer": "return=minimal"})
            ok.append({
                "name": t["name"], "product_id": t["id"], "page": c["page"],
                "image": c["image"], "stored": public_url,
                "dims": f"{dims[0]}x{dims[1]}" if dims else "unknown",
            })
        except Exception as e:  # noqa: BLE001
            failed.append({"name": t["name"], "product_id": t["id"],
                           "pages": t["pages"], "error": str(e)[:200]})

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(ingest, targets))

    print(f"og imported {len(ok)} / failed {len(failed)}", file=sys.stderr)
    with open(args.report, "w", encoding="utf-8") as fp:
        json.dump({"ok": ok, "failed": failed}, fp, ensure_ascii=False, indent=1)
    print(f"report → {args.report}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
