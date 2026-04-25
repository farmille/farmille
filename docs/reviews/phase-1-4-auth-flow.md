# Phase 1-4 レビュー結果 (auth-flow v2 実装)

> **このファイルの扱い方**
> - 2026-04-21 時点では **修正は行わない**。本ファイルは次回セッションの入口資料として保全する
> - §A 現状ステータス → §B 次回ワークフロー の順で読めば、次の AI (メイン Claude) に即座に引き継げる
> - 下の §0 以降がレビュー本体 (詳細指摘・根拠)

---

## A. 現状ステータス (2026-04-21 時点)

### A.1 コード側の現在地

| カテゴリ | 状態 |
|---|---|
| 仕様書 §11 受け入れ条件 | **16/24 コード検証済み** / 7 手動確認待ち / 1 要修正 |
| skill §4 アンチパターン10個 | **全てクリア** (検出 0) |
| skill §10「触らないファイル」 | **完全遵守** (migrations / products / reviews / page.tsx 不変) |
| 手動ロールバック (auth.py) | 仕様書 §8.3 と 1:1 対応、二重 try/except まで実装済 |
| `proxy.ts` 採用 | Next.js 16 Deprecation 警告と整合、ADR-0004 未起票 |

### A.2 次に潰すべき項目 (優先度順)

| 優先度 | 項目 | 場所 | Reviewer の判定根拠 |
|---|---|---|---|
| 🔴 高 | signup ロールハードコード 4箇所 → `SIGNUP_ROLES` 定数化 | §3.1 | 仕様書 §11.7.1 違反の可能性 (Ryoga 判断待ち = §7.1) |
| 🟡 中 | backend `ALLOWED_SIGNUP_ROLES` を `app/auth/roles.py` に移動 | §4.1 | skill §4.1 #1 と整合 |
| 🟡 中 | `public.users` 更新の 0 行検出追加 | §4.2 | 原子性の保険 (skill §3.2) |
| 🟡 中 | callback → complete-signup の self-fetch をモジュール化 | §4.3 | v1 動作には影響なし |
| 🟢 低 | `role-recovery-form.tsx` の `router.refresh()` 削除 | §5.1 | 冗長のみ |
| 🟢 低 | `proxy.ts:49` の `role === null` 扱い確定 | §5.2 | 仕様書 §14 との整合を Ryoga 判断 (= §7.2) |

### A.3 Ryoga に決めてもらう必要がある判断 (修正着手前に)

1. **§7.1**: §11.7.1 は signup 入力検証も含むか? (→ §3.1 を 🔴 にするか 🟡 にするか確定)
2. **§7.2**: `proxy.ts:49` の null フォールバックを残すか / 仕様書側を更新するか
3. **§7.3**: ADR-0004 (proxy.ts 採用) をいつ起票するか (スプリント内 / 終了後)

---

## B. 次回ワークフロー (AI と一緒に修正するときの進め方)

### B.0 セッション開始時のオープニング

次回のメイン Claude セッションで、以下を**そのまま貼り付けて開始**する想定:

```
このファイル `/Users/ryogasakai/.claude/plans/reviewer-claude-precious-wolf.md`
を読み込んでください。Phase 1-4 のレビュー結果が入っています。
§A 現状ステータスを把握したうえで、§B に従って修正を進めてください。
私の判断が必要な §A.3 は先に質問してください。
```

### B.1 修正の進め方 (3 ステップ)

#### Step 1: Ryoga の判断を先に取る (§A.3 の 3 項目)

**メイン Claude は AskUserQuestion で 3問に分けて確認する**:

- Q1: §11.7.1 の解釈 (signup 入力検証も含むか?) → §3.1 の priority を確定
- Q2: `proxy.ts:49` の null フォールバック → A案(仕様通り) / B案(現状維持+仕様更新)
- Q3: ADR-0004 起票タイミング → 今 / スプリント終了後

これが決まらないと §3.1 の修正方針が決まらない。

#### Step 2: 🔴 優先の修正を実施

Ryoga 判断が「§11.7.1 は signup 入力検証も含む」だった場合:

