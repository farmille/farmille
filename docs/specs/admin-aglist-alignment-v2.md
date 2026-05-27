# Admin UI alignment with AgList — 機能要件定義 v2

- 起票日: 2026-05-25（Mon）
- DoD（v1 prod デプロイ）: 2026-05-27（Wed）— main マージ済み × Vercel + Railway prod デプロイ済み
- 対象 milestone: Farmille v1（admin パネル v1 入り [[project_admin_panel_v1_inclusion]]）
- 関連 ADR: [ADR-0009](../decisions/0009-maker-approval-flow-and-admin-panel.md), [ADR-0012](../decisions/0012-admin-2fa-promotion-to-v1.md)
- 上位 spec: [maker-approval-admin.md](./maker-approval-admin.md)
- v1 spec（draft 残置）: [admin-aglist-alignment.md](./admin-aglist-alignment.md)
- 参照: AgList (https://aglist.com/) — Bubble.io 製の ag biologicals データベース
- Excel 入稿元: `/Users/ryogasakai/dev/farmille/Farmille_BS_materials_DB_template_detailed_prompt.xlsm`（@Ryosei Nemoto 編集、8 シート構造）

**v1 spec からの差分要約**: v1 spec 起票時の前提（架空 CSV / 9 中間テーブルで完結）は @Ryosei Nemoto 提供の実 Excel と乖離した。実 Excel は products 24 列 / application_recipes 21 列 / product_images 9 列という richer な構造で、現スキーマだけでは情報が落ちる。本 v2 で products に 10 列 + product_images に 6 列追加 + 新規テーブル `product_application_recipes` を起こす。同時に evaluator 指摘 10 修正必須を全反映し、F2 新規作成 UI / CSV import UI / 全 9 relation 編集を Follow-ups (v1.5+) に push してスコープを 2 日に切り詰める。

---

## 0. 背景 / 目的

運営メンバー（admin ロール）が **BS 資材マスタ（products）を業務的に管理できる画面** を v1 で出す。AgList は同領域の事実上のリファレンス UX なので、情報項目セットを揃え、ビジュアルは Farmille design-tokens（[docs/design-tokens.md](../design-tokens.md)）のトーン内で寄せる（pixel-perfect は v1 で要求しない）。同時に @Ryosei Nemoto が手作業で整備した 181 件の products マスタを dev/prod DB に流し込む。

「寄せる」とは:
- 画面分割（一覧 vs 詳細）と URL 構造（`/admin/products` 一覧、`/admin/products/[id]` 詳細）
- 詳細ページに表示すべき情報項目セット（Excel 24 列の products 本体 + application_recipes + product_images）
- 一覧の検索・フィルタ・カラム選定
- ビジュアルトーンは Tailwind 4 + Farmille design-tokens の範囲内に留める

「寄せない」もの（v1 スコープ外）:
- public 側 `/products`, `/product/[slug]` エンドユーザー画面（別 phase）
- `/distributor`, `/partner`, `/leaderboard`, `/subscription`（Farmille に無い概念）
- pixel-perfect AgList クローン
- Railway region 移行（Singapore → Tokyo）— Follow-ups §7 に隔離

## 0.1 暫定確定事項（biz 回答で上書き可）

biz lead 奥田さんへの確認待ち中だが、Ryoga 判断で以下を **暫定確定** として実装に進む。奥田さん回答で覆る場合は本 §0.1 を上書きし、必要なら spec 再評価。

| # | 質問 | 暫定確定 | 由来 |
|---|---|---|---|
| **Q1** | v1 投入範囲 | **B 案** = products 本体 + application_recipes のみ。sources / review_flags は v1.5+ | biz lead 奥田さん向け Q1 |
| **Q2** | AgList 寄せ視覚 | 情報項目セットを揃える。視覚は Farmille design-tokens のトーン。**pixel-perfect は v1 で要求しない** | biz lead 奥田さん向け Q2 |
| **Q3 / Q-E** | 公開非公開運用 | `products` に **新規列 `is_public boolean NOT NULL DEFAULT false`** 追加。`commercial_status`（available/discontinued/pre-launch、流通状態）と直交する別概念。admin 編集画面で toggle、初期値は **非公開**。Excel の confidence 列が「高」の行だけ初期 `is_public=true` で取り込む案を §4.4 で提示 | biz lead 奥田さん向け Q3 + evaluator Q-E |
| **Q-A** | F2 新規作成 UI の v1 採否 | **v1 削除**。Edit + List + 投入のみ。新規作成は v1.5+。理由: Excel 取り込みで 181 件マスタが揃う、admin が手で新規追加するシナリオは v1 期間に発生しない見込み | Ryoga 判断 |
| **Q-B** | 実 Excel 反映の場所 | **本 v2 spec で吸収**。v1 spec はそのまま draft 残置（履歴として保管） | Ryoga 判断 |
| **Q-C** | AAL2 vs service_role の投入経路 | one-off Python script は **禁止**。投入経路は `supabase/migrations/` に seed SQL を追加して `supabase db push` で流す（accountable、audit log が migrations に残る）。ADR 化は §7 Follow-ups で別議論 | Ryoga 判断 |
| **Q-D** | confidence 列の扱い | `products` に `confidence text` 追加。**UI 上は read-only 表示（高/中/低/要確認）。F1 一覧でバッジ表示、F3 編集画面で read-only 表示**（admin 内部品質管理用）。後段の公開ロジック / 品質フィルタにも利用 | Ryoga 判断（Q-R3 で訂正） |

未確定（Ryosei さん回答待ち、暫定で進める）:
- メーカーユニーク社数 → §9 に「Excel 取り込み前に admin/makers で全社が `approved + active` 状態であることを確認する事前ステップ」を組み込む
- 画像 URL「不明」行の扱い → **skip + review_flags 相当の TODO リスト** に積む方針

## 0.2 v1 spec からの主要変更点（evaluator 指摘 10 修正必須の要約）

| # | v1 spec | v2 spec | 由来 |
|---|---|---|---|
| 1.1 | 既存 products 列で AgList 充足と断言 | products に 10 列追加 + 新規 `product_application_recipes` + product_images に 6 列追加 | Excel 実構造との照合 |
| 1.2 | products RLS の admin SELECT 許可確認が要 | 既存 RLS は anon/authenticated の SELECT が全行開放済 → 新規 migration 不要。書き込みは BFF service_role bypass のみ | grep 検証で事実訂正 |
| 1.3 | `async with db.transaction():` 必須と断言 | postgrest-py に該当 API なし。delete-then-insert を try/except で囲み、途中失敗は 500 を返してユーザー再送信に委ねる（既存 products.py L399 の流儀踏襲） | postgrest-py 仕様確認 |
| 1.5 | upsert key 不明 | products に `UNIQUE (name, maker_id)` partial unique index 追加、import は (name, maker_id) で UPSERT | DOA 整合性 |
| 1.6 | 全 9 relation を v1 で UI 化と曖昧 | v1 必達は crops + certifications + benefits の 3 種のみ。残り 6 relation は v1.5+ | スコープ削減（Q-R1） |
| 1.7 | 画像 admin upload を「Storage path 整備で v1 可能」と曖昧 | product-images Storage RLS は `owner=auth.uid()` 縛りで admin 代理 upload 不可。**v1 は外部 URL 直入力のみ**、Storage UI は Follow-ups F-FU5 | RLS migration 確認 |
| 1.8 | one-off Python script with service_role を許容 | **禁止**。seed migration を 1 本書き `supabase db push` で流す。BFF `/v1/admin/products/import` UI は v1.5+ | AAL2 bypass の accountability 担保 |
| 1.9 | DOA 違反（10 項目を general_purpose 1 列に押し込めれば充足と暗黙仮定） | products に 10 列追加 migration を v1 必達として §4 / §5 で明記 | DOA 哲学準拠 |
| 1.10 | スコープが 2 日に収まらない（F1-F6 全機能 + 9 relation + CSV import UI） | F1, F3, F4, F5, F6 のみ。F2 / CSV import UI / 残 5 relation（prefectures + composition_types + science_technologies + application_methods + application_windows）+ product_images の drag-and-drop を Follow-ups push | スプリント現実主義（Q-R1 で target_crops は crops に統合） |
| 2.x | 改善推奨（メーカードロップダウン / メーカー名 normalize / index / リスク追加 / UAT 追加 / gen:types DoD） | 全反映（§2.2 / §3.3 / §4.2 / §6 / §8 / §5） | evaluator 推奨 |
| 3.1 | public 側 `/products`, `/product/[slug]`, `/manufacturers`, `/manufacturer/[id]` の AgList 化を §7 F-FU2 で v1.5+ に push | **v1 取り込みへ訂正**。SiteHeader / SiteFooter / hero band / 4-col grid / search bar / 詳細ページ AgList 寄せまで v1 範囲。§7 F-FU2 を取り消し、§1.1 に F7 として新設、§1.2 から除外 | 2026-05-27 spec 漏れ訂正（v1 spec 起案時に biz lead 奥田さん Q2「AgList トーンに寄せる」を §7 F-FU2 へ誤分類していた。実装と並行して §1.1 F7 に位置付け直し、polish + extend を本来の v1 スコープとして反映） |

---

## 1. スコープ

### 1.1 対象画面

| # | 画面 | 状態 | v2 採否 |
|---|---|---|---|
| F1 | `/admin/products`（一覧） | 未実装 | ✅ **v1 必達** |
| F2 | `/admin/products/new`（新規作成） | 未実装 | ❌ **§7 Follow-ups (v1.5+) に push** |
| F3 | `/admin/products/[id]`（編集） | 未実装 | ✅ **v1 必達** |
| F4 | products 投入（seed migration 経路） | 未実装 | ✅ **v1 必達**（CSV import UI は v1.5+） |
| F5 | `/admin`（ダッシュボード） | 実装済（B1 のみ機能） | ✅ products カード追加 + 件数表示 |
| F6 | `/admin/layout.tsx`（サイドバー） | 実装済 | ✅ 「資材マスタ」追加 |
| F7 | public 側 AgList 寄せ（SiteHeader/Footer + `/products` + `/products/[id]` + `/manufacturers` + `/manufacturers/[id]` + 拡張ページ `/articles` + `/articles/[slug]` + `/products/new` + `/me/profile` + `/maker/profile`） | 実装済（feat/admin-aglist-v2 で polish 中） | ✅ **v1 必達**（元 §7 F-FU2 から繰り上げ、§0.2 #3.1） |

### 1.2 非スコープ（v1 で着手しない）

- F2 新規作成 UI（§7 Follow-ups F-FU8）
- `/admin/products/import` の UI 経路（§7 Follow-ups F-FU4）
- 削除機能 + soft delete（§7 Follow-ups F-FU7）
- メーカーマスタの新規作成 UI（既存 ADR-0009 承認フロー経由のみ。本 spec で導線は作らない）
- products 以外のマスタ（categories / certifications / periods）メンテ UI
- レビュー × products の関連管理（既存）
- Storage 直 upload UI（§7 Follow-ups F-FU5）
- products に `slug` 追加（§7 Follow-ups F-FU3、public 化フェーズで）
- product_sources / product_review_flags テーブル投入（§7 Follow-ups F-FU9 / F-FU10）
- public AgList の pixel-perfect な完全再現（§0.1 Q2 維持。トーン寄せ + 情報項目セットまでが v1、細部ピクセル一致は不要）
- inline `style={{ borderRadius: "var(--radius-lg)" }}` を Tailwind config の `borderRadius.lg` 経由に集約するリファクタ（§7 Follow-ups F-FU14、視覚同値で v1.5+）

## 2. AgList 参照（IA / 主要画面）

AgList sitemap + OG メタから判明した構造:

| AgList path | 性質 | Farmille 対応 |
|---|---|---|
| `/products` | 全 ag biologicals の一覧、検索・フィルタ | **`/admin/products`** に寄せる（admin スコープ） |
| `/product/<slug>` | 商品詳細（OG image = label/datasheet スクショ） | **`/admin/products/[id]`** に寄せる |
| `/manufacturer/<slug>` | メーカープロフィール | 既存 `/admin/makers/[id]` と相互リンク |
| `/distributor/<slug>` | 販売代理店 | 非対応（v1 スコープ外） |
| `/leaderboard` | ランキング系 | 非対応 |
| `/blogs` | 記事 | `admin/articles` 既存、別 spec |

実画面の表示項目・フィルタ列名は SPA（Bubble.io）で SSR 0 のため HTML から取れない。**実装時は AgList の `/products` と `/product/<example>` 相当 1 ページのスクショを実装者で確認しながら情報項目セットを寄せる**（視覚詳細は実装時微調整可）。

## 3. 機能要件

### 3.1 F1: products 一覧（`/admin/products`）

**目的**: 運営が全 products を概観し、検索・フィルタで絞り込み、編集導線に入る。

**データソース**: 新規 BFF endpoint `GET /v1/admin/products`（FastAPI、admin + AAL2 必須）。RLS は既存 `products_select_all` で anon/authenticated に全行 SELECT 開放済（§4.3 で再確認）。

**画面要素**:

- ヘッダ
  - 見出し「資材マスタ」
  - **新規作成ボタンは v1 で出さない**（F2 は Follow-ups）
  - CSV インポートボタンも v1 で出さない（投入は seed migration 経路、§3.3）
- 検索バー（debounce 300ms、URL `?q=` 反映、name + product_name_jp の部分一致）
- フィルタ（URL クエリ反映）:
  - メーカー（maker_id、§2.2 のドロップダウン）— **v1 必達**
  - 製品種別（product_type）— v1 任意
  - 公開状態（**`is_public` toggle**）— v1 任意
  - 流通状態（commercial_status）— v1 任意
  - confidence（高/中/低/要確認）— v1 任意（admin 内部品質管理用）
- テーブル列（並べ替え対応列に ↕️）:
  | 列 | ソート | 表示形式 |
  |---|---|---|
  | サムネ | × | product_images で `is_primary=true` の URL / 無ければ design-tokens の placeholder spec 参照 |
  | 名前 (name) | ✓ | 太字 + 詳細リンク |
  | 和名 (product_name_jp) | × | 1 行 truncate |
  | メーカー | ✓ | maker_profiles.company_name（§2.2） |
  | 製品種別 | × | product_types.name |
  | 公開 | × | `is_public` バッジ（公開/非公開） |
  | 認証 | × | バッジ群 |
  | confidence | × | 高/中/低/要確認 のバッジ（admin 内部用） |
  | 更新日 (updated_at) | ✓ | YYYY-MM-DD |
  | 操作 | × | 「編集」リンク |
- pagination: server-side、20 件/ページ、`?page=` 反映
- 件数表示「全 N 件中 X-Y を表示」
- ソート安定化のため `(updated_at DESC, id DESC)` でタイブレーク（§4.2 で index 追加）

**受け入れ基準**:
- 検索キーワード変更で URL が更新され、戻る/進むで再現できる
- フィルタを 2 つ重ねた結果が AND 結合される
- pagination cursor が `(updated_at DESC, id DESC)` で安定

### 3.2 F3: products 編集（`/admin/products/[id]`）

**目的**: 既存 products の編集（v1 必達）。削除と新規作成は §7 Follow-ups。

**フォーム項目（v1 必達分のみ列挙、Excel 24 列 + 既存列の合算）**:

| セクション | 入力項目 | 型 | 必須 | 備考 |
|---|---|---|---|---|
| 基本 | name | text | ✓ | 既存列 |
| 基本 | product_name_jp | text |  | **新規列**、和名 |
| 基本 | maker_id | select | ✓ | §2.2 のドロップダウンから |
| 基本 | product_type_id | select |  | product_types マスタから |
| 基本 | commercial_status | select |  | 'available' / 'discontinued' / 'pre-launch'（流通状態） |
| 基本 | **is_public** | **toggle** |  | **新規列**、公開フラグ（DEFAULT false） |
| 説明 | general_purpose | textarea |  | 既存列（自由記述、Farmille 既存） |
| 説明 | primary_compound | text |  | 主要成分（既存列） |
| 説明 | mode_of_action | textarea |  | 作用機序（既存列） |
| 説明 | technology_action | textarea |  | **新規列**、技術原理 / 作用機序の Excel 由来文章 |
| 説明 | disease_pest_info | textarea |  | **新規列**、対象病害虫情報 |
| 説明 | expected_effects_official | textarea |  | **新規列**、メーカー公式の効果記述 |
| 説明 | expected_effects_farmille | textarea |  | **新規列**、Farmille 運営による平易な翻訳表現 |
| 使用 | usage_summary | textarea |  | **新規列**、使い方サマリ |
| 使用 | precautions | textarea |  | **新規列**、注意事項 |
| 使用 | storage_shelf_life | text |  | **新規列**、保存条件・有効期間 |
| 補足 | notes | textarea |  | **新規列**、その他メモ |
| 内部 | confidence | text |  | **新規列**、UI 上は read-only 表示（高/中/低/要確認） |
| 認証 | fertilizer_registered | boolean |  | 既存列 |
| 認証 | pesticide_registered | boolean |  | 既存列 |
| **関連（v1 必達 3 種）** | crops[] | multi-select |  | 対象作物（既存マスタ `product_crops`）。Excel の `products.target_crops` 列（,区切り文字列）はこの crops と同義扱いで取り込む（独立 relation を作らない、Q-R1） |
|  | certifications[] | multi-select |  | 既存マスタ |
|  | benefits[] | multi-select |  | JBSA 25 項目（既存マスタ） |
| ファイル | label_url | URL 直入力 |  | 既存列、Storage upload は v1.5+ |
| ファイル | sds_url | URL 直入力 |  | 既存列、Storage upload は v1.5+ |
| 画像 | product_images[] | **URL 直入力のみ** |  | drag-and-drop 並べ替えは v1.5+（§7 F-FU5）。Excel の URL 列を反映 |

**関連（v1.5+ 押し）**: prefectures / composition_types / science_technologies / application_methods / application_windows / product_images の drag-and-drop 並べ替え

**application_recipes セクション**:
- 同編集画面内に **「使用レシピ一覧」テーブル** を表示
- **v1 必達: read-only テーブル表示**（SSR で当該 product の `product_application_recipes` 全行を fetch して表示、編集 UI は v1.5+、Q-R2 確定）
- v1 で AgList 寄せの「資材詳細ページ」として施用レシピ無しは見劣りするため、表示自体は DoD に含める
- レシピ単位の inline 編集 UI は v1.5+ で十分（§7 Follow-ups）

**Action**: `PUT /v1/admin/products/{id}` を SSR Server Action から呼ぶ。9 中間 relation のうち v1 対象 3 種（crops + certifications + benefits）は delete-then-insert で更新（§6 R3 のリスク手当て）。

**RLS**: products テーブルへの UPDATE/DELETE は **service_role 経由（BFF で admin role + AAL2 を確認後）**。既存 RLS は触らず据え置き（§4.3）。

### 3.3 F4: products 投入（seed migration 経路、v1 必達）

**目的**: @Ryosei Nemoto の Excel データを **dev → prod の products に流し込み完了**。

**v2 採用方針（AAL2 bypass 禁止 / Q-C 暫定確定）**:

1. **変換 helper**: `backend/scripts/excel_to_seed_sql.py` を作成
   - 入力: `Farmille_BS_materials_DB_template_detailed_prompt.xlsm`
   - 依存: **`uv add openpyxl` 必達**（backend に未追加、grep 検証済み。`backend/pyproject.toml` に `openpyxl>=3.1.0` を追加 + `uv lock` の diff を同 PR にコミット）
   - 出力: SQL 文字列（`INSERT INTO products ... ON CONFLICT (name, maker_id) DO UPDATE SET ...` + `INSERT INTO product_application_recipes ...` + `INSERT INTO product_images ...`）
   - メーカー名 normalize（全角半角 / 株式会社括弧表記 / 末尾空白）を §2.3 の関数で前処理
   - 画像 URL「不明」行は **skip + WARN 出力**（review_flags 相当の TODO リストに積む、§4.4）
   - confidence 列を `products.confidence` にそのまま保存
   - **confidence='高' の行のみ `is_public=true`** で初期投入、それ以外は DEFAULT の `false`（Q3 整合）
2. **seed migration**: `supabase/migrations/20260526xxxxxx_seed_products_from_ryosei_export.sql` に出力 SQL を埋め込む
3. **投入**: `supabase db push --linked` で dev → prod の通常 migration 経路に乗せる

**禁止事項（明示）**:
- `from supabase import create_client; create_client(SERVICE_ROLE_KEY)` パターンの one-off Python 直流しは **禁止**
- BFF `POST /v1/admin/products/import` の UI 経路も v1 では作らない（v1.5+、§7 F-FU4）

**事前ステップ（§9 §運用整備）**:
- Excel 取り込み前に `/admin/makers` で **Excel に登場する全メーカーが `users.role='maker' AND users.status='active'` であることを確認**（未登録ならスキップして review_flags TODO に積む）
- `/v1/admin/makers?status=active` で取得して照合（§2.2）

### 3.4 F5: ダッシュボード追記（`/admin`）

- `/v1/admin/summary` レスポンスに `products_total: number` と `products_public_total: number`（is_public=true の件数）を追加
- ダッシュボードカード「資材マスタ」を追加、`total 件 / 公開中 N 件` 表示 + 「一覧へ」リンク

### 3.5 F6: サイドバー追記（`/admin/layout.tsx`）

- 既存ナビ（ダッシュボード / メーカー承認 / ユーザー管理 / 通報管理 / 記事管理 / 注目の資材 / バナー）に「**資材マスタ**」を追加（メーカー承認の次）

---

## 4. データ要件

### 4.1 既存スキーマと Excel の対応表（24 列マッピング）

**Excel sheet `products`（181 行 × 24 列）の各列を Farmille スキーマに対応付ける**:

| # | Excel 列 | products カラム | 新規 / 既存 |
|---|---|---|---|
| 1 | product_name | `name` | 既存 |
| 2 | product_name_jp | `product_name_jp` | **新規** |
| 3 | maker_name | maker_id 照合（§2.3 normalize 後） | 既存（FK） |
| 4 | product_type | product_type_id 照合（name 完全一致） | 既存（FK） |
| 5 | commercial_status | `commercial_status` | 既存 |
| 6 | primary_compound | `primary_compound` | 既存 |
| 7 | mode_of_action | `mode_of_action` | 既存 |
| 8 | technology_action | `technology_action` | **新規** |
| 9 | disease_pest_info | `disease_pest_info` | **新規** |
| 10 | expected_effects_official | `expected_effects_official` | **新規** |
| 11 | expected_effects_farmille | `expected_effects_farmille` | **新規**（Farmille 運営による平易翻訳） |
| 12 | usage_summary | `usage_summary` | **新規** |
| 13 | precautions | `precautions` | **新規** |
| 14 | storage_shelf_life | `storage_shelf_life` | **新規** |
| 15 | notes | `notes` | **新規** |
| 16 | fertilizer_registered | `fertilizer_registered` | 既存 |
| 17 | pesticide_registered | `pesticide_registered` | 既存 |
| 18 | label_url | `label_url` | 既存 |
| 19 | sds_url | `sds_url` | 既存 |
| 20 | general_purpose | `general_purpose` | 既存 |
| 21 | crops（,区切り） | `product_crops` 中間 | 既存 |
| 22 | certifications（,区切り） | `product_certifications` 中間 | 既存 |
| 23 | benefits（,区切り） | `product_benefit_relations` 中間 | 既存 |
| 24 | confidence | `confidence` | **新規** |

**Excel sheet `application_recipes`（163 行 × 21 列）→ 新規 `product_application_recipes` テーブル**:
- product_id（products.name + maker 照合で解決）
- crop_category / crop_name / cultivation_type / application_method / application_timing / growth_stage
- dilution_rate / dose_raw_text / dose_amount / dose_unit / dose_basis / solution_amount / original_liquid_equivalent
- max_dose_raw_text / max_dose_amount / max_dose_unit
- usage_notes / precautions_specific / confidence / sort_order

**Excel sheet `product_images`（177 行 × 9 列）→ 既存 `product_images` テーブル + 6 列追加**:
- product_id（解決済）
- url（既存 `image_url`）
- source_page_url / alt_text / image_type / is_primary / rights_note / confidence

**Excel sheet `sources`（181 行 × 8 列）**: **v1 投入なし**、v1.5+ で `product_sources` 新規テーブル化（§7 F-FU9）
**Excel sheet `review_flags`（173 行 × 6 列）**: **v1 投入なし**、v1.5+ で `product_review_flags` 新規テーブル化（§7 F-FU10）
**Excel sheet `lists`（58 行）**: マスタ値リスト。JBSA 効果 25 / 原材料 8 は既存テーブル `benefits` / `composition_types` と完全一致を §3.3 helper で検証
**Excel sheet `README` / `AI_prompt`**: 運用ドキュメント、参考扱いで投入なし

### 4.2 migration 一覧（v1 必達、3 本）

#### migration A: products 列追加 + confidence + is_public + UNIQUE + INDEX

`supabase/migrations/20260526000000_admin_aglist_v2_products_columns.sql`

```sql
-- 1. products に Excel 由来 10 列追加
ALTER TABLE products
  ADD COLUMN product_name_jp           text,
  ADD COLUMN technology_action         text,
  ADD COLUMN disease_pest_info         text,
  ADD COLUMN expected_effects_official text,
  ADD COLUMN expected_effects_farmille text,  -- Farmille 運営翻訳の平易表現
  ADD COLUMN usage_summary             text,
  ADD COLUMN precautions               text,
  ADD COLUMN storage_shelf_life        text,
  ADD COLUMN notes                     text,
  ADD COLUMN confidence                text,  -- 高/中/低/要確認
  ADD COLUMN is_public                 boolean NOT NULL DEFAULT false;

-- 2. (name, maker_id) UNIQUE index（upsert key）
-- 既に同名 + 同メーカーで複数登録されている dev データがある場合は事前に data fix が必要
CREATE UNIQUE INDEX idx_products_name_maker_unique
  ON products (name, maker_id);

-- 3. F1 一覧の安定ソート用 index
CREATE INDEX idx_products_updated_at_desc
  ON products (updated_at DESC, id DESC);

-- 注: `is_public` 用の partial index は v1 規模（181 件）ではメンテコストに対して効果薄のため追加しない。
--     データが増えて F1 一覧の is_public フィルタが遅くなったら v1.5+ で追加検討（§7 Follow-ups 候補）。
```

**設計判断（DOA 不可逆領域）**:
- 全 10 列とも nullable な text（Excel に欠損がある可能性。後段 NOT NULL は v1.5+ で個別に判定）
- `is_public` は `NOT NULL DEFAULT false`（非公開デフォルト、Q3 整合）
- `confidence` は CHECK 制約をつけない（v1 では Excel 値をそのまま保存、品質バリデーションは v1.5+）
- `UNIQUE (name, maker_id)` は partial 不要のフル UNIQUE（既存データに重複があるなら **migration 適用前に data fix が必要**、§6 R10）

#### migration B: 新規テーブル `product_application_recipes`

`supabase/migrations/20260526000001_admin_aglist_v2_application_recipes.sql`

```sql
CREATE TABLE product_application_recipes (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                 uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  crop_category              text,
  crop_name                  text,
  cultivation_type           text,
  application_method         text,
  application_timing         text,
  growth_stage               text,
  dilution_rate              text,
  dose_raw_text              text,
  dose_amount                numeric,
  dose_unit                  text,
  dose_basis                 text,
  solution_amount            text,
  original_liquid_equivalent text,
  max_dose_raw_text          text,
  max_dose_amount            numeric,
  max_dose_unit              text,
  usage_notes                text,
  precautions_specific       text,
  confidence                 text,
  sort_order                 int NOT NULL DEFAULT 0,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_application_recipes_product
  ON product_application_recipes (product_id);

-- updated_at 自動更新 trigger（v1 必達、Q-R4 確定）
-- 既存 `update_updated_at()` 関数（supabase/migrations/20260415000000_farmille_init.sql L345 で定義済、
-- products / reviews / articles / user_favorites / farmer_profiles 等で applies 実績あり）を reuse
CREATE TRIGGER trg_product_application_recipes_updated_at
  BEFORE UPDATE ON product_application_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS（§4.3 と整合）
ALTER TABLE product_application_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_application_recipes_select_all"
  ON product_application_recipes
  FOR SELECT TO anon, authenticated USING (true);

-- 書き込みは BFF service_role 経由のみ。authenticated 向け INSERT/UPDATE/DELETE policy は意図的に作らない
-- （policy 不在 = 拒否、BFF が唯一の書き込み経路。既存 admin pattern と整合、maker-approval-admin.md §7.2）
```

#### migration C: product_images に 6 列追加

`supabase/migrations/20260526000002_admin_aglist_v2_product_images_columns.sql`

```sql
ALTER TABLE product_images
  ADD COLUMN source_page_url text,
  ADD COLUMN alt_text        text,
  ADD COLUMN image_type      text CHECK (image_type IN ('product_packaging','product_logo','application_scene','other')),
  ADD COLUMN is_primary      boolean NOT NULL DEFAULT false,
  ADD COLUMN rights_note     text,
  ADD COLUMN confidence      text;

-- F1 一覧のサムネ取得（is_primary=true）用 partial index
CREATE INDEX idx_product_images_primary
  ON product_images (product_id) WHERE is_primary = true;
```

**設計判断**:
- `image_type` は CHECK 制約付き text 4 値で開始（既存 `users.status` / `users.role` と同パターン）
- `is_primary` 一意性（1 product につき primary は 1 件）は v1 では制約せず、F4 投入 helper 側で「product あたり最大 1 件 primary」を保証する。後で `EXCLUDE` 制約 or 部分 UNIQUE 化は v1.5+

#### migration D（seed）: Excel データ投入

`supabase/migrations/20260526xxxxxx_seed_products_from_ryosei_export.sql`
- §3.3 helper `excel_to_seed_sql.py` で生成
- `ON CONFLICT (name, maker_id) DO UPDATE SET ...` で upsert
- 1 ファイル長大化を許容（v1 は 1 回きりの投入なので可読性より accountability 優先）

### 4.3 RLS（事実関係訂正）

**v1 spec の誤認**: 「products / 中間テーブルは admin SELECT 許可が要、migration が必要かも」と書いたが事実誤り。

**事実**（`20260415000003_farmille_rls.sql` L210-366 grep 検証済み）:
- `products` / 9 中間テーブル全部（product_images / product_certifications / product_prefectures / product_benefit_relations / product_composition_type_relations / product_science_technology_relations / product_application_method_relations / product_application_window_relations / product_crops）すべてに `*_select_all` policy が存在
- ポリシーは `FOR SELECT TO anon, authenticated USING (true)` で全行開放
- admin も `anon` か `authenticated` のいずれかなので追加 policy 不要で SELECT 可
- INSERT / UPDATE / DELETE は `maker_id = auth.uid()` の owner policy のみ。admin policy は **存在しない**

**結論**:
- **SELECT 用 migration は新規追加なし**（既存 policy のままで F1 一覧 / F3 編集の読み取りは動く）
- **書き込み（INSERT/UPDATE/DELETE）は BFF (FastAPI) で `require_role("admin")` + `require_aal("aal2")` を確認後、Supabase service_role キーで RLS bypass**（[maker-approval-admin.md](./maker-approval-admin.md) §A.5 / §7.2 と同じパターン）
- 新規追加テーブル `product_application_recipes` にも `select_all` policy を 1 個書く（§4.2 migration B に含む）。書き込みは BFF only

### 4.4 投入手順（§3.3 詳細）

```
[step 1] backend/scripts/excel_to_seed_sql.py を作成
  - 事前: `uv add openpyxl` 必達（backend/pyproject.toml に `openpyxl>=3.1.0` 追加 + uv.lock 更新を同 PR にコミット）
  - openpyxl で .xlsm を読む
  - 各シートを DataFrame 風に読み出し
  - メーカー名 normalize（§2.3）して maker_id を解決
  - products → product_application_recipes → product_images の順で INSERT SQL を生成
  - upsert は (name, maker_id) で ON CONFLICT
  - confidence='高' の行のみ is_public=true、それ以外は DEFAULT false
  - 画像 URL が「不明」/ 空 / 「TODO」等の行は WARN + skip + skip_log.md に積む
  - 出力: supabase/migrations/20260526xxxxxx_seed_products_from_ryosei_export.sql

[step 2] dev 適用
  cd /Users/ryogasakai/dev/farmille
  supabase db push --linked
  → exit 0 / 件数確認: SELECT COUNT(*) FROM products WHERE updated_at > '2026-05-26';

[step 3] pnpm gen:types で frontend 型再生成
  cd frontend && pnpm gen:types
  → diff を同 PR にコミット

[step 4] prod 適用
  Supabase prod 環境で同じく db push（dev で動作確認後）
  → /admin/products 一覧で 181 件（or skip 分を引いた件数）表示確認
```

### 4.5 (name, maker_id) UNIQUE index 追加

§4.2 migration A に含めた `idx_products_name_maker_unique` を再強調:
- 既存 dev データに重複（同名 + 同メーカー）があるなら **migration 適用前に Supabase Studio で data fix**（手動 SQL で重複削除 or rename）
- 重複なしの確認 SQL: `SELECT name, maker_id, COUNT(*) FROM products GROUP BY 1, 2 HAVING COUNT(*) > 1;`
- §9 実装順 step 1 にこの check を入れる

### 2.2 メーカードロップダウンの取得元（evaluator §2.2 改善）

F3 編集画面の maker_id select の選択肢は:
- BFF `/v1/admin/makers?status=active` から取得（既存 `manufacturers_public.py` ではなく admin endpoint）
- フィルタ条件: `users.role='maker' AND users.status='active'`
- 表示: `maker_profiles.company_name`（無ければ `users.name`）— v1 spec の `brand_name` は誤記、実 schema は `company_name`
- **v1 必達: `GET /v1/admin/makers?status=active` を新規追加実装**（既存 `backend/app/routers/admin.py` には `/v1/admin/makers/pending` のみで status filter 対応 endpoint は未実装、grep 検証済み）。§12 「既存修正」の admin.py 行に明記

### 2.3 メーカー名 normalize 関数（evaluator §2.3 改善）

§3.3 helper で import 前に適用:

```python
def normalize_maker_name(name: str) -> str:
    # 1. 全角 → 半角（英数字 / スペース）
    name = unicodedata.normalize('NFKC', name)
    # 2. 「株式会社X」「（株）X」「X(株)」「X株式会社」を正規化
    #    → 一律「X」に揃える（DB 側 company_name の表記揺れを吸収するため）
    name = re.sub(r'(株式会社|（株）|\(株\))', '', name)
    # 3. 末尾 / 先頭の空白除去
    return name.strip()
```

- 正規化後の文字列 + DB の `company_name` の **両方を normalize して照合**（DB 側に揺れがあれば事前に Supabase Studio で正規化）
- 照合失敗（unmatched）行は seed 生成時に WARN + skip_log.md に積む

---

## 5. 受け入れ基準（DoD: main マージ × prod デプロイ by 2026-05-27 Wed）

**必達（v2 で削減）**:
- [ ] §4.2 migration A / B / C が dev に適用済、 `supabase db push --linked` exit 0
- [ ] § 4.4 step 1 の `backend/scripts/excel_to_seed_sql.py` がコミット済、dev で実行成功
- [ ] §4.2 migration D (seed) が dev に適用済、`/admin/products` 一覧で 181 件 - skip 分が表示
- [ ] migration 適用後 `pnpm gen:types` 実行済、`frontend/src/types/database.ts` の diff が同 PR にコミット済
- [ ] `/admin/products` 一覧が表示でき、検索（name + product_name_jp）+ 最低 1 つのフィルタ（maker_id 推奨）+ pagination が動く
- [ ] `/admin/products/[id]` で編集 → 保存できる。最低 v1 必達 3 種 multi-select（crops + certifications + benefits）が動く
- [ ] **`/admin/products/[id]` で当該 product の `product_application_recipes` 全行が read-only テーブルで表示される（編集 UI は v1.5+、Q-R2 確定）**
- [ ] **`backend/pyproject.toml` に `openpyxl>=3.1.0` を追加、`uv lock` の diff が同 PR にコミット済（Q-R3 / 3.3 helper の必須依存）**
- [ ] **`product_application_recipes` テーブルに `update_updated_at()` trigger が applies されている（既存関数 reuse、Q-R4 確定）**
- [ ] §3.3 投入経路が seed migration 経由のみ。one-off Python script with service_role を使っていない（grep `create_client.*SERVICE_ROLE_KEY` で 0 件）
- [ ] サイドバー「資材マスタ」リンクと dashboard 件数カード（`products_total` / `products_public_total`）が表示される
- [ ] `pnpm tsc --noEmit` / `pnpm lint` clean、`pnpm build` exit 0
- [ ] backend `uv run pytest` clean（admin/products router の最低 happy + AAL1 → 401 `aal_insufficient` テスト）
- [ ] **F7 public AgList**: SiteHeader（深緑 + Sprout）/ SiteFooter（4-col + © bar、layout.tsx 集約 + HIDDEN_PATH_PREFIXES）/ `/products` 一覧（hero band + 4-col grid + search bar + URL `?q=` 永続化）/ `/products/[id]` 詳細（hero + 2-col image + 2-col 詳細表 + tag chip 群）/ `/manufacturers` 一覧 + 詳細 / `/articles` + `/articles/[slug]` / `/products/new` / `/me/profile` / `/maker/profile` まで AgList トーン適用済（pixel-perfect は §1.2 で除外）
- [ ] **F7 デザイントークン規約**: `rgba(255,255,255,X)` は `--overlay-on-{dark,light}-{soft,strong}` 4 token に集約、`#ffffff` 直書きなし、`text-[11px]` 等 §3 スケール外サイズなし、interactive 要素全てに `focus-visible:ring-*` 付与（WCAG 2.4.7）
- [ ] §8 UAT を Ryoga が手動 pass
- [ ] **依存セキュリティ**: `pnpm audit --audit-level=high` と `uvx pip-audit` を PR open 前に実行、high+ がブロック判定（新規パッケージ追加は openpyxl くらいで軽い扱い）
- [ ] PR が main にマージされ、Vercel + Railway の prod デプロイが SUCCESS

**v1.5+ に push（任意 / Follow-ups）**:
- [ ] F2 新規作成 UI
- [ ] CSV import の BFF UI（`POST /v1/admin/products/import`）
- [ ] 残 5 relation の編集 UI（prefectures / composition_types / science_technologies / application_methods / application_windows）
- [ ] product_images の drag-and-drop 並べ替え
- [ ] 削除 + soft delete migration
- [ ] product_sources / product_review_flags の投入

---

## 6. 想定外 / リスク

- **R1**: Excel の列名 / シート構造が v2 spec 記載と乖離 → §4.1 マッピング表を実 Excel と再照合する step を §9 step 1 に含める
- **R2**: 既存 dev データに `(name, maker_id)` 重複 → migration A 適用前に Supabase Studio で data fix（§4.5）。検査 SQL を §9 step 1 で実行
- **R3**: relation テーブル更新の transaction 不在
  - postgrest-py に `async with db.transaction():` は **存在しない**（v1 spec の誤認を訂正）
  - 採用方針: 既存 `backend/app/routers/products.py` L399 の流儀「中間テーブル delete-then-insert を try/except で囲み、途中失敗時は 500 を返してユーザー再送信に委ねる」
  - 不採用: PostgREST RPC で SQL function (BEGIN ... COMMIT) を 1 個書く案 → v1.5+ Follow-ups F-FU11 に push
  - 妥当性: admin は 3 名、低頻度、手動 retry 可能。1 リクエストで v1 対象 3 種 relation（crops + certifications + benefits）× delete-then-insert の途中失敗は実害低い
- **R4**: Storage RLS の admin 代理 upload 不可（`product-images` バケット INSERT は `owner = auth.uid()` 縛り、`20260423000000_product_images_storage_rls.sql`）
  - v2 採用方針: 画像は **外部 URL 直入力のみ**（Excel の product_images シートが既に URL 列なので問題なし）
  - Storage 経由 upload UI は v1.5+ Follow-ups F-FU5 に push
- **R5**: AAL2 必須化（ADR-0012）により、admin endpoint 呼び出しは MFA セットアップ済みアカウントが必要。dev でも MFA enroll 後でないと F1/F3 が走らない（既存 ADR-0012 で対応済、本 spec で再確認のみ）
- **R6**: メーカー名 normalize の取りこぼし → §2.3 関数で吸収するが、normalize しても matched できない行は WARN + skip_log.md に積む（手動でメーカー登録 → 再投入の循環）
- **R7**: **confidence 列の v1 扱い**
  - admin 内部品質管理用の read-only 表示として保持（UI 上は F1 一覧のバッジ + F3 編集の read-only テキスト）
  - v1 では公開ロジックに直結させない（is_public toggle が独立判断）
  - v1.5+ で confidence='高' 自動公開等の運用ロジック検討
- **R8**: **image URL「不明」行の扱い**
  - §3.3 helper で skip + skip_log.md に積む方針
  - skip された画像は F1 一覧で placeholder（design-tokens.md の placeholder spec 参照）
  - v1.5+ で `product_review_flags` テーブル化 + admin TODO 画面（§7 F-FU10）
- **R9**: **既存 reviews と products の関連**
  - 本 spec で products カラム / RLS / 中間テーブルを触るが、既存 `reviews.product_id` への影響なし（CASCADE 設定済、`20260424000001_reviews_product_cascade.sql`）
  - 既存レビューが付いた products の編集時、レビュー側に表示揺れが起きないか UAT §8.5 で確認

---

## 7. Follow-ups（v1.5+）

| # | 項目 | 由来 |
|---|---|---|
| F-FU1 | Railway backend region を asia-southeast1（Singapore）→ asia-northeast1（Tokyo）に移行 | v1 spec §7-F-FU1 継承 |
| ~~F-FU2~~ | ~~public 側 `/products`, `/product/[slug]` の AgList 化（SSR + SEO）~~ → **2026-05-27 v1 取り込みへ昇格、§1.1 F7 / §0.2 #3.1 参照** | v1 spec §7-F-FU2 → v1 |
| F-FU3 | products に `slug` カラム追加 + 一意制約 + 自動生成 | v1 spec §7-F-FU3 継承 |
| F-FU4 | CSV import の BFF UI（`POST /v1/admin/products/import`）+ diff preview | v2 §0.1 Q-A / Q-C push |
| F-FU5 | image upload UI（admin の Storage path 整備とセット） | v2 §6 R4 push |
| F-FU6 | products audit log（誰がいつ何を変更したか） | v1 spec §7-F-FU6 継承 |
| F-FU7 | 削除を soft delete に変更（products に deleted_at 追加、論理削除） | v1 spec §7-F-FU7 継承 |
| F-FU8 | **F2 新規作成 UI（`/admin/products/new`）** | v2 §0.1 Q-A push |
| F-FU9 | `product_sources` テーブル新規 + 投入（181 行の出典管理） | v2 §0.1 Q1 push |
| F-FU10 | `product_review_flags` テーブル新規 + 投入（173 行の要確認管理）+ admin TODO 画面 | v2 §0.1 Q1 / §6 R8 push |
| F-FU11 | PostgREST RPC で BEGIN/COMMIT を 1 個書く transaction 設計 | v2 §6 R3 push |
| F-FU12 | 残 5 relation の編集 UI（prefectures / composition_types / science_technologies / application_methods / application_windows）+ product_images drag-and-drop | v2 §1.2 push |
| F-FU13 | seed migration の ADR 化（accountable な投入経路の標準化） | v2 §0.1 Q-C push |
| F-FU14 | inline `borderRadius: var(--radius-lg)` を Tailwind config の `borderRadius.lg` に集約 + globals.css の shadcn ブリッジ整合 | 2026-05-27 §1.2 push（規模 15 ファイル + tailwind.config、視覚同値のためスピード優先で延期） |

---

## 8. UAT（手動チェックリスト、AAL2 負ケース込み）

実環境で確認すること:

### 8.1 一覧
- [ ] `/admin/products` を AAL2 admin で開ける（未 enroll なら `/mfa/setup` に飛ぶ、ADR-0012）
- [ ] 検索ワード入力（name + product_name_jp の両方で hit）で結果が絞れる、URL `?q=` に反映される
- [ ] フィルタ 2 つ（例: maker + is_public）重ねが AND で効く
- [ ] pagination で次ページに進める、戻れる
- [ ] サムネが product_images.is_primary=true の URL で表示、無い行は placeholder

### 8.2 編集
- [ ] 既存値がプリフィルされる（10 新規列含む全項目）
- [ ] is_public toggle ON/OFF で保存 → 再表示で反映
- [ ] confidence は read-only 表示で編集できない（v1 仕様、F1 一覧バッジ + F3 read-only テキスト）
- [ ] 一部だけ変更 → 保存 → 他の項目が消えていない
- [ ] v1 必達 3 種 relation（crops/certifications/benefits）を全部に値を指定して保存し、再表示で全部反映されている
- [ ] **v1 必達: application_recipes 全行が read-only テーブルで表示される**（当該 product に紐づく `product_application_recipes` 行が無ければ「該当データなし」が表示される）

### 8.3 投入
- [ ] dev で `excel_to_seed_sql.py` を実行 → seed migration が生成される
- [ ] `supabase db push --linked` で seed 適用 → exit 0
- [ ] dev `/admin/products` 一覧で 181 件 - skip 分が表示
- [ ] confidence='高' の行が is_public=true で取り込まれている（SQL で抽出確認）
- [ ] skip_log.md に画像 URL 不明行 / メーカー unmatched 行が記録されている

### 8.4 AAL2 負ケース（ADR-0012 整合、evaluator §2.6 追加）
- [ ] `/admin/products` に AAL1 admin でアクセス → `/mfa/challenge?next=/admin/products` にリダイレクト
- [ ] `/v1/admin/products` に AAL1 Bearer で curl → 401 `aal_insufficient` レスポンス
- [ ] `/v1/admin/products/{id}` PUT に AAL1 Bearer で curl → 401 `aal_insufficient`
- [ ] non-admin role の AAL2 Bearer で `/v1/admin/products` GET → 403 `not_admin`

### 8.5 regression
- [ ] ADR-0009 の `/admin/makers` 承認フローが影響を受けていない
- [ ] ADR-0012 の MFA gate が引き続き効いている
- [ ] 既存 reviews の products 関連が壊れていない（reviews 一覧で products が引ける）
- [ ] 既存 maker UI で自社 products 編集が動く（products UPDATE の RLS 既存 owner policy が壊れていないこと）

---

## 9. 実装順（worker 視点 / 2 日スプリント、現実版）

```
Day 1 (Tue 2026-05-26):
  AM:
    [step 0] 事前 check
      - 既存 dev データの (name, maker_id) 重複検査（§4.5 SQL）→ 必要なら data fix
      - Excel 取り込み前に admin/makers で全メーカーが approved + active 状態であることを確認
      - 不一致あれば SQL 直で users.status を active に or memo
    [step 1] DB / migration（不可逆領域確定）
      - migration A (products 10 列追加 + UNIQUE + INDEX) 作成
      - migration B (product_application_recipes 新規) 作成
      - migration C (product_images 6 列追加) 作成
      - supabase db push --linked で dev 適用
      - pnpm gen:types で frontend 型再生成 → diff コミット
    [step 2] 投入 helper + seed migration
      - backend/scripts/excel_to_seed_sql.py 作成（メーカー名 normalize §2.3 含む）
      - 実 Excel から SQL 生成 → migration D に埋め込み
      - supabase db push --linked で seed 適用 → 件数確認
  PM:
    [step 3] backend BFF
      - GET /v1/admin/products（search + filter + pagination）
      - PUT /v1/admin/products/{id}（service_role bypass、9 relation delete-then-insert で v1 対象 3 種のみ）
      - GET /v1/admin/products/{id}（編集画面プリフィル用、product_application_recipes も同 fetch で返す）
      - GET /v1/admin/makers?status=active（§2.2 ドロップダウン用、**新規追加必達**。既存 admin.py には /pending のみ）
      - GET /v1/admin/summary レスポンスに products_total / products_public_total 追加
      - backend/tests/test_admin_products_router.py 新規（happy + AAL1 401 + 非 admin 403）

Day 2 (Wed 2026-05-27):
  AM:
    [step 4] frontend
      - /admin/products 一覧（SSR、検索 + maker フィルタ + pagination + confidence バッジ表示）
      - /admin/products/[id] 編集フォーム（10 新規列 + is_public toggle + confidence read-only + v1 必達 3 種 relation multi-select + application_recipes read-only テーブル）
      - /admin/layout.tsx に「資材マスタ」サイドバー追加
      - /admin/page.tsx に products カード追加（件数 + 公開中件数）
    [step 5] UAT
      - §8 全項目を Ryoga 手動 pass
      - skip_log.md / 重複 data fix の記録を docs/setup-log.md に追記
  PM:
    [step 6] 仕上げ
      - pnpm audit --audit-level=high / uvx pip-audit 実行 → high+ あれば対応
      - pnpm tsc --noEmit / pnpm lint / pnpm build → exit 0 確認
      - backend uv run pytest → 全 pass
      - PR open → evaluator review → main merge
      - Vercel + Railway prod デプロイ確認
      - prod でも /admin/products 一覧で 181 件 - skip 分が表示されることを目視確認
```

**早期に固める判断**:
- Day 1 AM に「dev (name, maker_id) 重複ありか / メーカー unmatched 行が何件か」を Ryoga が確認。1 桁台なら手動 fix で進む、2 桁以上なら Ryosei さんに Slack で sanity check
- Day 1 PM EOD に backend BFF が動かなければ Day 2 AM に持ち越し。**F3 編集 UI は §5 DoD で v1 必達のため、間に合わない場合は DoD 未達扱い → 翌週 hotfix PR を組む**（Day 2 内に持ち越せない選択肢は撤回、Q-R9 整合）

---

## 10. 待機中の biz / data 質問（解決時に spec を更新）

### 10.1 biz lead 奥田さん向け（暫定確定済、上書きされたら §0.1 更新）
- [ ] Q1: v1 投入範囲は B 案（products + application_recipes のみ）で進めて良いか
- [ ] Q2: AgList 寄せは「情報項目セット揃える / 視覚は Farmille design-tokens トーン、pixel-perfect は要求しない」で良いか
- [ ] Q3: products に `is_public` 列追加 + DEFAULT 非公開 + admin toggle、で運用方針合っているか
- [ ] Q5: confidence='高' を初期 `is_public=true` で取り込む案、で良いか

### 10.2 Ryosei さん向け（実装は暫定で進む、回答あり次第 §6 R6 / R8 を更新）
- [ ] メーカーユニーク社数（全社が `users.status='active'` で登録済か）
- [ ] 画像 URL「不明」行の最終扱い（skip + TODO で良いか、それとも別途整備するか）
- [ ] Excel sheet `lists` のマスタ値（JBSA 効果 25 / 原材料 8）が既存 DB の `benefits` / `composition_types` と完全一致しているか（差分あれば追加 seed が必要）

---

## 11. 触らないファイル

- 既存 migration `20260415000000_farmille_init.sql` 〜 `20260514100001_users_status.sql`（**ALTER は禁止、新規 migration ファイルで追加のみ**）
- 既存 RLS `20260415000003_farmille_rls.sql`（既存 products / 中間テーブル policy は据え置き、§4.3）
- `backend/app/routers/auth.py` の `register_role`（`SIGNUP_ROLES` 不変）
- `backend/app/routers/reviews.py` / `me.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py`（無関係）
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*`（オンボーディング UI 不変）
- `frontend/src/app/maker/*`（既存メーカー UI、自社プロフ編集は影響なし）
- `frontend/src/proxy.ts`
- `.claude/` 配下
- 既存 spec ファイル `docs/specs/admin-aglist-alignment.md`（v1 draft、削除 / 上書き禁止、本 v2 と並列保管）

## 12. 触るファイル（予想）

### 新規
- `supabase/migrations/20260526000000_admin_aglist_v2_products_columns.sql`（§4.2 migration A）
- `supabase/migrations/20260526000001_admin_aglist_v2_application_recipes.sql`（§4.2 migration B）
- `supabase/migrations/20260526000002_admin_aglist_v2_product_images_columns.sql`（§4.2 migration C）
- `supabase/migrations/20260526xxxxxx_seed_products_from_ryosei_export.sql`（§4.2 migration D、helper で自動生成）
- `backend/scripts/excel_to_seed_sql.py`（§3.3 / §4.4）
- `backend/app/routers/admin_products.py`（新規ルーター、GET 一覧 + GET 詳細 + PUT 編集 + GET makers 候補）
- `backend/tests/test_admin_products_router.py`
- `frontend/src/app/admin/products/page.tsx`（F1 一覧）
- `frontend/src/app/admin/products/[id]/page.tsx`（F3 編集）
- `frontend/src/app/admin/products/[id]/_components/edit-form.tsx`（Client Island）
- `frontend/src/app/admin/products/[id]/_components/relations-multiselect.tsx`（Client Island、v1 必達 3 種: crops + certifications + benefits）

### 既存修正
- `backend/app/main.py`（`admin_products.router` の include）
- `backend/app/models/schemas.py`（products / application_recipes / images の Pydantic 追加）
- `backend/app/routers/admin.py`（`/v1/admin/summary` レスポンスに `products_total` / `products_public_total` 追加、**`/v1/admin/makers?status=active` を新規追加必達**。既存は `/v1/admin/makers/pending` のみで status filter 対応 endpoint は未実装、grep 検証済み）
- `backend/pyproject.toml`（`openpyxl>=3.1.0` 追加必達、§3.3 / §4.4 helper の依存）
- `backend/uv.lock`（`uv add openpyxl` の diff、同 PR にコミット）
- `frontend/src/app/admin/layout.tsx`（サイドバーに「資材マスタ」追加）
- `frontend/src/app/admin/page.tsx`（ダッシュボードに products カード追加）
- `frontend/src/types/database.ts`（`pnpm gen:types` で自動再生成、コミット必須）
- `docs/setup-log.md`（投入時の skip_log / data fix 記録）

---

**以上 — Ryoga による最終マージ判断と evaluator 再レビュー待ち**
