"""product_images の外部ホットリンク URL を Supabase Storage に取り込む。

メーカーサイト直リンクは (1) next.config remotePatterns 未登録ドメインで表示不能
(2) ホットリンク拒否 / リンク切れで随時壊れる、ため画像実体を product-images
バケットに複製保存し、product_images.url を自プロジェクトの public URL に差し替える
(出典は source_page_url 列と詳細ページの出典キャプションで明示済み、ADR-0015)。

- 取り込み path: seed/{product_id}/{image_id}.{ext}
- 既に *.supabase.co を指す行は skip (冪等)
- ダウンロード不能 (404/403/PDF 等) は --delete-failed 指定時に行 DELETE
  (xlsx → seed 再生成で復元可能なため破壊的ではない)

Usage:
    export SUPABASE_URL=https://<ref>.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=...
    python backend/scripts/rehost_product_images.py [--delete-failed] [--report <path>]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
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
TIMEOUT = 20


def api(base: str, key: str, method: str, path: str, body: bytes | None = None,
        content_type: str = "application/json", extra: dict | None = None) -> bytes:
    req = urllib.request.Request(
        base + path,
        data=body,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": content_type,
            **(extra or {}),
        },
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def download(url: str) -> tuple[bytes, str]:
    """画像を取得して (bytes, content_type) を返す。失敗は例外。"""
    # `[1]` のような URL 中の角括弧は percent-encode しないと拒否するサーバーがある
    safe_url = urllib.parse.quote(url, safe=":/?&=%~.-_+,$@!*'()")
    req = urllib.request.Request(safe_url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
        ct = (res.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        data = res.read()
    if ct not in ALLOWED:
        raise ValueError(f"content-type not allowed: {ct or 'unknown'}")
    if len(data) > 10 * 1024 * 1024:
        raise ValueError(f"too large: {len(data)} bytes")
    if len(data) < 100:
        raise ValueError(f"too small: {len(data)} bytes")
    return data, ct


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--delete-failed", action="store_true")
    p.add_argument("--report", default="/tmp/rehost_report.json")
    args = p.parse_args()

    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base or not key:
        print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を環境変数で指定", file=sys.stderr)
        return 1

    rows = json.loads(api(base, key, "GET", "/rest/v1/product_images?select=id,product_id,url&order=id"))
    targets = [r for r in rows if ".supabase.co" not in r["url"]]
    print(f"total {len(rows)} rows / rehost targets {len(targets)}", file=sys.stderr)

    ok: list[dict] = []
    failed: list[dict] = []

    def process(row: dict) -> None:
        try:
            data, ct = download(row["url"])
            ext = ALLOWED[ct]
            path = f"seed/{row['product_id']}/{row['id']}.{ext}"
            api(
                base, key, "POST",
                f"/storage/v1/object/product-images/{path}",
                body=data, content_type=ct, extra={"x-upsert": "true"},
            )
            public_url = f"{base}/storage/v1/object/public/product-images/{path}"
            api(
                base, key, "PATCH",
                f"/rest/v1/product_images?id=eq.{row['id']}",
                body=json.dumps({"url": public_url}).encode(),
                extra={"Prefer": "return=minimal"},
            )
            ok.append({**row, "new_url": public_url})
        except Exception as e:  # noqa: BLE001 — 失敗理由はレポートに集約
            failed.append({**row, "error": str(e)[:200]})

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(process, targets))

    print(f"rehosted {len(ok)} / failed {len(failed)}", file=sys.stderr)
    for f in failed:
        print(f"  NG {f['url'][:80]} → {f['error'][:80]}", file=sys.stderr)

    if args.delete_failed and failed:
        ids = ",".join(f'"{f["id"]}"' for f in failed)
        api(base, key, "DELETE", f"/rest/v1/product_images?id=in.({ids})",
            extra={"Prefer": "return=minimal"})
        print(f"deleted {len(failed)} broken rows", file=sys.stderr)

    with open(args.report, "w", encoding="utf-8") as fp:
        json.dump({"ok": ok, "failed": failed}, fp, ensure_ascii=False, indent=1)
    print(f"report → {args.report}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