1. `frontend/src/lib/auth/roles.ts` に以下を追加:
   ```typescript
   export const SIGNUP_ROLES = ["farmer", "maker"] as const;
   export type SignUpRole = (typeof SIGNUP_ROLES)[number];
   export const isSignUpRole = (v: unknown): v is SignUpRole =>
     typeof v === "string" && (SIGNUP_ROLES as readonly string[]).includes(v);
   ```
2. 次の4ファイルで `role !== "farmer" && role !== "maker"` を `!isSignUpRole(role)` に置換:
   - `frontend/src/lib/auth/actions.ts:18`
   - `frontend/src/app/onboarding/role-recovery-form.tsx:14`
   - `frontend/src/app/api/auth/complete-signup/route.ts:28`
   - `frontend/src/app/auth/callback/route.ts:27` (ここは `if (intendedRole === "farmer" || intendedRole === "maker")` なので `if (isSignUpRole(intendedRole))` に書換え)
3. `pnpm tsc --noEmit` で型チェック
4. commit メッセージ: `refactor(auth): extract SIGNUP_ROLES constant to satisfy §11.7.1`

#### Step 3: 🟡 改善の修正を実施 (任意、時間が許す範囲で)

- **§4.1 backend 定数整理**: `backend/app/auth/roles.py` に `SIGNUP_ROLES` 追加 → `auth.py:11` を import に置換
- **§4.2 0 行検出**: `auth.py:50` の execute() 戻り値 `res.data` を検証、空なら raise
- **§4.3 callback モジュール化**: `frontend/src/lib/auth/complete-signup.ts` を新設し callback / route.ts 両方から呼ぶ。API Route は外部公開用に維持

**各修正ごとに個別 commit**。PR にまとめる場合は Conventional Commits 形式で:
- `refactor(auth): 〇〇`
- `fix(auth): 〇〇`

### B.2 修正後の検証手順

1. `pnpm tsc --noEmit` (frontend)
2. `cd backend && uv run ruff check . && uv run mypy app` (ruff / mypy があれば)
3. **手動動作確認** (§11 受け入れ条件の残 7 項目):
   - farmer サインアップ → メール確認 → `/onboarding` 遷移
   - maker サインアップ → 同上
   - Supabase Studio で手動で role='ja_staff' に変更 → `/home` 遷移確認
4. Reviewer Claude を再度起動して差分レビュー依頼:
   ```
   前回 /Users/ryogasakai/.claude/plans/reviewer-claude-precious-wolf.md の
   §3 と §4 を修正しました。差分だけ再レビューしてください。
   ```

### B.3 修正「しない」で良いもの

以下は今回のレビューで論点になっているが、今日は **触らない**:

- **E2E テスト追加** (§8 申し送り) → v1.5 以降で別スプリント
- **ADR-0004 起票** (proxy.ts 採用) → §A.3 Q3 次第、急がない
- **自動ロールバック救済 cron** → v1.5
- **`.env.example` 整備** → 別タスク化

### B.4 AI と組むときの注意 (Farmille 固有)

- **メイン Claude への指示文に skill を明示**: 「`farmille-architecture-principles` skill を発動して」と冒頭で依頼する
- **CLAUDE.md のコーディング規約を遵守**: Railway 固有 env 参照禁止、BFF 第一防御維持、DOA 優先
- **DB は絶対に触らない**: 本レビューの結論として migration 追加は不要。メイン Claude にも「migration 変更禁止」を明示
- **proxy.ts の読み替え**: メイン Claude が middleware.ts を作り始めたら即座に止めて、`proxy.ts` に修正依頼

---

## 0. 実行サマリ

- **対象コミット範囲**: `52b990a..HEAD` (4 コミット)
  - `1af2117` feat(auth): align register-role with auth-flow spec
  - `2b69301` feat(auth): add frontend auth foundation (roles, server helpers, actions, proxy)
  - `de93ccf` feat(auth): add signup/login pages and OAuth callback routes
  - `6a3adcf` feat(auth): add home and onboarding pages with role recovery
