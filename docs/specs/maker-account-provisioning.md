# 法人（メーカー）アカウント プロビジョニング 仕様

**作成日**: 2026-06-29
**起草**: planner session（奥田さん=biz lead 起点の要望を仕様化）
**位置づけ**: 現状スクリプト属人運用になっている **maker ロールアカウントの作成フロー** を正式設計に落とし込む。本ドキュメントは「何を作るか」の仕様であり、DDL・API シグネチャの最終形は確定しない（§0 / §5 / §11 参照）。
**ステータス**: Draft（DOA レビュー前 / ADR 起票前）
**前提 ADR**:
- `docs/decisions/0009-maker-approval-flow-and-admin-panel.md`（メーカー承認フロー pending_review→active、admin 画面 v1 入り）
- `docs/decisions/0002-reviews-insert-role-scope.md`（`app_metadata.role` + `public.users.role` 二層ロール構造）
- `docs/decisions/0016-minimal-dev-handoff-operating-model.md`（最小権限 dev / 本番フリーズ）
**関連 spec**:
- `docs/specs/maker-approval-admin.md`（B1 メーカー承認 UI、status enum）
- `docs/specs/maker-product.md` / `docs/specs/my-materials.md`（既存メーカー自社管理 UI）

---

## 0. Architecture Principles 準拠宣言

本 spec は `CLAUDE.md` 設計哲学 + `.claude/skills/farmille-architecture-principles/SKILL.md` に準拠する。

- **DOA 最優先（不可逆領域）**: メーカーのデータモデル（users / maker_profiles / products.maker_id の関係）は技術負債を作らない。本 spec で「決定」と書いた事項のうち **DB スキーマに触れる部分（新規列 / 新規テーブル / FK 変更）の最終形は data lead（Ryosei Nemoto）+ Ryoga の DOA レビューで確定**する。本文中の SQL / 列定義はすべて **提案（illustrative）** であり契約ではない。
- **責務分離（BFF 第一防御）**: 認証・写真以外で frontend から Supabase 直叩き禁止（`supabase.from` / `supabase.rpc` は 0 件維持）。プロビジョニングの書き込みはすべて FastAPI `/v1/admin/*` 経由、service_role はバックエンドにのみ存在。
- **二重防御**: 第一防御 = `require_role("admin")` BFF ガード。第二防御 = RLS（既存 `maker_profiles_*_self` / `products_*_owner` を据え置き）。
- **ポータビリティ**: Supabase Edge Functions / `RAILWAY_*` 直参照を採用しない。招待メールは Supabase Auth（`generate_link` / `invite`）+ 設定済 SMTP（Resend）で完結。
- **v1 スコープ厳守**: 2026/7 ローンチ目標。スピード優先。「あったらいい」拡張（複数 user/社、課金連動、法人番号 API 審査）は §12 で明示除外し v1.5+ 送り。

---

## 1. 背景 / 解決したい課題

メーカー（法人）アカウントの作成が **手作業のスクリプトベースで属人化** している。biz lead（奥田さん）から「正式なフローに設計し直したい」という要望が起点。

現状の痛点（§4 で詳述）:

1. プロビジョニングが 3 経路に分裂し、どれが正規かが曖昧（self-signup / 一括スクリプト / ハウスアカウント）。
2. 一括スクリプト（`gen_maker_setup.py` 等）は **prod service_role key を対話貼り付け** + **company_name の完全一致が暗黙の前提** + **生成パスワードがどこにも残らない**等の地雷が多く、担当者の頭の中にしか手順がない。
3. カタログ投入された 43 メーカーは **誰もログインできない「殻」アカウント**（`info+mkNN@farmille.com` エイリアス + ランダム pw）であり、実在の担当者がいつどう「自分の会社」を引き継ぐか（claim）の経路が未設計。
4. 同名 `company_name` の dev テストアカウント衝突地雷（後述 §4.4）。

ゴール: **「admin が管理画面からメーカーを発行 → 実担当者が招待リンクで自分のアカウントを claim → 出品管理できる」** までを、スクリプトに頼らない正式フローにする。あわせて、カタログ一括投入（殻アカウント生成）も「ad-hoc shell」から「レビュー可能な標準ツール」へ格上げする。

