"""prod Supabase の auth メール送信を Resend SMTP に切り替える。

背景 (2026-06-07): prod は独自 SMTP 未設定のため Supabase ビルトイン送信
(2通/時制限・迷惑メール行きやすい) になっており、会員登録の認証メールが
届かない事象が発生。Resend (farmille.com 検証済みドメイン) に切り替える。

API キーはシェル履歴・チャットに残さないようファイル or 環境変数で渡す:

    # 1) 事前確認 (ドメイン検証状態を Resend API で見る)
    RESEND_API_KEY=$(cat /tmp/resend_key.txt) python3 backend/scripts/configure_supabase_smtp.py --check

    # 2) 投入 (prod project の auth config を PATCH)
    RESEND_API_KEY=$(cat /tmp/resend_key.txt) python3 backend/scripts/configure_supabase_smtp.py --apply

    # 3) 実送信テスト (パスワードリセットメールを指定アドレスに送る)
    python3 backend/scripts/configure_supabase_smtp.py --test-email r.sakai@example.com
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import urllib.request

PROJECT_REF = "sajxnypkbybuzsqdguaa"  # farmille-prod
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"

SENDER_EMAIL = "noreply@farmille.com"
SENDER_NAME = "Farmille"
RATE_LIMIT_PER_HOUR = 30  # ビルトインの 2/h から引き上げ


def supabase_token() -> str:
    raw = subprocess.run(
        ["security", "find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    if raw.startswith("go-keyring-base64:"):
        raw = base64.b64decode(raw.removeprefix("go-keyring-base64:")).decode()
    return raw


def http(method: str, url: str, token: str, body: dict | None = None) -> dict | list:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.4.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode() or "{}")


def check(resend_key: str) -> int:
    domains = http("GET", "https://api.resend.com/domains", resend_key)
    print(json.dumps(domains, indent=1, ensure_ascii=False))
    data = domains.get("data", []) if isinstance(domains, dict) else domains
    ok = any(d.get("status") == "verified" for d in data)
    print("verified domain:", "YES" if ok else "NO — Resend ダッシュボードで Verify を完了させること")
    return 0 if ok else 1


def apply(resend_key: str) -> int:
    token = supabase_token()
    body = {
        "smtp_host": "smtp.resend.com",
        "smtp_port": "465",
        "smtp_user": "resend",
        "smtp_pass": resend_key,
        "smtp_admin_email": SENDER_EMAIL,
        "smtp_sender_name": SENDER_NAME,
        "rate_limit_email_sent": RATE_LIMIT_PER_HOUR,
    }
    http("PATCH", f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth", token, body)
    conf = http("GET", f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth", token)
    print("applied:", {k: conf.get(k) for k in
                       ["smtp_host", "smtp_user", "smtp_admin_email", "smtp_sender_name",
                        "rate_limit_email_sent"]})
    return 0


def test_email(addr: str) -> int:
    """anon key でパスワードリセットメールを実送信して配送確認する。"""
    token = supabase_token()
    keys = http("GET", f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys", token)
    anon = next(k["api_key"] for k in keys if k["name"] == "anon")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/recover",
        data=json.dumps({"email": addr}).encode(),
        method="POST",
        headers={"apikey": anon, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        print("recover request:", res.status, "→ 受信箱を確認 (送信元が", SENDER_EMAIL, "になっているはず)")
    return 0


def main() -> int:
    p = argparse.ArgumentParser()
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--check", action="store_true")
    g.add_argument("--apply", action="store_true")
    g.add_argument("--test-email")
    args = p.parse_args()

    if args.test_email:
        return test_email(args.test_email)

    resend_key = os.environ.get("RESEND_API_KEY", "")
    if not resend_key.startswith("re_"):
        print("RESEND_API_KEY 環境変数に re_ で始まるキーを設定してください", file=sys.stderr)
        return 1
    return check(resend_key) if args.check else apply(resend_key)


if __name__ == "__main__":
    raise SystemExit(main())