- **参照した仕様書**: `docs/specs/auth-flow.md` v2 (§1〜§14)
- **発動した skill**: `farmille-architecture-principles` (§1〜§5)
- **所要時間**: 約15分
- **変更ファイル**: 新規13・既存修正2 (`+868 / -29`)
- **Reviewer の立場**: 修正は行わず、指摘と修正案のみ Markdown 出力 (.claude/reviewer/CLAUDE.md 準拠)

---

## 1. 受け入れ条件達成度 (仕様書 §11)

- ✅ 達成 (コード検証可): **16 / 24** 項目
- ⏸️ 要手動確認 (DB/メール状態が必要): **7 / 24** 項目
- ⚠️ 要改善 / 議論: **1 / 24** 項目 → 🔴 3.1 または 🟡 4.1 へ

### 1.1 項目別評価

| 項目 | 判定 | 根拠 |
|------|------|------|
| 11.1.1 `/signup` 属性選択UI | ✅ | `frontend/src/app/(auth)/signup/page.tsx:42-73` (radio: farmer / maker) |
| 11.1.2 auth.users に INSERT | ⏸️ | Supabase 実行必要 (`signUp()` 呼び出しは `actions.ts:34-41`) |
| 11.1.3 public.users に role='unassigned' | ⏸️ | `handle_new_user` トリガ依存 (仕様書 §14 で確定事項) |
| 11.1.4 確認メール送信 | ⏸️ | Supabase 挙動 (`emailRedirectTo` 指定は `actions.ts:39`) |
| 11.1.5 `/auth/callback` 経由で register-role 呼出 | ✅ | `callback/route.ts:28-35` |
| 11.1.6 auth.users.app_metadata.role='farmer' | ⏸️ | DB 状態 (コードは `auth.py:42-45`) |
| 11.1.7 public.users.role='farmer' | ⏸️ | DB 状態 (コードは `auth.py:50`) |
| 11.1.8 `/onboarding` 遷移 | ✅ | `callback/route.ts:44` |
| 11.2.1 maker も同様 | ⏸️ | コード経路は確認済 (`ALLOWED_SIGNUP_ROLES` に maker 含, `auth.py:11`) DB状態は要実行 |
| 11.3.1 `/login` フォーム送信 | ✅ | `login/page.tsx` + `actions.ts:50-89` |
| 11.3.2 Cookie セッション設定 | ✅ | `@supabase/ssr` の `createServerClient` で管理 (`lib/supabase/server.ts`) |
| 11.3.3 unassigned → `/onboarding` | ✅ | `actions.ts:86-88` |
| 11.3.4 assigned → `/home` | ✅ | 同上 |
| 11.4.1 ログアウトでセッション消失 | ✅ | `actions.ts:91-95`、UI は `home/page.tsx:34-41` / `onboarding/page.tsx:82-89` |
| 11.4.2 `/login` 遷移 | ✅ | `actions.ts:94` |
| 11.5.1 未ログイン → `/home` → `/login` | ✅ | `proxy.ts:44-46` |
| 11.5.2 ログイン済 → `/login` → `/home or /onboarding` | ✅ | `proxy.ts:48-51` |
| 11.5.3 unassigned → `/home` → `/onboarding` | ✅ | `proxy.ts:53-55` |
| 11.5.4 farmer → `/onboarding` → `/home` | ✅ | `proxy.ts:57-64` |
| 11.5.5 ja_staff / researcher → `/home` | ⏸️ | Supabase Studio で手動設定が必要 (コード経路は `role !== 'unassigned'` で全 assigned 網羅) |
| 11.6.1 パスワード不一致メッセージ | ✅ | `actions.ts:71-75` (日本語化済) |
| 11.6.2 FastAPI 失敗時の再選択UI | ✅ | `callback/route.ts:37-41` で `?recover=1` 付与、`onboarding/page.tsx:25,74-80` で検出 |
| 11.7.1 `role === 'farmer'` のハードコードが middleware 以外にない | ⚠️ | signup 入力検証 4ファイルで `role !== "farmer" && role !== "maker"` (→ §3.1) |
| 11.7.2 `REVIEWER_ROLES` / `MAKER_ROLES` 定義 | ✅ | `lib/auth/roles.ts:1-2` |

---

## 2. アンチパターン検出結果 (skill §4)

10 項目すべてを明示的に検証。