---

## 2. 用語定義

| 用語 | 定義 |
|---|---|
| **maker（メーカー / 法人）** | `public.users.role = 'maker'` のアカウント。**専用の `makers` テーブルは存在しない**（§4.2）。会社の表示情報は `maker_profiles`（1:1）に持つ。 |
| **ハウスアカウント** | Farmille 自身が「Farmille として」製品登録するための特殊な maker（`FARMILLE_MAKER_USER_ID`）。1 個だけ存在するシングルトン。 |
| **殻アカウント（unclaimed placeholder）** | カタログ投入のために Farmille が代理作成した maker。実担当者がまだログインしておらず、メールは `info+xxx@farmille.com` エイリアス、pw はランダムで誰も知らない状態。 |
| **claim（クレーム / 引き継ぎ）** | 実在の担当者が、殻アカウントまたは新規発行アカウントに対し、招待リンク経由で自分のパスワード/メールを設定しログイン可能にする操作。 |
| **status** | `users.status`：`pending_review`（非公開）/ `active`（公開中）/ `rejected`（取り下げ）/ `frozen`（凍結）。`maker-approval-admin.md` §4.2 で確定済の既存列。 |
| **プロビジョニング** | maker アカウントを作る一連の操作（auth user 作成 + role/status 付与 + maker_profiles 作成）。本 spec の主対象。 |

---

## 3. ターゲットロール / スコープ判定

| 観点 | 内容 |
|---|---|
| **誰のため** | 主: `admin`（運営＝奥田/Ryoga/根本）がメーカーを発行・招待。副: `maker`（招待を受けて claim する実担当者） |
| **何を達成** | 属人スクリプトを廃し、メーカー発行〜claim を管理画面で完結。カタログ一括投入も標準化 |
| **どこで** | `/admin/makers`（既存画面の拡張）+ メーカーが受け取る招待メール + claim 着地ページ |
| **何が成功** | スクリプト無しで 1 社発行→招待→claim→出品 が通る（§8 受け入れ基準） |

**v1 スコープ判定**: ⚠️ **境界（要 Ryoga 判断）**。

- ✅ v1 含むと判断: admin からのメーカー発行 UI / 招待メール送信 / claim 着地 は ADR-0009（メーカー承認 v1 入り）の自然な延長で、属人運用解消は本番運用上必須。
- ⚠️ 要判断: 後述 §6 の **どの To-Be 案を採るか**、§5 の **claim 状態を DB で追跡するか**、§11 の **課金連動 / 複数 user 社対応**。これらは Ryoga（+ data lead）確定が必要。

---

## 4. As-Is（現状の正確な記述）

### 4.1 メーカー作成の 3 経路（現状すべて並存）

| 経路 | 実体 | 用途 | 正規性 |
|---|---|---|---|
| **A. self-signup** | `POST /v1/auth/signup`（`backend/app/routers/auth.py:91`）で email+pw+name+role=maker を送ると、backend が service_role で auth user 作成 → `app_metadata.role='maker'` 焼き込み → `public.users.status='pending_review'` で着地。その後 `POST /v1/onboarding/maker` で `maker_profiles` upsert + status を `pending_review` に再確定。admin が `/admin/makers` で公開（active 化）。 | 実在メーカーが自分で登録 | ADR-0009 の **設計上の正規経路**。ただし実運用ではほぼ使われていない |
| **B. 一括スクリプト** | `backend/scripts/gen_maker_setup.py` が xlsx を読み、`docs/drafts/prod_makers_create.sh`（Admin API で auth user を 40 件作成）+ `prod_makers_setup.sql`（`role='maker', status='active'` + `maker_profiles` を email 突合で INSERT）+ `mapping.md` を生成。`create-prod-users.sh` はデモ用 6 アカウントをハードコードで作成。 | カタログ 43 社 + デモを **prod に一括投入** | **現状の事実上の主経路**。属人運用 |
| **C. ハウスアカウント** | `backend/scripts/create_farmille_maker.py` が `info+farmille@farmille.com` を maker として作成し `FARMILLE_MAKER_USER_ID` を出力。`backend/app/config.py:20` の env として設定し、`products.py:163` で admin の製品登録時に maker_id として使う。 | 「Farmille として」の製品登録の紐づけ先 | シングルトン。専用扱い |

