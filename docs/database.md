# Farmille v1 データベース設計

## 1. 設計方針

- 第3正規形を必ず守る。非正規化はパフォーマンス問題が実測で発生した場合のみ
- 主キーはすべて UUID 型（Supabase標準の `gen_random_uuid()`）
- タイムスタンプはすべて `TIMESTAMPTZ` 型（タイムゾーン付き）
- `auth.users` は Supabase 管理。`public.users` で参照する
- マスタデータ（作目・カテゴリ・効果区分等）は必ず独立テーブルとして管理
- 将来のAI処理・分析に耐えられる粒度でデータを保持する

## 2. エンティティ一覧

### 独立エンティティ

| テーブル | 責務 |
|----------|------|
| `users` | 全属性ユーザーの共通情報（auth.usersと1:1） |
| `products` | BS資材の基本情報 |
| `reviews` | 農家・普及員等のレビュー（1ユーザー×1製品=1レビュー制約） |

### サブエンティティ（ロール別プロフィール）

| テーブル | 責務 |
|----------|------|
| `farmer_profiles` | 農家固有情報（所在地・圃場面積） |
| `maker_profiles` | メーカー固有情報（企業名・所在地） |
| `ja_profiles` | JA職員固有情報（組織名） |
| `researcher_profiles` | 研究者固有情報（所属・専門分野） |

### マスタエンティティ

| テーブル | 件数 | 内容 |
|----------|------|------|
| `crop_categories_l1` | 6 | 作目大分類（果樹類・野菜類等） |
| `crop_categories_l2` | 27 | 作目中分類（かんきつ類等） |
| `crops` | 547 | 個別作目（りんご・トマト等） |
| `product_types` | 4 | 製品種別（BS資材・農薬・肥料・土壌改良材） |
| `product_benefits` | 25 | JBSA効果タグ（ver.1.0） |
| `review_points` | 10 | 気に入ったポイント |
| `product_composition_types` | 8 | JBSA表１分類 |
| `product_application_methods` | 5 | 施用方法 |
| `product_application_windows` | 6 | 施用時期 |
| `periods` | 36 | 月×旬（12ヶ月×3旬） |
| `certifications` | 未投入 | 認証体系（有機JAS等、確認待ち） |
| `product_science_technologies` | 未投入 | 技術分類（確認待ち） |

### 中間テーブル（多対多リレーション）

| テーブル | 関係 |
|----------|------|
| `product_benefit_relations` | 製品 × JBSA効果タグ |
| `product_composition_type_relations` | 製品 × 組成タイプ |
| `product_science_technology_relations` | 製品 × 技術分類 |
| `product_application_method_relations` | 製品 × 施用方法 |
| `product_application_window_relations` | 製品 × 施用時期 |
| `product_crops` | 製品 × 作目 |
| `product_certifications` | 製品 × 認証 |
| `product_prefectures` | 製品 × 販売地域 |
| `product_images` | 製品 × 画像 |
| `user_crops` | ユーザー × 関与作目 |
| `review_crops` | レビュー × 使用作目 |
| `review_benefit_relations` | レビュー × 実感した効果 |
| `review_point_relations` | レビュー × 気に入ったポイント |
| `review_period_relations` | レビュー × 使用時期 |

## 3. テーブル依存関係（レイヤー構造）

```
第1層（依存なし）: マスタテーブル群
  ↓
第2層: crop_categories_l2, users
  ↓
第3層: crops, *_profiles, products
  ↓
第4層: product_*, reviews, user_crops
  ↓
第5層: review_*
```

マイグレーションファイル `supabase/migrations/20260415000000_farmille_init.sql` はこの依存順で定義されている。

## 4. 主な設計判断

### `maker_id` のFK参照先
`products.maker_id` は `users(id)` を参照する（`maker_profiles(user_id)` ではない）。ロール制御はRLS + BFFで担保し、FK制約はシンプルに保つ。

### `product_benefit_relations` の設計意図
「メーカーが申告する推奨効果」と「農家が実感した効果（`review_benefit_relations`）」を分離している。この2軸の比較がFarmilleのコア価値。

### `reviews.UNIQUE(user_id, product_id)`
1ユーザーが同一製品に複数レビューを投稿できない制約。レビューの信頼性を担保。

### `crops.status` と承認フロー
作目マスタにユーザーからの追加申請を受け付ける仕組み（`pending` → `approved`）。v1ではCTOが手動承認。

### `unassigned` ロール
`handle_new_user` トリガーは `role='unassigned'` でINSERTする。オンボーディング未完了ユーザーの検出と回収フローに利用。

## 5. RLSポリシー方針

RLSのロール判定は `auth.jwt() -> 'app_metadata' ->> 'role'` を使用。

| テーブル種別 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| マスタ系 | 全員 | service_roleのみ | service_roleのみ | service_roleのみ |
| `users` | 本人のみ | トリガー経由 | 本人のみ | 不可 |
| `products` | 全員 | maker | 自社のみ | 自社のみ |
| `reviews` | 全員 | farmer/ja_staff/researcher | 本人のみ | 本人のみ |
| プロフィール系 | 本人のみ | 本人のみ | 本人のみ | 不可 |

## 6. トリガー

| トリガー | 対象 | 処理 |
|----------|------|------|
| `handle_new_user` | `auth.users` INSERT後 | `public.users` に `role='unassigned'` で自動INSERT |
| `update_updated_at` | `products`, `reviews` UPDATE前 | `updated_at` を `now()` に自動更新 |

## 7. インデックス

検索・集計でよく使うカラムに22個のインデックスを定義。中間テーブルの2番目FKカラムへの逆引きインデックス13個を含む。

詳細は `supabase/migrations/20260415000000_farmille_init.sql` を参照。