| # | アンチパターン | 検出 | 確認方法・該当箇所 |
|---|--------------|------|------------------|
| 1 | 役割の二重管理 (`UPDATE users SET role` の散在) | ✅ なし | `Grep "users").update.*role"` → register-role 外になし |
| 2 | JSONB 濫用 | ✅ なし | `git log 52b990a..HEAD` に migration 追加なし、既存 migrations も `jsonb` 新規追加なし |
| 3 | UI の都合で DB 変更 | ✅ なし | `supabase/migrations/*` 変更 0 件 (仕様書 §10 準拠) |
| 4 | `user_metadata.role` に書き込み | ✅ なし | `Grep "user_metadata\.role"` → 検出 0。`user_metadata.intended_role` は存在するが **一時ヒント値**で改ざん耐性を必要としない用途 (`callback/route.ts:22`) |
| 5 | フロント直叩き (`supabase.from()`) | ✅ なし | `Grep "supabase\.from\("` in frontend → 検出 0 |
| 6 | RLS を第一防御に | ✅ なし | `register-role` は `get_current_user` (JWT検証) と `existing_role` チェックが先行 (`auth.py:21, 31-34`) |
| 7 | 変更履歴・変更サマリを本文に書く | ✅ なし | 本コミット範囲に docs 変更なし |
| 8 | 注釈メモ (`※TODO`, `FIXME`) | ✅ なし | `Grep "TODO\|※\|FIXME\|XXX"` in frontend/src/app + frontend/src/lib/auth → 検出 0 |
| 9 | ついで実装 | ✅ なし | 仕様書 §10 の「触らないファイル」(migrations / products / reviews / page.tsx) すべて不変 |
| 10 | 未採用技術前提 (Sentry / Prometheus / GitHub Actions CI 等) | ✅ なし | 新規ファイルから検出 0 |

---

## 3. 🔴 修正必須

### 3.1 受け入れ条件 §11.7.1 違反 — signup 入力検証のハードコード

- **ファイル (4件)**:
  - `frontend/src/lib/auth/actions.ts:18` — `if (role !== "farmer" && role !== "maker")`
  - `frontend/src/app/onboarding/role-recovery-form.tsx:14` — 同上
  - `frontend/src/app/api/auth/complete-signup/route.ts:28` — `if (body.role !== "farmer" && body.role !== "maker")`
  - `frontend/src/app/auth/callback/route.ts:27` — `if (intendedRole === "farmer" || intendedRole === "maker")`
- **症状**: signup 時の許可ロール (farmer / maker) を **リテラル比較** で 4 箇所に分散。将来 ja_staff UI を追加する際、全箇所を変更する必要がある。
- **根拠**: 仕様書 §11.7.1「`role === 'farmer'` のようなハードコードが middleware 以外にない」 / skill §4.1 #1「役割管理は集約」
- **修正案**:
  ```typescript
  // frontend/src/lib/auth/roles.ts に追加
  export const SIGNUP_ROLES = ["farmer", "maker"] as const;
  export type SignUpRole = (typeof SIGNUP_ROLES)[number];
  export const isSignUpRole = (v: unknown): v is SignUpRole =>
    typeof v === "string" && (SIGNUP_ROLES as readonly string[]).includes(v);
  ```
  上記 4ファイルで:
  ```typescript
  // Before
  if (role !== "farmer" && role !== "maker") { ... }
  // After
  if (!isSignUpRole(role)) { ... }
  ```
- **影響範囲**: `frontend/src/lib/auth/actions.ts`, `frontend/src/app/onboarding/role-recovery-form.tsx`, `frontend/src/app/api/auth/complete-signup/route.ts`, `frontend/src/app/auth/callback/route.ts` の 4 ファイル。型補完も効くため `SignUpRole` 型で body を受けるとより堅牢。
- **Reviewer の判断**: 仕様書 §11.7.1 の字面を厳守すると 🔴。ただし §7「要確認事項」として Ryoga の解釈待ち (入力値検証は対象外なら 🟡 に格下げ)。§7.1 参照。

---

## 4. 🟡 改善推奨

### 4.1 backend の `ALLOWED_SIGNUP_ROLES` がモジュール内クローズド