### 4.2 データモデルの現状（重要 / 誤解されやすい）

- **`makers` / `manufacturers` テーブルは存在しない**。`backend/app/routers/manufacturers.py` の docstring が明言（"we never create a manufacturers table, DOA"）。**メーカー = `users (role='maker')` + `maker_profiles`（1:1）**。
- `products.maker_id` は **`users(id)` を直接参照**（`20260415000000_farmille_init.sql:154`、`REFERENCES users(id)`）。会社テーブルを介さない。
- `maker_profiles` は `user_id` が PRIMARY KEY（1:1）。`company_name NOT NULL` + `prefecture/city/note` nullable。**`company_name` に UNIQUE 制約は無い**（同名重複が DB 上許される）。
- 帰結: **現状は「1 メーカー（会社）= 1 user アカウント = N 製品」** という直線構造。1 社で複数ログイン（複数 user）は構造上不可能（maker_profiles が 1:1、products が user 直参照のため）。

### 4.3 status とロール付与のタイミング（現状）

- self-signup（経路 A）: signup 時に `role='maker'`、status は `pending_review` 着地。onboarding 完了で `maker_profiles` 確定、status は `pending_review` のまま。admin が active 化。
- 一括スクリプト（経路 B）: SQL で `role='maker', status='active'` を **直接** 焼く（承認フローを完全スキップ）。
- ハウス（経路 C）: スクリプトが `role='maker', status='active'` を upsert。

### 4.4 既知の地雷

1. **同名 company_name の dev 衝突**: dev に `company_name='Farmille'` だが `users.name != 'Farmille'` の Ryoga テストアカウントが存在。`create_farmille_maker.py:55-61` は「`users.name` も `'Farmille'` 一致」という脆い heuristic で本物ハウスアカウントだけを識別している。`company_name` に UNIQUE が無いため、突合キーとして信頼できない（memory: `project_admin_write_farmille_account_2026-06-07`）。
2. **Supabase Admin API `?email=` フィルタが壊れている**: `users[0]` を信用すると別人を破壊する（memory: `feedback_supabase_admin_api_email_filter_unreliable`）。スクリプトは「作成→重複時エラー」or「paginate + email assert」で回避済だが、新フローでも同じ防御が必須。
3. **company_name の完全一致が暗黙前提**: 一括 SQL は seed の maker 解決（`_maker_select`）と `company_name` 完全一致が成立しないと製品が紐づかない（`gen_maker_setup.py:90` コメント）。正規化（株式会社除去等）のズレで **製品が無言で orphan 化** するリスク。
4. **生成パスワードが残らない / 殻アカウント**: 一括作成 maker はランダム pw（`openssl rand`）でどこにも保存されず、誰もログインできない。実担当者への引き継ぎは「Admin API で pw リセット」or「email を実社メールへ差し替え」が必要だが、その手順が未整備。
5. **承認フローのバイパス**: 経路 B は `status='active'` 直書きで `pending_review` 審査を飛ばす。経路 A だけが ADR-0009 の審査に乗る。運用が二枚舌。
6. **SMTP 依存**: 招待・確認メールは Supabase Auth 経由。prod は 2026-06-07 に Resend SMTP 設定済（`backend/scripts/configure_supabase_smtp.py`）だが、**dev は未設定の可能性**。claim フローはメール到達が前提のため §11 で要確認。
7. **prod service_role key の対話貼り付け**: スクリプトは prod key を標準入力で受ける。CI 化されておらず実行が完全に手動・属人。

---

## 5. データモデルの決定事項（提案 / DOA レビュー対象）

> ⚠️ 本節の DDL はすべて **提案**。最終形は data lead + Ryoga の DOA レビューで確定（§0）。

### 5.1 v1 で「変えない」こと（推奨）

