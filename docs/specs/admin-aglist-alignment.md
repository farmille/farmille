# Admin UI alignment with AgList — 機能要件定義（spec）

- 起票日: 2026-05-25（Mon）
- 締切（v1 DoD）: 2026-05-27（Wed）— main マージ済み × prod デプロイ済み
- 対象 milestone: Farmille v1（admin パネル v1 入り [[project_admin_panel_v1_inclusion]]）
- 関連 ADR: [ADR-0009](../decisions/0009-maker-approval-flow-and-admin-panel.md), [ADR-0012](../decisions/0012-admin-2fa-promotion-to-v1.md)
- 上位 spec: [maker-approval-admin.md](./maker-approval-admin.md)
- 参照: AgList (https://aglist.com/) — Bubble.io 製の ag biologicals データベース

---

## 0. 背景 / 目的

運営メンバー（admin ロール）が **BS 資材マスタ（products）を業務的に管理できる画面** を v1 で出す。AgList は同領域の事実上のリファレンス UX なので、IA（情報設計）と一覧/詳細の操作体験を寄せる。同時に、@Ryosei Nemoto が手作業で整備した products データを Sheets から dev/prod DB に流し込む。

「寄せる」とは:
- 画面分割（一覧 vs 詳細）と URL 構造（/admin/products 一覧、/admin/products/[id] 詳細）
- 詳細ページに表示すべき情報項目セット（Name / Manufacturer / Description / Active Ingredients / Mode of Action / Target Crops / Application / Certifications / Images / SDS / Label）
- 一覧の検索・フィルタ・カラム選定
- ビジュアルトーン（Tailwind 4 + farmille design tokens の範囲内で AgList に近づける）

「寄せない」もの（v1 スコープ外）:
- public な /products, /product/[slug] エンドユーザー画面（admin スコープ外。別 phase で扱う）
- /distributor, /partner, /leaderboard, /subscription（Farmille に無い概念）
- /blog（admin/articles で既に骨組みあり、別マイルストーン）
- Railway region 移行（Singapore → Tokyo）— Follow-ups §7 に隔離

## 1. スコープ

### 1.1 対象画面

| # | 画面 | 状態 | 本 spec での扱い |
|---|---|---|---|
| F1 | `/admin/products`（一覧） | **未実装** | 新規作成 |
| F2 | `/admin/products/new`（新規作成） | 未実装 | 新規作成 |
| F3 | `/admin/products/[id]`（編集 / 閲覧） | 未実装 | 新規作成 |
| F4 | `/admin/products/import`（CSV import） | 未実装 | 新規作成（一回限り運用優先） |
| F5 | `/admin`（ダッシュボード） | 実装済 | products カード追加 + 件数表示 |
| F6 | `/admin/layout.tsx`（サイドバー） | 実装済 | "資材マスタ" メニュー追加 |

### 1.2 非スコープ

- products 以外のマスタ（categories, certifications, periods 等のメンテ UI）。SQL 運用で対応、v1.5+ で UI 化
- public 側 `/products` の AgList 化（別 phase）
- レビューと products の関連管理（既存）
- 画像のリッチアップロード UI（既存の Storage 直 PUT で十分）
- メーカー登録は ADR-0009 の承認フロー経由（本 spec では products から既存 maker を選ぶだけ）

## 2. AgList 参照（IA / 主要画面）

sitemap + OG メタから判明した構造:

| AgList path | 性質 | Farmille 対応 |
|---|---|---|
| `/products` | 全 ag biologicals の一覧、検索・フィルタ | **`/admin/products`** に寄せる（admin スコープ） |
| `/product/<slug>` | 商品詳細（OG image = label/datasheet スクショ） | **`/admin/products/[id]`** に寄せる |
| `/manufacturer/<slug>` | メーカープロフィール | 既存 `/admin/makers/[id]`（B2）と相互リンク |
| `/distributor/<slug>` | 販売代理店 | 非対応（v1 スコープ外） |
| `/leaderboard` | ランキング系 | 非対応 |
| `/blogs` | 記事 | `admin/articles` 既存、別 spec |

実画面の表示項目・フィルタ列名は SPA（Bubble.io）で SSR 0 のため HTML から取れない。**実装時は AgList の `/products` と `/product/biotrinsic-wt29` 相当 1 ページのスクショを実装者で確認しながら寄せる**（spec §3 で必要項目を列挙、視覚詳細は実装時微調整可）。

## 3. 機能要件

### 3.1 F1: products 一覧（`/admin/products`）

**目的**: 運営が全 products を概観し、検索・フィルタで絞り込み、編集導線に入る。

**データソース**: 新規 BFF endpoint `GET /v1/admin/products`（FastAPI、AAL2 必須）。RLS は admin の SELECT を全行に許可（既存 admin policy で対応可、要確認）。

**画面要素**:

- ヘッダ
  - 見出し「資材マスタ」
  - 右上ボタン「新規作成」→ `/admin/products/new`
  - 右上ボタン「CSV インポート」→ `/admin/products/import`
- 検索バー（debounce 300ms、URL `?q=` 反映、name の部分一致）
- フィルタ（multi-select、URL クエリ反映）:
  - 製品種別（product_type）
  - メーカー（maker_id、users.role=maker からドロップダウン）
  - 公開状態（commercial_status）
  - 認証（certifications）
  - 対象作物（crops）
- テーブル列（並べ替え対応列に ↕️）:
  | 列 | ソート | 表示形式 |
  |---|---|---|
  | サムネ | × | product_images 先頭 / 無ければプレースホルダ |
  | 名前 (name) | ✓ | 太字 + 詳細リンク |
  | メーカー | ✓ | maker_profiles.brand_name |
  | 製品種別 | × | product_types.name |
  | mode_of_action | × | 1 行 truncate |
  | 認証 | × | バッジ群 |
  | 更新日 (updated_at) | ✓ | YYYY-MM-DD |
  | 操作 | × | 「編集」リンク |
- pagination: server-side、20 件/ページ、`?page=` 反映
- 件数表示「全 N 件中 X-Y を表示」

**受け入れ基準**:
- 検索キーワード変更で URL が更新され、戻る/進むで再現できる
- フィルタを 2 つ重ねた結果が SQL where AND で AND 結合される
- pagination cursor が `LIMIT/OFFSET` 安定（updated_at DESC + id DESC のタイブレーク）

### 3.2 F2: products 新規作成（`/admin/products/new`）

**目的**: 運営がメーカーから外部入手した情報をマスタに 1 件登録する。

**フォーム項目**:

| セクション | 入力項目 | 型 | 必須 | 備考 |
|---|---|---|---|---|
| 基本 | name | text | ✓ | |
| 基本 | maker_id | select（既存 maker から） | ✓ | maker_profiles.brand_name 表示 |
| 基本 | product_type_id | select | ✓ | product_types マスタから |
| 基本 | commercial_status | select | △ | 'available' / 'discontinued' / 'pre-launch' |
| 説明 | general_purpose | textarea | △ | 商品用途・効能の自由記述 |
| 説明 | primary_compound | text | △ | 主要成分 |
| 説明 | mode_of_action | textarea | △ | 作用機序 |
| 認証 | certifications[] | multi-select | △ | certifications マスタから |
| 認証 | fertilizer_registered | boolean | △ | 肥料登録の有無 |
| 認証 | pesticide_registered | boolean | △ | 農薬登録の有無 |
| 関連 | crops[] | multi-select | △ | crops マスタから（対象作物） |
| 関連 | prefectures[] | multi-select | △ | 販売地域 |
| 関連 | benefits[] | multi-select | △ | JBSA 25項目 |
| 関連 | composition_types[] | multi-select | △ | JBSA 8分類 |
| 関連 | science_technologies[] | multi-select | △ | |
| 関連 | application_methods[] | multi-select | △ | |
| 関連 | application_windows[] | multi-select | △ | 36 periods |
| ファイル | label_url | URL or upload | △ | 商品ラベル PDF |
| ファイル | sds_url | URL or upload | △ | SDS PDF |
| 画像 | product_images[] | drag-and-drop upload（既存 Storage） | △ | 順序入れ替え可、先頭がサムネ |

**Action**: `POST /v1/admin/products` を SSR Server Action から呼び、成功時 `/admin/products/[new id]` にリダイレクト。

### 3.3 F3: products 編集（`/admin/products/[id]`）

**目的**: 既存 products の編集 / 削除。

- F2 と同じフォーム + 既存値プリフィル
- 「削除」ボタン（赤、確認 dialog 必須）
- "公開する / 非表示" トグル（commercial_status の wrapper）

**Action**: `PUT /v1/admin/products/{id}` / `DELETE /v1/admin/products/{id}`（admin + AAL2）

**RLS**: products テーブルへの UPDATE/DELETE は service_role 経由（BFF で AAL2 + admin role を確認後）。RLS は SELECT のみ admin に許可、書き込みは BFF 経由のみ。

### 3.4 F4: CSV インポート（`/admin/products/import`）

**目的**: @Ryosei Nemoto の Sheets を 1 回限り（or 反復可）流し込む。

**v1 方針（時間優先）**:
- Sheets → CSV ダウンロード
- 管理画面に CSV アップロード UI（`<input type=file accept=".csv">`）
- preview として 5 行表示 + 列マッピング確認
- 「インポート実行」で BFF `POST /v1/admin/products/import` に multipart 送信
- backend で `csv` モジュール parse → 1 行ずつ INSERT（既存 name で UPDATE、無ければ INSERT = upsert）
- レスポンスに `{inserted: N, updated: M, errors: [{row, message}]}` を返す
- 失敗行はスキップ、最後にサマリ表示

**列マッピング（暫定、Sheets 実物確認後に固定）**:

| CSV 列名（想定） | products カラム / relation | 必須 |
|---|---|---|
| name / 商品名 | products.name | ✓ |
| maker / メーカー名 | products.maker_id（brand_name 照合、無ければ skip + error） | ✓ |
| product_type / 製品種別 | products.product_type_id（name 照合） | ✓ |
| general_purpose / 用途 | products.general_purpose | |
| primary_compound / 主成分 | products.primary_compound | |
| mode_of_action / 作用機序 | products.mode_of_action | |
| crops / 対象作物（,区切り） | product_crops 中間 | |
| certifications / 認証（,区切り） | product_certifications 中間 | |
| benefits / 効果（,区切り） | product_benefit_relations 中間 | |
| label_url | products.label_url | |
| sds_url | products.sds_url | |

**未確定（TBD）**: Sheets の実列名（@Ryosei 確認次第 §4.1 で固定）。

**回避策（時間がない場合の代替）**:
- BFF を作らず、`backend/scripts/import_products.py` という one-off スクリプトを書いて `uv run python -m scripts.import_products path/to/products.csv` で流す。UI はあとで。
- DoD「prod デプロイ」に CSV import UI が間に合わなければ、prod は **このスクリプトを管理者ローカルから service_role で流す**ことで達成可能（UI は v1.5+）。

### 3.5 F5: ダッシュボード追記（`/admin`）

- `/v1/admin/summary` レスポンスに `products_total: number` を追加
- ダッシュボードカード「資材マスタ」を追加、件数表示 + 「一覧へ」リンク

### 3.6 F6: サイドバー追記（`/admin/layout.tsx`）

- 既存ナビ（ダッシュボード / メーカー承認 / ユーザー管理 / 通報管理 / 記事管理 / 注目の資材 / バナー）に「**資材マスタ**」を追加（メーカー承認の次）

## 4. データ要件

### 4.1 既存 schema との対応

products テーブル定義（`supabase/migrations/20260415000000_farmille_init.sql`）:

```
products
  id, maker_id (→users), product_type_id (→product_types),
  name, general_purpose, primary_compound, mode_of_action,
  commercial_status, label_url, sds_url,
  fertilizer_registered, pesticide_registered, is_screened,
  created_at, updated_at
```

中間テーブル（既存）:
- product_images
- product_certifications
- product_prefectures
- product_benefit_relations
- product_composition_type_relations
- product_science_technology_relations
- product_application_method_relations
- product_application_window_relations
- product_crops

**結論**: AgList の主要表示項目は **現スキーマで充足**。新規 migration は不要（既存テーブル + relation だけで AgList 相当の詳細ページが組める）。

### 4.2 スキーマ拡張の検討（v1 では入れない）

- `products.description_long`（マークダウン長文） — 現状 general_purpose で代替
- `products.slug`（公開ページ用） — public 化フェーズで追加
- `manufacturers` 独立テーブル — users.maker_profiles で代替（変更コスト高、v1 スコープ外）

### 4.3 admin の RLS 確認

- products SELECT: admin に全行許可されている必要あり。`supabase/migrations/` の products policy を grep して未対応なら migration 追加（または service_role bypass）
- products INSERT/UPDATE/DELETE: 既存は maker 本人のみ。**admin の書き込みは BFF で service_role 経由に統一**（RLS を緩めない）

### 4.4 CSV インポート時の整合性

- `maker / メーカー名` 列は `maker_profiles.brand_name` と部分一致しない場合 **エラー行扱い**（自動 maker 作成はしない、ADR-0009 承認フローを通すべき）
- relation 列は `,` 区切り、各値は対応マスタの name と完全一致のみ採用
- 重複は `name` ユニーク無しなので **(name, maker_id) で既存判定** → 既存なら UPDATE、なければ INSERT

### 4.5 v1 で投入するデータの規模（暫定）

- Sheets 件数: TBD（@Ryosei 確認）。仮に < 500 件なら 1 回バッチで OK。1000 件超なら page 分割 import を検討。

## 5. 受け入れ基準（DoD: main マージ × prod デプロイ by 2026-05-27 Wed）

**必達**:
- [ ] `/admin/products` 一覧が表示でき、検索 + 最低 1 つのフィルタが動く
- [ ] `/admin/products/new` で 1 件追加でき、relation も保存される
- [ ] `/admin/products/[id]` で編集 → 保存できる
- [ ] @Ryosei の Sheets データが **dev → prod の products に流し込み完了**（CSV import UI でも one-off スクリプトでも可）
- [ ] サイドバー「資材マスタ」リンクと dashboard 件数カードが表示される
- [ ] `pnpm tsc --noEmit` / `pnpm lint` clean
- [ ] backend `uv run pytest` clean（admin/products router の最低 happy + AAL1 → 401 テスト）
- [ ] UAT（後述）の §1〜§3 を Ryoga が手動 pass
- [ ] PR が main にマージされ、Vercel + Railway の prod デプロイが SUCCESS

**任意（時間があれば）**:
- [ ] CSV import の UI（無くても one-off スクリプトで DoD 達成可）
- [ ] 全 multi-select 項目（9 種 relation）の編集 UI 完備（最低 crops + certifications + benefits だけでも可）
- [ ] 削除機能 + soft delete migration
- [ ] product_images の drag-and-drop 並べ替え

## 6. 想定外 / リスク

- **R1**: Sheets の列名が想定と乖離 → §4.1 のマッピング表を Sheets 実物確認後に確定する必要。**水曜までに Ryosei さんと CSV 列名合意**できないと import が止まる
- **R2**: products RLS が admin SELECT を許していない場合、migration が必要 → migration 追加 → `pnpm gen:types` 再実行が CLAUDE.md ルール
- **R3**: relation テーブル更新の transaction 設計。1 product 更新で 9 relation を delete-then-insert する。失敗時 rollback されないと中途半端な状態になる。FastAPI で `async with db.transaction():` 必須
- **R4**: 画像 upload。既存 Storage RLS（[ADR-0003](../decisions/0003-storage-rls-path-enforcement.md), [ADR-0007](../decisions/0007-storage-rls-audit.md)）の path 制約に admin path が含まれているか要確認。**含まれていなければ admin の image upload は v1 スコープ外、URL 直入力のみ**で逃げる
- **R5**: AAL2 必須化（ADR-0012）により、admin endpoint 呼び出しは MFA セットアップ済みアカウントが必要。dev でも MFA enroll 後でないと products import が走らない
- **R6**: メーカーが users.maker_profiles に未登録の場合 import エラー。Sheets 側のメーカー一覧と users 既存値の照合が事前に必要

## 7. Follow-ups（v1.5+）

- **F-FU1**: Railway backend region を asia-southeast1（Singapore）→ asia-northeast1（Tokyo）に移行。別 ADR で扱う（DB の region と backend の region が国境跨いでいると latency が往復で効く）
- **F-FU2**: public 側 `/products`, `/product/[slug]` の AgList 化（SSR + SEO）
- **F-FU3**: products に `slug` カラム追加 + 一意制約 + 自動生成
- **F-FU4**: CSV import に diff preview（既存 vs 上書き差分の確認 UI）
- **F-FU5**: image upload UI（admin の Storage path 整備とセット）
- **F-FU6**: products audit log（誰がいつ何を変更したか）
- **F-FU7**: 削除を soft delete に変更（products に deleted_at 追加、論理削除）

## 8. UAT（手動チェックリスト）

実環境で確認すること:

### 8.1 一覧
- [ ] `/admin/products` を AAL2 admin で開ける（未 enroll なら `/mfa/setup` に飛ぶ）
- [ ] 検索ワード入力で結果が絞れる、URL `?q=` に反映される
- [ ] フィルタ 2 つ重ねが AND で効く
- [ ] pagination で次ページに進める、戻れる

### 8.2 新規作成
- [ ] 必須項目だけで 1 件追加できる
- [ ] relation を 3 つ以上指定して保存し、再表示で全部反映されている
- [ ] 画像 URL を貼って表示される（upload は v1 任意）

### 8.3 編集
- [ ] 既存値がプリフィルされる
- [ ] 一部だけ変更 → 保存 → 他の項目が消えていない

### 8.4 import
- [ ] Sheets CSV を流して、N 件 inserted / M 件 updated / E 件 error が表示される
- [ ] error 行を直して再 import → 失敗ゼロになる

### 8.5 regression
- [ ] ADR-0009 の `/admin/makers` 承認フローが影響を受けていない
- [ ] ADR-0012 の MFA gate が引き続き効いている

## 9. 実装順（worker 視点 / 2 日スプリント）

```
Day 1 (Mon-Tue 火曜):
  AM: backend
      - GET /v1/admin/products (一覧 + search + filter + page)
      - POST/PUT/DELETE /v1/admin/products
      - 既存テストに admin/products router 追加（happy + AAL1 401）
  PM: frontend
      - /admin/products 一覧（SSR）
      - /admin/products/new, /[id] 編集フォーム（必須項目だけ）
      - layout sidebar に追加、dashboard カード追加

Day 2 (Tue-Wed 水曜):
  AM: CSV import（UI 無理なら scripts/import_products.py）
      - Ryosei さんと CSV 列名合意 → mapping 確定
      - dev で全件 import → 検証
  PM: 残 relation の multi-select UI 補填 → UAT → PR open → review → main merge → prod deploy
```

**早期に固める判断**:
- 水曜午前までに「import を UI で出すか scripts で逃げるか」を決める。判断基準: 火曜 EOD に UI が動かなければ scripts に切り替え
- 「全 9 relation の編集 UI を全部 v1 に乗せるか」も同様。最低 crops + certifications + benefits の 3 つを必達、残りは v1.5+ Follow-up に push

## 10. 質問（実装前に Ryosei / biz と詰めるべき）

- Q1: Sheets URL の共有可能リンク（実列名と件数確認）
- Q2: メーカー名は users.maker_profiles に既に全部登録されているか、未登録メーカーが何社あるか
- Q3: AgList の参照ページで「これは絶対に寄せたい」具体的セクション（スクショで 1〜2 箇所指定）
- Q4: 画像（ラベル / パッケージ）の入手経路と置き場所（Sheets 内 URL? 別 Drive?）
- Q5: 「公開非公開」運用方針（admin 登録直後は非公開デフォルト？即公開？）
