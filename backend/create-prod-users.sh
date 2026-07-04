#!/usr/bin/env bash
# prod Supabase にデモ用アカウント6つを Admin API で一括作成 (auto-confirm)。
# handle_new_user トリガで public.users も自動作成される。
# 値は対話入力。prod service_role key は farmille-prod Dashboard -> Settings -> API。
set -euo pipefail
PROD_URL="https://sajxnypkbybuzsqdguaa.supabase.co"

echo "prod の service_role key を貼って Enter (表示されません):"
read -rs SR; echo
echo "admin(okuda/ryoga) 用パスワードを入力 (ログインに使う・両者共通):"
read -rs ADMINPW; echo

create_user() {
  local email="$1" pw="$2"
  curl -sS -X POST "${PROD_URL}/auth/v1/admin/users" \
    -H "apikey: ${SR}" -H "Authorization: Bearer ${SR}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${pw}\",\"email_confirm\":true}" \
    -o /dev/null -w "HTTP %{http_code}  ${email}\n"
}

echo "--- メーカー3社 + farmer (ログイン不要・ランダムpw) ---"
create_user "info+icl@farmille.com"      "Demo-$(openssl rand -hex 10)"
create_user "info+kaneshow@farmille.com" "Demo-$(openssl rand -hex 10)"
create_user "info+aichi@farmille.com"    "Demo-$(openssl rand -hex 10)"
create_user "info@farmille.com"          "Demo-$(openssl rand -hex 10)"

echo "--- admin 2名 (このパスワードでログイン) ---"
create_user "rowsey.okuda@farmille.com"  "${ADMINPW}"
create_user "ryoga.sakai@farmille.com"   "${ADMINPW}"

unset SR ADMINPW
echo "✓ 完了 (HTTP 200=作成成功 / 422=既存)"