- **メーカー = `users(role='maker')` + `maker_profiles` の現行モデルを維持**。`makers` 会社テーブルは v1 で導入しない。
- `products.maker_id → users(id)` を維持。**ownership の再リンクをしない**（後述 claim 設計の肝）。
- 理由: `products.maker_id` は最も参照される FK の一つ。会社テーブル分離は大規模・不可逆な migration になり、v1 スピード優先と矛盾。現時点で複数ログイン/社の実需要が無い（殻アカウント運用のため）。

### 5.2 claim 状態の追跡（**要 DOA 判断**）

「殻アカウント（未 claim）」と「実担当者が claim 済」を区別する必要があるか。3 択:

| 案 | 内容 | DOA 影響 | 推奨度 |
|---|---|---|---|
| 追跡しない | auth.users の last_sign_in / email エイリアスから推測 | 追加列なし | ✗ 脆い（地雷 #1/#4 の再来） |
| **`maker_profiles.claimed_at`（nullable timestamptz）追加** | claim 完了時刻を記録。NULL = 未 claim | 加法的・低リスク・正規化を崩さない | ◎ 推奨 |
| 別テーブル `maker_claims` | claim 履歴を監査ログ化 | テーブル増、v1 規模で過剰 | △ v1.5+ |

**推奨**: `maker_profiles.claimed_at` の加法追加。ただし最終採否は DOA レビュー（§11 質問）。

### 5.3 ロール付与・status のタイミング（提案 / 全経路統一）

- **発行時**: admin がメーカーを発行した瞬間に `role='maker'` + `status='pending_review'`（未公開）。
- **claim 時**: 実担当者が招待リンクでパスワード設定 → 同一 `user_id` でログイン可能化。`claimed_at` をセット。**status は触らない**（公開可否は admin 判断のまま）。
- **公開時**: admin が `/admin/makers` で `active` 化（既存 §maker-approval-admin の approve）。
- 一括投入（カタログ）の殻アカウントは、運用判断で `active`（ディレクトリに即出す）か `pending_review`（claim/審査後に出す）かを **発行時に選べる**ようにする（§6 推奨案で詳細、要 §11 判断）。

### 5.4 RLS への影響（提案）

- **新規 RLS ポリシーは原則不要**。admin の書き込みは service_role（RLS バイパス）。claim はパスワード設定という Supabase Auth 操作（`auth.*` 例外で許容）。
- claim 後のメーカーは既存 `maker_profiles_*_self` / `products_*_owner`（`auth.uid() = user_id` / `maker_id = auth.uid()`）でそのまま自社データを操作できる。**claim が同一 user_id への credential 設定である限り、ownership は無傷**。
- 第一防御は BFF。RLS は据え置き（ADR-0009 / maker-approval-admin §7.2 の方針踏襲）。

---

## 6. To-Be フロー候補（比較）

3 案を比較。**「会社の発行」と「実担当者の login 取得（claim）」を分離して考える**のが設計の鍵。

### 案 A: admin 招待 → claim（**推奨**）

admin が `/admin/makers` で「メーカーを発行」→ BFF が殻アカウント（auth user + role=maker + status=pending_review + maker_profiles）を作成 → 担当者の連絡先メールへ **招待リンク**（Supabase `generate_link`/`invite`）→ 担当者がリンクでパスワード設定し **同一 user_id を claim** → admin が公開（active）。

- **長所**: スクリプト全廃。ownership 再リンク不要（claim = 既存 user に credential 付与）。承認フロー（pending→active）に全経路が乗る。既存 `generate_link`（`auth.py:158` で実装済）/ admin 画面 / status enum を再利用でき追加 DB 変更が最小（`claimed_at` のみ）。地雷 #1/#3/#4/#5/#7 を構造的に解消。
- **短所**: 招待メール到達が SMTP 依存（dev 未設定だと claim 不能 → §11）。「発行 UI」「claim 着地ページ」の新規実装が要る。
- **データモデル影響**: `maker_profiles.claimed_at` 追加（提案）。それ以外なし。
- **工数感**: 中（migration 1 + BFF 2-3 endpoint + admin 発行 UI + claim ページ + メールテンプレ）。3-4 sprint。

### 案 B: メーカー自己申請 → admin 承認（既存 A 経路の磨き込み）