- **ファイル**: `backend/app/routers/auth.py:11`
- **症状**: 集合 `{"farmer", "maker"}` が router ファイル内に直置き。`app/auth/roles.py` の `RoleChecker` とは別系統。
- **根拠**: skill §4.1 #1 「役割の二重管理は書き込み1箇所集約。定数も同様に分散を避ける」 / 仕様書 §11.7.1 の精神
- **修正案**: `app/auth/roles.py` に `SIGNUP_ROLES: set[str] = {"farmer", "maker"}` を定義し、`auth.py` からは import する。将来 ja_staff のサインアップ UI を追加する際、集合を更新する箇所が1箇所に集約される。
- **優先度**: 中 (仕様書 §8.2 の pseudo-code そのままであり、仕様違反ではない)

### 4.2 `public.users.role` 更新の 0 行検出不足

- **ファイル**: `backend/app/routers/auth.py:50`
- **症状**: `admin.table("users").update({"role": ...}).eq("id", user_id).execute()` は更新対象が 0 件でも HTTP 200 で返る。`handle_new_user` トリガが失敗していた場合、app_metadata だけ `farmer` になり public.users に該当行がない状態で静かに通過する。
- **根拠**: skill §3.2「原子性」
- **修正案**:
  ```python
  res = admin.table("users").update({"role": payload.role}).eq("id", user_id).execute()
  if not res.data:  # supabase-py v2 は List[dict] を返す
      raise Exception("public.users row not found")
  ```
  これにより既存ロールバックパスが発火する。
- **優先度**: 中 (仕様書 §14 で `handle_new_user` の冪等性が確定事項のため現状は顕在化しにくい。ただし運用時の保険として価値がある)

### 4.3 callback/route.ts で self-fetch (オーバーヘッド)

- **ファイル**: `frontend/src/app/auth/callback/route.ts:28-35`
- **症状**: 同一 Next.js プロセス内で `fetch(${origin}/api/auth/complete-signup)` を呼び、Cookie を手動転送 (`request.headers.get("cookie")`) している。HTTP 往復 1 回と Cookie パース × 2 回分のオーバーヘッド。
- **根拠**: 仕様書 §2.4 は complete-signup を「単なるプロキシではない」と定義しているが、callback からの呼び出し方式は不問。
- **修正案**: `complete-signup` のロジックを `lib/auth/complete-signup.ts` として関数化し、callback/route.ts と `api/auth/complete-signup/route.ts` の両方から import する。API Route 自体は外部公開 (role-recovery-form からの呼び出し) のため維持。
- **優先度**: 低 (v1 動作には問題ない)

---

## 5. 🟢 任意改善

### 5.1 `role-recovery-form.tsx` の `router.refresh()` が冗長

- **ファイル**: `frontend/src/app/onboarding/role-recovery-form.tsx:36-37`
- **症状**: `router.replace("/home")` の直後に `router.refresh()` を呼んでいる。`replace` は既に Server Component の再取得を伴うナビゲーションのため `refresh` は no-op に近い。
- **判定**: 害はないが冗長。どちらか1つで十分。

### 5.2 `proxy.ts:49` の `role === null` フォールバックが仕様書外

- **ファイル**: `frontend/src/proxy.ts:49`
- **症状**: `const dest = role === "unassigned" || role === null ? "/onboarding" : "/home"` とあるが、仕様書 §14 で `handle_new_user` は `ON CONFLICT DO NOTHING` で必ず `unassigned` を INSERT することが確定済み。`role === null` は仕様上発生しない。
- **判定**: トリガ失敗時の保険として機能するが、仕様書にない過剰防衛。§7.2 で Ryoga に判断を仰ぐ。

---

## 6. ✅ 良かった点 (事実ベース)

- **仕様書 §10「触らないファイル」が完全に遵守**されている (migrations / products / reviews / page.tsx すべて不変。`git diff --name-status 52b990a..HEAD` で確認)
- **手動ロールバック実装が仕様書 §8.3 と 1:1 対応** (`auth.py:52-58`)。さらに app_metadata 復元失敗時の二重 try/except まで含めている
- **`proxy.ts` 採用判断が根拠付き**:
  - `node_modules/next/dist/docs/01-app/.../proxy.md` の Deprecation 警告を直接引用可能
  - `docs/discussions/001-nextjs16-proxy-rename.md` の判断記録あり (ハンドオフより)
  - `middleware.ts` との重複は検出されず (`Glob frontend/src/middleware.ts` → 0 件)
