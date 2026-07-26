"""SQL ファイルを Supabase Management API (database/query) で実行する。

DB パスワード不要 (CLI keychain の sbp_ トークンを使用)。
大きい SQL はステートメント境界 (`;` 行末) で ~80KB ごとに分割して送る。

Usage:
    python backend/scripts/run_sql_via_mgmt_api.py --project-ref <ref> --sql <file> [--dry-run]
"""

from __future__ import annotations

import argparse
import base64
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

CHUNK_BYTES = 80_000


def get_token() -> str:
    raw = subprocess.run(
        ["security", "find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    if raw.startswith("go-keyring-base64:"):
        raw = base64.b64decode(raw.removeprefix("go-keyring-base64:")).decode()
    if not raw.startswith("sbp_"):
        raise SystemExit("Supabase CLI トークンが keychain から取得できません")
    return raw


def chunk_sql(text: str) -> list[str]:
    """`;` で終わる行をステートメント境界として CHUNK_BYTES ごとに分割。"""
    chunks: list[str] = []
    buf: list[str] = []
    size = 0
    for line in text.splitlines():
        buf.append(line)
        size += len(line.encode()) + 1
        if size >= CHUNK_BYTES and line.rstrip().endswith(";"):
            chunks.append("\n".join(buf))
            buf, size = [], 0
    if any(l.strip() and not l.strip().startswith("--") for l in buf):
        chunks.append("\n".join(buf))
    return chunks


def run_query(project_ref: str, token: str, query: str) -> object:
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            # Cloudflare が Python-urllib UA を 403 (error 1010) で弾くため
            "User-Agent": "curl/8.4.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode() or "null")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise SystemExit(f"HTTP {e.code}: {body[:2000]}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--project-ref", required=True)
    p.add_argument("--sql", type=Path, required=True)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    text = args.sql.read_text(encoding="utf-8")
    chunks = chunk_sql(text)
    print(f"{args.sql}: {len(text.encode())} bytes → {len(chunks)} chunks", file=sys.stderr)
    if args.dry_run:
        return 0

    token = get_token()
    for i, chunk in enumerate(chunks, 1):
        run_query(args.project_ref, token, chunk)
        print(f"  chunk {i}/{len(chunks)} ok", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