self-signup（`/v1/auth/signup` role=maker）→ pending_review → admin 公開。既に大半が実装済（ADR-0009）。

- **長所**: 追加実装ほぼ不要。完全セルフサービス。
- **短所**: **カタログ一括投入（43 社の殻）を全くカバーしない**。実在メーカーが自発的に登録に来る前提は v1 のグロース段階では非現実的。既存カタログ製品と「後から自己申請した会社」をどう突き合わせるか（重複・突合）が未解決で、むしろ地雷 #3 を悪化させる。
- **データモデル影響**: なし。
- **工数感**: 極小（既存フロー）。ただし課題未解決。

### 案 C: 現行スクリプトの CLI ツール化（標準化）

`gen_maker_setup.py` 系を、レビュー可能で冪等な公式 CLI（または admin 画面の「CSV/xlsx 一括取り込み」）に昇格。company_name 正規化・email assert・冪等チェックを内蔵。

- **長所**: カタログ一括投入の現実（381 製品/84 社の継続投入、memory: `project_demo_2026-06-10`）に最も適合。
- **短所**: claim（実担当者の login 取得）を解決しない。「殻アカウント」のままで属人性が CLI に移るだけ。prod key 手動運用は残りがち。
- **データモデル影響**: なし（運用ツール）。
- **工数感**: 小〜中。

### 推奨

**案 A を主軸に採用し、案 C を「一括投入専用の補助ツール」として A の発行プリミティブの上に薄く載せる**。案 B（自己申請）は **副次的な入口として残す**（既存実装を消さない）が、カタログ規模の解決策にはしない。

理由:
- 属人スクリプト全廃という奥田さんの要望に最も直接応えるのは A。
- A の「発行プリミティブ（殻作成 + 招待リンク）」を BFF に作れば、C の一括投入は「同じ BFF プリミティブをループで呼ぶ」だけになり、ad-hoc shell + 生 SQL を排除できる。
- claim を「同一 user_id への credential 設定」に限定することで `products.maker_id` 再リンクを回避し、DOA 不可逆領域に踏み込まない。

---

## 7. 推奨フロー（案 A）詳細

> エンドポイントのパス/シグネチャは generator が既存 `admin.py` パターンに合わせて確定する。以下は **責務の定義**。

### 7.1 メーカー発行（admin）

`/admin/makers` に「メーカーを発行」アクションを追加。admin が会社名 + 担当者名 + 連絡先メール（+ 任意で都道府県/市区町村）を入力。BFF（`/v1/admin/makers/*`、`require_role("admin")`）が:

1. **重複チェック**: 連絡先メールで auth user が既存か確認（**Admin API の `?email=` は信用せず** paginate + assert、地雷 #2）。`company_name` は UNIQUE でないため警告表示にとどめ、ブロックはしない（同名別社が実在し得る）。
2. auth user 作成（service_role）。`app_metadata.role='maker'`。pw は未設定 or ランダム（claim で上書きされる）。
3. `public.users`: `role='maker'`, `status='pending_review'`, `name=担当者名` を upsert。
4. `maker_profiles`: `company_name` 等を upsert（`claimed_at=NULL`）。
5. 招待リンク生成（§7.2）。

### 7.2 招待メール / claim 着地

- BFF が Supabase `generate_link`（type=`invite` または `recovery`）で claim リンクを発行し、設定済 SMTP（Resend）で担当者メールへ送信。
- 担当者がリンク着地 → パスワード設定（Supabase Auth、`auth.*` 例外で frontend 直許容）→ **同一 user_id でログイン**。
- claim 完了時に BFF へ通知し `maker_profiles.claimed_at` をセット（または Supabase の確認イベントを admin が手動確認する簡易版を v1 とするかは §11）。
- claim 後、メーカーは既存 `maker` 用 UI（`/maker/*`、`docs/specs/my-materials.md`）で自社製品を管理できる。**事前にカタログ投入された自社製品（`products.maker_id` = この user_id）がそのまま自分のものとして見える**。

### 7.3 一括投入（案 C 補助）