- **`getRole()` / `getUser()` / `getSession()` のヘルパー集約** (`lib/auth/server.ts`) により、各 Server Component の責務が純粋に保たれている
- **エラーメッセージの i18n** が仕様書 §5.3 と文字列レベルで一致
- **`user_metadata.intended_role` と `app_metadata.role` の命名で明確に区別**。改ざん可能な `user_metadata` は「希望値」、`app_metadata` は「確定値」という意味付けが命名に現れている → skill §4.1 #4 の踏み抜きを回避
- **proxy.ts が getUser() を使用** (`getSession()` ではなく)。skill には明記されていないが、`@supabase/ssr` 公式推奨パターンであり JWT 検証を Auth server で再実行する点で堅牢

---

## 7. ❓ Ryoga への質問 (判断依頼)

### 7.1 §11.7.1 の解釈 — signup 入力検証のハードコード扱い

仕様書 §11.7.1「`role === 'farmer'` のようなハードコードが middleware 以外にない」について、**signup 入力検証** の `role !== "farmer" && role !== "maker"` が該当するかの判定を仰ぎたい。

- **Reviewer の解釈**: 該当する → §3.1 🔴 修正必須
- **代替解釈**: 認可チェック限定で、SIGNUP 入力検証は対象外 → §4.1 🟡 改善推奨に格下げ
- **補強材料**: `backend/app/routers/auth.py:11` の `ALLOWED_SIGNUP_ROLES` は仕様書 §8.2 の pseudo-code そのままであり、「仕様は SIGNUP ロールの定数化を要求していない」とも読める

### 7.2 `proxy.ts:49` の `role === null` フォールバック

仕様書 §14 で `handle_new_user` トリガの冪等性が確定事項 (`ON CONFLICT DO NOTHING` で常に unassigned を INSERT) である一方、`proxy.ts:49` は null フォールバックを持つ。どちらで統一すべきか:

- **A案**: 仕様書通り `role === "unassigned"` のみ。null は考慮しない
- **B案**: 現状 `role === "unassigned" || role === null` を維持し、ADR-0004 (proxy.ts 採用) と同時に仕様書 §14 を更新

### 7.3 ADR-0004 の起票タイミング

ハンドオフでは「今スプリント終了後」とあるが、skill §5.2-D「RLS ポリシー変更時の ADR 化ルール」と並び ADR 運用ルールが未確立。`proxy.ts` 採用は「Next.js 16 系での必須変更」であり技術的判断を含むため、スプリント終了を待たず起票する選択肢もある。どちらで進めるか。

---

## 8. 次の Phase への申し送り

- **レビュー投稿 UI 実装時** (v1.5): `REVIEWER_ROLES` を import し、`proxy.ts §7.4` の将来実装コメントに従って matcher 追加。`role === 'farmer'` 等の直接比較は **厳禁** (§3.1 で修正するパターンを踏襲)
- **maker ダッシュボード実装時**: `isMakerRole()` を使い `role === "maker"` を避ける (home/page.tsx:59 のパターン踏襲)
- **自動ロールバック救済**: `auth.py` の手動ロールバックは「app_metadata 成功後 → public.users 失敗時のみ」しか発火しない。両方失敗時の救済は `onboarding` 再選択 UI に依存 (仕様書 §8.3 通り)。v1.5 で自動回収 cron の要否を検討
- **E2E テスト不在**: Playwright 等の signup → callback → register-role を通した検証テストが存在しない。v1.5 以降で `register-role` 失敗時のロールバックを含めたテスト追加を推奨
- **`.env.example` に `NEXT_PUBLIC_SITE_URL` 記載**: ハンドオフで「gitignore 配下でコミット外」とあり環境変数の正準が不明瞭。次スプリント冒頭で `.gitignore` 見直し + `.env.example` 整備を推奨

---

**以上** — Reviewer Claude (2026-04-21)
