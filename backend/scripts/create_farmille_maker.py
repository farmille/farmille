"""Farmille 公式 maker ハウスアカウントを作成する (冪等)。

admin が「Farmille として」製品登録する際の紐づけ先 (products.maker_id)。
作成後に出力される users.id を FARMILLE_MAKER_USER_ID として
backend/.env (dev) / deploy-prod.sh の --set-env-vars (prod) に設定する。

- email: info+farmille@farmille.com (既存 maker 群と同じ Farmille 管理エイリアス)
- password: ランダム生成・どこにも保存しない (ログイン運用なし。必要になったら
  Admin API でリセット)
- 既に maker_profiles.company_name='Farmille' が居れば作成せず id を表示

Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
        python backend/scripts/create_farmille_maker.py
"""

from __future__ import annotations

import json
import os
import secrets
import sys
import urllib.request

EMAIL = "info+farmille@farmille.com"
COMPANY_NAME = "Farmille"


def api(base: str, key: str, method: str, path: str, body: dict | None = None,
        prefer: str | None = None) -> list | dict:
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(
        base + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers=headers,
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode() or "[]")


def main() -> int:
    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base or not key:
        print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を環境変数で指定", file=sys.stderr)
        return 1

    # 冪等チェック: maker_profiles.company_name='Farmille' かつ users.name='Farmille'。
    # (dev には company_name だけ 'Farmille' の Ryoga テストアカウントが居るため、
    #  users.name も一致するハウスアカウント本体だけを既存とみなす)
    existing = api(base, key, "GET",
                   f"/rest/v1/maker_profiles?company_name=eq.{COMPANY_NAME}"
                   "&select=user_id,users!inner(name)")
    house = [r for r in existing if r.get("users", {}).get("name") == COMPANY_NAME]
    if house:
        print(f"already exists: FARMILLE_MAKER_USER_ID={house[0]['user_id']}")
        return 0

    # auth user 作成 (⚠ Admin API の ?email= フィルタは信用しない方針のため、
    # 検索ではなく作成 → 重複時はエラーで気づく形にする)
    created = api(base, key, "POST", "/auth/v1/admin/users", {
        "email": EMAIL,
        "password": secrets.token_urlsafe(32),
        "email_confirm": True,
        "app_metadata": {"role": "maker"},
        "user_metadata": {"name": COMPANY_NAME},
    })
    user_id = created["id"]
    assert created.get("email") == EMAIL, f"created email mismatch: {created.get('email')}"

    # public.users upsert (trigger 生成行があっても上書き)
    api(base, key, "POST", "/rest/v1/users",
        {"id": user_id, "name": COMPANY_NAME, "role": "maker", "status": "active"},
        prefer="resolution=merge-duplicates,return=minimal")

    # maker_profiles upsert
    api(base, key, "POST", "/rest/v1/maker_profiles",
        {"user_id": user_id, "company_name": COMPANY_NAME},
        prefer="resolution=merge-duplicates,return=minimal")

    print(f"created: FARMILLE_MAKER_USER_ID={user_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