カタログ xlsx からの一括発行は、§7.1 の発行プリミティブをループ実行する標準ツールとして実装（ad-hoc shell + 生 SQL を置換）。company_name 正規化・email assert・冪等を内蔵。殻アカウントは `claimed_at=NULL` のまま、実担当者が後から §7.2 で claim。

### 7.4 公開判定

発行直後は `pending_review`（非公開）。admin が `/admin/makers` で `active` 化（既存 approve）。一括投入時に「即 active」を許すかは運用判断（§11）。

### 7.5 権限 / セキュリティ境界

| 操作 | 第一防御（BFF） | 第二防御（RLS / Auth） |
|---|---|---|
| メーカー発行 / 招待 / 一括投入 | `/v1/admin/*` + `require_role("admin")` | service_role（RLS バイパス）。frontend からは叩かない |
| claim（pw 設定） | — | Supabase Auth（`auth.*` 例外）。同一 user_id にのみ credential 付与 |
| claim 後の自社製品操作 | `require_role("maker")` + ownership | `products_*_owner` / `maker_profiles_*_self`（`auth.uid()` 一致） |
| 公開（active 化） | `/v1/admin/makers/{id}/approve`（既存） | service_role |

- `SIGNUP_ROLES = {farmer, maker}` は不変。admin は自己選択不可（`roles.py:7`）。
- service_role key は backend のみ。frontend に漏れない（`grep` 0 件維持、CLAUDE.md 監査）。

---

## 8. 受け入れ基準（falsifiable）

### 8.1 発行（admin）
- [ ] admin が `/admin/makers` の「メーカー発行」から会社名+担当者名+メールを入力し送信すると、`role='maker'` / `status='pending_review'` の user + `maker_profiles` が 1 件作られる
- [ ] 同一メールで再発行を試みると 409（重複）で別人を破壊しない（paginate+assert 検証）
- [ ] 非 admin が発行エンドポイントを叩くと 403 `not_admin`
- [ ] 発行はすべて BFF 経由で、`grep -rn "supabase\.\(from\|rpc\)(" frontend/src` が 0 件のまま

### 8.2 招待 / claim
- [ ] 発行成功時、担当者メールに claim リンクを含む招待メールが届く（SMTP 設定済環境）
- [ ] 担当者が claim リンクでパスワードを設定するとログインでき、`user_id` は発行時と同一
- [ ] claim 後、事前にカタログ投入された自社製品（`products.maker_id` = 当該 user_id）が `/maker` 自社管理に表示される
- [ ] claim 完了が `maker_profiles.claimed_at`（採用時）に記録される
- [ ] 未 claim（`claimed_at IS NULL`）の殻アカウントでも、admin が公開すれば `/manufacturers` に会社情報が表示される

### 8.3 公開フロー整合
- [ ] 発行直後（pending_review）のメーカーは `/manufacturers` 公開一覧に出ない
- [ ] admin が公開（active）にすると `/manufacturers` に出る（既存 approve の挙動を壊さない）
- [ ] 取り下げ（rejected）/ 凍結（frozen）のメーカーは公開系に出ない（既存挙動維持）

### 8.4 一括投入（案 C）
- [ ] xlsx から N 社を発行する標準ツールが、ad-hoc shell + 生 SQL なしで実行でき、冪等（再実行で重複作成しない）
- [ ] company_name 正規化のズレで製品が orphan 化しない（投入後に maker_id NULL/未解決の製品が 0 件であることを検証クエリで確認）

### 8.5 既存資産との非回帰
- [ ] ハウスアカウント（`FARMILLE_MAKER_USER_ID`）と admin 製品登録（`products.py:163`）が壊れない
- [ ] 既存 self-signup（経路 A）が引き続き機能する（消さない）
- [ ] `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build` / `pytest backend/tests/` すべて pass

---

## 9. Sprint 分解（実装時 / migration→backend→admin UI→メール）

> 本 spec は仕様。以下は generator が実装する場合の段階目安。

### Sprint 1: データモデル確定 + 発行プリミティブ（BFF）
- DOA レビューで `maker_profiles.claimed_at`（採否）+ status 運用を確定 → migration（採用時 1 本、加法的）。`pnpm gen:types` で型再生成しコミット。
- BFF: メーカー発行エンドポイント（`/v1/admin/makers/*`、重複 paginate+assert、service_role）。
- **完了ゴール**: curl で admin が 1 社発行 → DB に user+maker_profiles が pending_review で作られる。

