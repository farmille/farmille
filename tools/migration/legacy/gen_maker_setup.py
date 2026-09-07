"""40社の新規 maker アカウント作成アーティファクトを生成（DRAFT、実行はしない）。

出力:
  docs/drafts/prod_makers_create.sh   : Admin API で 40 auth users を作成
  docs/drafts/prod_makers_setup.sql   : role=maker/status=active + maker_profiles
  docs/drafts/prod_makers_mapping.md   : company_name ↔ email ↔ 製品数（ハンドオーバー用）

メール方式: info+mkNN@farmille.com（Farmille 管理エイリアス）。
  → 既存3社と同パターン。後で各社へパスワードを払い出すか、email を実社メールに
    差し替えればハンドオーバー可能（恒久ロックなし）。
"""
from __future__ import annotations
import re, unicodedata
from collections import Counter
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[2]
XLSX = ROOT / "Farmille_BS_materials_DB_template_detailed_prompt.xlsx"
OUT = ROOT / "docs" / "drafts"

_KABU = [re.compile(r"株式会社"), re.compile(r"（株）"), re.compile(r"\(株\)")]
def norm_maker(name):
    if name is None: return ""
    s = unicodedata.normalize("NFKC", str(name))
    for p in _KABU: s = p.sub("", s)
    return s.strip()

EXISTING = {
    "ICL JAPAN": "info+icl@farmille.com",
    "アグロ カネショウ": "info+kaneshow@farmille.com",
    "愛知製鋼": "info+aichi@farmille.com",
}

wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb["products"]; rows = list(ws.iter_rows(values_only=True)); hdr = list(rows[0])
data = [dict(zip(hdr, r)) for r in rows[1:] if any(c is not None and str(c).strip() for c in r)]

counts = Counter(norm_maker(d.get("company_name")) for d in data)
new_makers = sorted([m for m in counts if m not in EXISTING])

# email 割当（番号スラッグ）
assign = []
for i, m in enumerate(new_makers, start=1):
    email = f"info+mk{i:02d}@farmille.com"
    assign.append((m, email, counts[m]))

# 1. mapping.md
lines = ["# 新規 maker アカウント対応表（prod 投入用・ハンドオーバー兼用）", "",
         f"新規作成 {len(assign)} 社（既存3社=ICL/カネショウ/愛知 は除外）。", "",
         "| # | company_name（= maker_profiles に入る正規化社名） | email（Farmille管理） | 製品数 |",
         "|---|---|---|---|"]
for i, (m, e, c) in enumerate(assign, 1):
    lines.append(f"| {i} | {m} | {e} | {c} |")
lines += ["", "既存3社:", ""]
for m, e in EXISTING.items():
    lines.append(f"- {m} → {e}（作成済み・スキップ）")
(OUT / "prod_makers_mapping.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

# 2. create.sh（Admin API、ランダムpw）
sh = ['#!/usr/bin/env bash',
      '# DRAFT: prod Supabase に 40 社の maker auth user を Admin API で作成。',
      '# 実行前に prod service_role key が必要（farmille-prod Dashboard -> Settings -> API）。',
      '# email_confirm=true（確認メールは送られない）。pw はランダム（ハンドオーバー時に再設定）。',
      '# handle_new_user トリガで public.users(role=unassigned) が自動作成される。',
      '# → 作成後に prod_makers_setup.sql を実行して maker 化すること。',
      'set -euo pipefail',
      'PROD_URL="https://sajxnypkbybuzsqdguaa.supabase.co"',
      '',
      'echo "prod の service_role key を貼って Enter (表示されません):"',
      'read -rs SR; echo',
      '',
      'create_user() {',
      '  local email="$1"',
      '  curl -sS -X POST "${PROD_URL}/auth/v1/admin/users" \\',
      '    -H "apikey: ${SR}" -H "Authorization: Bearer ${SR}" \\',
      '    -H "Content-Type: application/json" \\',
      '    -d "{\\"email\\":\\"${email}\\",\\"password\\":\\"Mk-$(openssl rand -hex 12)\\",\\"email_confirm\\":true}" \\',
      '    -o /dev/null -w "HTTP %{http_code}  ${email}\\n"',
      '}',
      '']
for m, e, c in assign:
    sh.append(f'create_user "{e}"   # {m} ({c}製品)')
sh += ['', 'unset SR', 'echo "✓ 完了 (200=作成 / 422=既存)。次に prod_makers_setup.sql を実行。"']
(OUT / "prod_makers_create.sh").write_text("\n".join(sh) + "\n", encoding="utf-8")

# 3. setup.sql（role/status + maker_profiles、email で auth.users と突合）
sql = ['-- DRAFT: 新規 maker の role/status 設定 + maker_profiles 作成。',
       '-- prod_makers_create.sh の後に prod SQL Editor / psql で実行。',
       '-- company_name は seed の maker 解決 (_maker_select) と完全一致が必須。',
       '']
for m, e, c in assign:
    me = m.replace("'", "''")
    sql.append(f"-- {m} ({c}製品)")
    sql.append(f"update public.users u set role='maker', status='active'")
    sql.append(f"  from auth.users a where a.email='{e}' and u.id=a.id;")
    sql.append(f"insert into maker_profiles (user_id, company_name)")
    sql.append(f"  select id, '{me}' from auth.users where email='{e}'")
    sql.append(f"  on conflict (user_id) do update set company_name=excluded.company_name;")
    sql.append("")
# 検証クエリ
sql += ["-- 検証: active maker 社数と maker_profiles 件数",
        "select count(*) as active_makers from public.users where role='maker' and status='active';",
        "select count(*) as maker_profiles from maker_profiles;"]
(OUT / "prod_makers_setup.sql").write_text("\n".join(sql) + "\n", encoding="utf-8")

print(f"新規 maker: {len(assign)} 社")
print(f"  → docs/drafts/prod_makers_mapping.md")
print(f"  → docs/drafts/prod_makers_create.sh")
print(f"  → docs/drafts/prod_makers_setup.sql")
print("\n先頭5社の割当:")
for m, e, c in assign[:5]:
    print(f"  {e}  ←  {m} ({c}製品)")