### Sprint 2: 招待メール + claim 着地
- BFF: 招待リンク生成（`generate_link`）+ SMTP 送信。claim 完了の `claimed_at` 記録。
- frontend: claim 着地ページ（パスワード設定、`auth.*` 例外）。
- **完了ゴール**: 発行した会社のメールに招待が届き、リンクから claim してログインできる。

### Sprint 3: admin 発行 UI + 一括投入ツール
- frontend: `/admin/makers` に「メーカー発行」フォーム + 招待再送ボタン。
- 一括投入: 発行プリミティブをループする標準ツール（ad-hoc shell/SQL 廃止）。
- **完了ゴール**: admin が画面だけで 1 社発行→招待、+ xlsx 一括投入が標準ツールで通る。

### Sprint 4: 仕上げ / 運用ドキュメント
- 空状態・エラー・再送・重複警告の UI。
- 運用 Runbook（発行・claim・トラブル時 pw リセット手順）を `docs/` に追記。
- §8 受け入れ基準を 1 件ずつ evaluator チェック。
- **完了ゴール**: 属人スクリプトに頼らずメーカー発行〜claim〜公開が一通り運用できる。

---

## 10. 触らない / 触るファイル（generator 向け境界）

### 触らない（不変）
- 既存 migration 全て（ALTER 禁止、加法的な新規 migration のみ）。
- `backend/app/auth/roles.py`（`SIGNUP_ROLES` に admin を入れない）。
- `backend/app/routers/auth.py` の `register_role` ロールバックパターン（参考にするが破壊しない）。
- ハウスアカウントの紐づけ（`config.py:20` / `products.py:163`）。
- `frontend/src` からの Supabase 直叩き禁止（`auth.*` / `storage.*` のみ例外）。
- `frontend/src/proxy.ts` / `.claude/` 配下 / 既存 spec。

### 触る（予想 / 具体実装は generator）
- 触るディレクトリ: `backend/app/routers/admin.py`（発行/招待エンドポイント追加）、`backend/app/models/schemas.py`、`frontend/src/app/admin/makers/`（発行 UI）、`frontend/src/app/(auth)/`（claim 着地）、`supabase/migrations/`（`claimed_at` 採用時）、`docs/`（Runbook）。
- 廃止/格上げ対象: `backend/scripts/gen_maker_setup.py` / `create-prod-users.sh`（標準ツールへ移行、いきなり削除はせず移行後に整理）。

---

## 11. 未決事項 / Ryoga への質問

1. **【最重要 / DOA】claim 状態の追跡**: `maker_profiles.claimed_at`（nullable）を追加するか、追跡せず運用で吸収するか。加法的・低リスクだが DB 変更のため data lead（Ryosei）+ Ryoga サインオフが要る（§5.2）。
2. **【最重要 / スコープ】To-Be 採用案**: 推奨は「A 主軸 + C 補助、B は副入口で残置」（§6）。この三層構成で確定してよいか。
3. **【最重要 / 課金連動】**: メーカー課金（月3000円・協力ベース）が v1 入り検討中で PRD §9.3 と衝突（memory: `project_maker_paid_v1_inclusion`、ADR-0011 monetization pivot）。プロビジョニングに **プラン/課金状態を v1 で結びつけるか**。本 spec は「結びつけない（発行＝無料、課金は別レイヤ）」前提で書いている。発行時に plan を持たせる必要があれば data model に影響するため早期判断が要る。
4. **複数 user/社**: 1 社=複数ログイン（seat）を v1 で許すか。現モデルは 1:1 で不可。許すなら `makers` 会社テーブル分離（不可逆・大規模）になり別 ADR。本 spec は **v1 で 1:1 維持** を前提（§5.1）。
5. **一括投入の status**: カタログ殻アカウントを発行時に即 `active`（ディレクトリに出す）にするか、`pending_review`（claim/審査後）にするか（§7.4）。現状 prod の 43 社は `active` 直書き。
6. **SMTP（dev）**: prod は Resend 設定済（2026-06-07）。**dev の SMTP 未設定だと claim メールが届かず E2E できない**（地雷 #6、memory: `project_images_hidden_compliance_2026-06-07`）。dev でも Resend を使うか、claim リンクを画面/ログ表示で代替するか。
7. **既存 prod データ整合**: prod に約 247 製品 / 43 メーカー（memory: `project_bs_materials_248_prod_import`、※起票時ブリーフの「14製品」はローンチ初日の旧数値）。既存殻アカウント（`info+mkNN@farmille.com`）を新フローの「未 claim」として扱い、後追いで claim 招待を送る運用でよいか。本番フリーズ方針（ADR-0016）との兼ね合いも確認。
8. **claim の本人確認強度**: メール到達のみで claim 可（v1 想定）か、admin の手動承認を挟むか。Yelp Claim 級の本人確認は v1 アウト（ADR-0009 §3.B で却下済）でよいか。
9. **【ADR 採番】**: 本フローは DB/運用に関わる意思決定のため **新規 ADR が妥当**。on-disk 最大は ADR-0016、0010 が欠番。**ADR-0017 を提案**するが、`gh pr list --state open` で予約番号衝突を必ず確認すること（CLAUDE.md / memory: `feedback_adr_numbering_race`）。planner 環境では gh 未実行のため未検証。

---

## 12. v1 外として明示除外した提案

| 項目 | 除外理由 | 代替（v1 範囲） |
|---|---|---|
| `makers` 会社テーブル分離（1 社=複数 user） | `products.maker_id` 再リンクを伴う不可逆・大規模 migration。v1 に実需要なし | 1 user=1 会社を維持（§5.1） |
| 法人番号 API による自動審査 / Yelp Claim 級本人確認 | ADR-0009 §3.B で却下済（コスト/リードタイム過大、v1 30社規模） | メール到達 + admin 承認 |
| メーカー課金/プラン連動の発行 | PRD §9.3 と未確定衝突（§11-3） | 発行＝無料、課金は別レイヤ（v1.5+） |
| 招待 claim の監査ログテーブル | DOA「事実のみ」、v1 規模で過剰 | `claimed_at` 1 列 + Supabase ダッシュボード |
| claim 失敗時の自動リトライ / pw リセットセルフサービス | v1 運用頻度低い | admin が Admin API で手動 pw リセット |
| メーカー間の権限委譲・招待（maker が同僚を招く） | 複数 user/社が前提、v1 アウト | admin 発行のみ |

---

## 13. Generator への申し送り

- 着手前に必読: 本 spec / `docs/decisions/0009-*` / `docs/specs/maker-approval-admin.md` / `backend/app/routers/admin.py`（既存 maker approve/reject パターン）/ `backend/app/routers/auth.py`（`generate_link` 既実装、`signup`）/ `frontend/AGENTS.md`（Next.js 破壊的変更）。
- 既存パターン踏襲: BFF エラー形式は `{"ok": False, "error": code}`（`admin.py:48`）。Supabase Admin API は **`?email=` を信用せず** paginate+assert（地雷 #2）。frontend Client Island は `frontend/src/app/admin/makers/_components/maker-action-buttons.tsx` 参照。
- skill `farmille-architecture-principles` 発動推奨: migration 設計時（DOA 不可逆領域）、BFF/RLS 境界設計時、frontend 直叩き混入チェック時。
- 想定アンチパターン（先回り警告）:
  - ❌ claim を「新 user 作成 + `products.maker_id` 付け替え」で実装する → 必ず **同一 user_id への credential 設定**（ownership 無傷を守る）。
  - ❌ `company_name` を突合キー/UNIQUE 扱いする → UNIQUE 制約なし、同名別社が実在し得る。突合は user_id で。
  - ❌ claim 状態を `app_metadata` や JSONB に詰める → `claimed_at` 列（採用時）か、追跡しない。
  - ❌ 一括投入を生 SQL/ad-hoc shell に戻す → 発行プリミティブのループに統一。
  - ❌ frontend から Supabase 直叩きで発行/招待 → BFF 経由のみ（`auth.*` の pw 設定だけ例外）。

---

**以上**
