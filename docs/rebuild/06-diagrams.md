# 06 図解 — ER 図・シーケンス図・画面遷移図

生成元：`supabase/migrations/` 全15本と `src/` の実装（2026-08-24・ブランチ rebuild/m0）。設計書（01・02）の図は概念設計時の簡略版であり、**実装と食い違う場合は本書が正**。スキーマ・ルーティング・主要フローを変更する PR は本書の該当図も更新すること。

GitHub 上でそのまま Mermaid がレンダリングされる。閲覧用のスタンドアロン版（同一ソースから生成）：https://claude.ai/code/artifact/cbd39abf-0d38-4b1e-92c5-38d943f1765f

- [1. ER 図](#1-er-図)
- [2. シーケンス図](#2-シーケンス図)
- [3. 画面遷移図](#3-画面遷移図)

---

## 1. ER 図

38 テーブル。読みやすさのため「全体俯瞰」＋ドメイン別 4 枚に分割する。列はすべて実物どおり（`created_at`／`updated_at` は全テーブルにあるため各図では省略）。点線＝ポリモーフィック参照（FK 制約なし・`target_type`＋`target_id`）。

### 1.1 全体俯瞰

```mermaid
erDiagram
    auth_users ||--o| profiles : "一般ユーザー 1:1"
    auth_users ||--o| seller_accounts : "共有ログイン 1:0..1"

    profiles ||--o{ profile_crops : ""
    crop_groups ||--o{ crops : ""
    crops ||--o{ profile_crops : ""

    seller_accounts ||--o{ materials : "claim（NULL=未claim）"
    seller_accounts ||--o{ articles : "著者"
    seller_accounts ||--o{ material_edit_requests : "申請"

    composition_types ||--o{ materials : "組成"
    materials ||--o{ material_effects : ""
    effects ||--o{ material_effects : ""
    effect_categories ||--o{ effects : ""
    materials ||--o{ material_crops : ""
    crops ||--o{ material_crops : ""
    materials ||--o{ material_search_tags : ""
    search_tags ||--o{ material_search_tags : ""
    materials ||--o{ material_ingredient_categories : ""
    ingredient_categories ||--o{ material_ingredient_categories : ""
    materials ||--o{ material_ingredients : ""
    ingredients ||--o{ material_ingredients : ""
    ingredient_categories ||--o{ ingredients : ""
    materials ||--o{ material_product_types : ""
    product_types ||--o{ material_product_types : ""
    materials ||--o{ material_images : ""
    materials ||--o{ material_evidences : ""
    materials ||--o{ material_sources : ""
    materials ||--o{ material_edit_requests : ""
    materials ||--o{ reviews : ""
    materials ||--o{ usage_reports : ""
    materials ||--o{ saved_materials : ""
    materials ||--o{ article_materials : ""
    materials ||--o{ questions : "Phase2"

    profiles ||--o{ reviews : "投稿"
    profiles ||--o{ usage_reports : "投稿"
    profiles ||--o{ saved_materials : "検討リスト"
    profiles ||--o{ helpful_votes : "参考になった"
    profiles ||--o{ content_reports : "通報"
    reviews ||--|{ review_crops : "作目（1件以上）"
    crops ||--o{ review_crops : ""
    crops ||--o{ usage_reports : "作目"

    reviews ||--o{ review_photos : ""
    usage_reports ||--o{ usage_report_applications : ""
    usage_reports ||--o{ usage_report_media : ""
    usage_reports ||--o{ usage_report_metrics : ""

    articles ||--o{ article_materials : ""
    questions ||--o{ answers : "Phase2"

    helpful_votes }o..o{ reviews : "対象(FKなし)"
    helpful_votes }o..o{ usage_reports : "対象(FKなし)"
    content_reports }o..o{ reviews : "対象(FKなし)"
    view_events }o..o{ materials : "対象(FKなし)"
```

### 1.2 アカウント

```mermaid
erDiagram
    auth_users {
        uuid id PK "Supabase Auth。app_metadata に account_type / seller_id"
    }
    profiles {
        uuid user_id PK, FK "auth.users.id・CASCADE"
        text handle UK "1〜30文字"
        smallint prefecture_code "NOT NULL・1〜47"
        boolean prefecture_public "NOT NULL・default true"
        text standpoint "NOT NULL・farmer/ja/maker_related/expert/other・内部専用"
        text avatar_url
        text bio
        text_array cultivation_styles
        text affiliation "所属バッジ・任意"
        text website_url
        text sns_url
    }
    seller_accounts {
        uuid id PK
        uuid auth_user_id FK, UK "auth.users.id・SET NULL・承認時に発行"
        text official_name "NOT NULL"
        text seller_type "NOT NULL・maker/ja/farm_corp/expert/other"
        text login_id UK "NOT NULL・^[a-z0-9][a-z0-9._-]{2,30}$"
        text contact_email "NOT NULL・内部のみ"
        text contact_name "NOT NULL・内部のみ"
        text location "NOT NULL"
        text region_scope "NOT NULL"
        text website_url
        text logo_url
        text profile_text
        text status "NOT NULL・applied/approved/rejected/suspended"
        timestamptz approved_at "approved なら NOT NULL（CHECK）"
        text invite_code "招待コード"
        text rejected_reason "却下理由・内部のみ"
    }
    crop_groups {
        uuid id PK
        text name UK "NOT NULL"
        integer sort_order "NOT NULL"
    }
    crops {
        uuid id PK
        uuid group_id FK "crop_groups.id・RESTRICT"
        text name UK "NOT NULL"
        text_array aliases "表記ゆれ"
        integer sort_order "NOT NULL"
    }
    profile_crops {
        uuid id PK
        uuid user_id FK "profiles・CASCADE"
        uuid crop_id FK "crops・RESTRICT"
    }

    auth_users ||--o| profiles : "1:1"
    auth_users ||--o| seller_accounts : "共有ログイン"
    profiles ||--o{ profile_crops : "主な作目"
    crops ||--o{ profile_crops : ""
    crop_groups ||--o{ crops : ""
```

補足：`profile_crops` は `(user_id, crop_id)` UNIQUE。

### 1.3 資材と分類（2層所有）

```mermaid
erDiagram
    materials {
        uuid id PK
        text name "NOT NULL・分類層=Farmille"
        text manufacturer_name "NOT NULL・分類層"
        uuid composition_type_id FK "composition_types・RESTRICT・分類層"
        text sales_status "分類層"
        text description "一次情報層=出品者編集可"
        text general_use "一次情報層"
        text main_components "一次情報層・主成分原文"
        text mechanism "一次情報層"
        text usage_text "一次情報層"
        text price_range "一次情報層"
        text official_url "一次情報層"
        text catalog_url "一次情報層"
        uuid seller_id FK "seller_accounts・SET NULL・NULL=未claim"
        integer review_count "集計・トリガー更新"
        numeric avg_rating "集計・1〜5・0件はNULL"
        numeric control_plot_ratio "集計・対照区あり率"
    }
    effect_categories {
        uuid id PK
        text name UK "NOT NULL"
        integer sort_order "NOT NULL"
    }
    effects {
        uuid id PK
        uuid category_id FK "effect_categories・RESTRICT"
        text name "NOT NULL"
        integer sort_order "NOT NULL"
    }
    material_effects {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid effect_id FK "RESTRICT"
    }
    material_crops {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid crop_id FK "crops・RESTRICT"
        text source_name "メーカー資料の記載名・NOT NULL"
        integer sort_order "NOT NULL"
    }
    ingredient_categories {
        uuid id PK
        text name UK "NOT NULL・JBSA材料分類"
        integer sort_order "NOT NULL"
    }
    ingredients {
        uuid id PK
        uuid category_id FK "ingredient_categories・RESTRICT"
        text name "NOT NULL・個別材料"
        integer sort_order "NOT NULL"
    }
    material_ingredient_categories {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid ingredient_category_id FK "RESTRICT"
    }
    material_ingredients {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid ingredient_id FK "RESTRICT"
    }
    composition_types {
        uuid id PK
        text name UK "NOT NULL"
        integer sort_order "NOT NULL"
    }
    product_types {
        uuid id PK
        text name UK "NOT NULL・メーカー分類"
        integer sort_order "NOT NULL"
    }
    material_product_types {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid product_type_id FK "RESTRICT"
    }
    search_tags {
        uuid id PK
        text name "NOT NULL"
        text category "NOT NULL・concern/condition"
        integer sort_order "NOT NULL"
    }
    material_search_tags {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid search_tag_id FK "CASCADE"
    }
    material_images {
        uuid id PK
        uuid material_id FK "CASCADE"
        text url "NOT NULL"
        text image_type "package/logo/usage_scene/other"
        integer sort_order
    }
    material_evidences {
        uuid id PK
        uuid material_id FK "CASCADE"
        text evidence_type "NOT NULL・sds/paper/trial/leaflet"
        text title "NOT NULL"
        text file_url "file か external のどちらか必須（CHECK）"
        text external_url
        jsonb meta
        integer sort_order
    }
    material_sources {
        uuid id PK
        uuid material_id FK "CASCADE"
        text source_url "NOT NULL・出典"
        text source_type
        text note
    }
    material_edit_requests {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid seller_id FK "CASCADE・申請者"
        text request_text "NOT NULL"
        text status "NOT NULL・open/done/declined"
    }
    seller_accounts {
        uuid id PK
    }

    seller_accounts ||--o{ materials : "claim"
    composition_types ||--o{ materials : "組成タイプ"
    effect_categories ||--o{ effects : "効果大分類"
    effects ||--o{ material_effects : ""
    materials ||--o{ material_effects : "個別効果"
    crops ||--o{ material_crops : "Farmille正規化"
    materials ||--o{ material_crops : "対象作物"
    ingredient_categories ||--o{ ingredients : "所属"
    ingredient_categories ||--o{ material_ingredient_categories : ""
    materials ||--o{ material_ingredient_categories : "JBSA材料分類"
    ingredients ||--o{ material_ingredients : ""
    materials ||--o{ material_ingredients : "個別材料"
    product_types ||--o{ material_product_types : ""
    materials ||--o{ material_product_types : "製品タイプ"
    search_tags ||--o{ material_search_tags : ""
    materials ||--o{ material_search_tags : "発見語"
    materials ||--o{ material_images : ""
    materials ||--o{ material_evidences : ""
    materials ||--o{ material_sources : ""
    materials ||--o{ material_edit_requests : ""
    seller_accounts ||--o{ material_edit_requests : ""
```

補足：`materials` は `(name, manufacturer_name)` UNIQUE。同一分類内の検索条件は OR、分類間は AND。効果大分類と作物群は表示用に導出し、資材との直接関連を重複保存しない。分類層＋集計＋`seller_id` はトリガー `enforce_material_column_scope` で保護され、出品者は一次情報層のみ更新できる（admin と service_role は素通り）。

### 1.4 投稿とリアクション

```mermaid
erDiagram
    reviews {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid author_user_id FK "profiles・CASCADE"
        smallint rating "NOT NULL・1〜5"
        text body "NOT NULL"
        boolean has_control_plot "対照区の有無・任意"
        text purchase_channel "ja/home_center/ec/direct/other・内部"
        boolean pesticide_ack "NOT NULL・true必須（CHECK）"
        boolean is_provided_sample "NOT NULL・default false"
        text status "NOT NULL・published/hidden"
    }
    review_crops {
        uuid id PK
        uuid review_id FK "reviews・CASCADE"
        uuid crop_id FK "crops・RESTRICT"
        integer sort_order "NOT NULL"
    }
    review_photos {
        uuid id PK
        uuid review_id FK "CASCADE"
        text url "NOT NULL"
        text caption
        integer sort_order
    }
    usage_reports {
        uuid id PK
        uuid material_id FK "CASCADE"
        uuid author_user_id FK "profiles・CASCADE"
        text title "編集局が整える"
        text status "NOT NULL・draft/pending/published/declined"
        uuid crop_id FK "crops・RESTRICT"
        text_array purpose_tags "使用目的"
        text purpose_note
        smallint prefecture_code "1〜47"
        text field_name
        text variety
        date planting_date
        text cultivation_type
        text_array cultivation_tags
        text growth_stage
        text climate_note
        text observed_change "NOT NULL"
        text negative_note
        text summary "NOT NULL"
        boolean pesticide_ack "NOT NULL・true必須"
        boolean is_provided_sample "NOT NULL"
        text editor_note "編集局メモ・内部"
        timestamptz published_at "published なら NOT NULL（CHECK）"
    }
    usage_report_applications {
        uuid id PK
        uuid usage_report_id FK "CASCADE"
        date applied_on "処理日"
        text method "使用方法"
        text detail
        integer sort_order
    }
    usage_report_media {
        uuid id PK
        uuid usage_report_id FK "CASCADE"
        text media_type "NOT NULL・photo/video"
        text url "NOT NULL"
        text caption
        text placement "表示先"
        integer sort_order
    }
    usage_report_metrics {
        uuid id PK
        uuid usage_report_id FK "CASCADE"
        text metric_name "NOT NULL・収穫調査の指標"
        numeric treated_value "処理区"
        numeric untreated_value "対照区"
        text unit
        integer sort_order
    }
    saved_materials {
        uuid id PK
        uuid user_id FK "profiles・CASCADE"
        uuid material_id FK "CASCADE"
    }
    helpful_votes {
        uuid id PK
        uuid user_id FK "profiles・CASCADE"
        text target_type "NOT NULL・review/usage_report/article/answer"
        uuid target_id "NOT NULL・FKなし"
    }
    view_events {
        uuid id PK
        text target_type "NOT NULL・material/review/usage_report/article"
        uuid target_id "NOT NULL・FKなし"
        uuid viewer_user_id FK "SET NULL・NULL=匿名"
    }
    content_reports {
        uuid id PK
        uuid reporter_user_id FK "profiles・CASCADE"
        text target_type "NOT NULL・review/usage_report/article/profile/material"
        uuid target_id "NOT NULL・FKなし"
        text reason "NOT NULL"
        text status "NOT NULL・open/resolved/dismissed"
        uuid resolved_by FK "auth.users・SET NULL・監査用"
        timestamptz resolved_at "open ⇔ NULL（CHECK）"
    }

    reviews ||--|{ review_crops : "1件以上"
    crops ||--o{ review_crops : ""
    reviews ||--o{ review_photos : ""
    usage_reports ||--o{ usage_report_applications : ""
    usage_reports ||--o{ usage_report_media : ""
    usage_reports ||--o{ usage_report_metrics : ""
    helpful_votes }o..o{ reviews : "対象"
    helpful_votes }o..o{ usage_reports : "対象"
    content_reports }o..o{ reviews : "対象"
    content_reports }o..o{ usage_reports : "対象"
    view_events }o..o{ reviews : "対象"
    view_events }o..o{ usage_reports : "対象"
```

補足：`review_crops` は `(review_id, crop_id)` UNIQUEで、遅延制約トリガーがレビューごとの0件を拒否する。`saved_materials` は `(user_id, material_id)` UNIQUE、`helpful_votes` は `(user_id, target_type, target_id)` UNIQUE。`view_events` は追記専用（UPDATE/DELETE 権限を剥奪）。`reviews` の INSERT/UPDATE/DELETE で集計トリガーが `materials.review_count / avg_rating / control_plot_ratio` を再計算する。

### 1.5 記事・Q&A（Phase 2 先行スキーマ）

```mermaid
erDiagram
    articles {
        uuid id PK
        uuid seller_id FK "seller_accounts・CASCADE・著者組織"
        text title "NOT NULL"
        text body "NOT NULL・Markdown"
        text hero_image_url
        text status "NOT NULL・draft/published"
        timestamptz published_at "published なら NOT NULL"
    }
    article_materials {
        uuid id PK
        uuid article_id FK "CASCADE"
        uuid material_id FK "CASCADE・他社資材も可"
    }
    questions {
        uuid id PK "Phase2・書き込みdeny"
        uuid material_id FK "CASCADE"
        uuid author_user_id FK "profiles・CASCADE"
        text body "NOT NULL"
    }
    answers {
        uuid id PK "Phase2・書き込みdeny"
        uuid question_id FK "CASCADE"
        uuid author_user_id FK "一般の回答・nullable"
        uuid author_seller_id FK "公式回答・nullable"
        text body "NOT NULL・著者はどちらか一方（CHECK）"
    }

    articles ||--o{ article_materials : ""
    questions ||--o{ answers : ""
```

### 1.6 ビューと Storage（図外の公開面）

| ビュー | 権限 | 内容 |
|---|---|---|
| `public_profiles` | definer・SELECT のみ | profiles の公開列のみ（standpoint・非公開 prefecture を遮断） |
| `public_sellers` | invoker＋列 GRANT | approved の seller のみ・contact_*／invite_code／rejected_reason を遮断 |
| `helpful_counts` | definer・SELECT のみ | helpful_votes の件数集計（個票は本人のみ） |
| `view_counts_daily` | definer・SELECT のみ | view_events の JST 日次集計（生ログは admin のみ） |

| Storage バケット | 上限 | 書き込み主体（パス先頭＝所有者） |
|---|---|---|
| avatars | 2MB | 一般本人 `{user_id}/…` |
| review-photos | 5MB | 一般本人 |
| report-media | 50MB（動画可） | 一般本人 |
| material-images | 5MB | 出品者 `{seller_id}/…`・admin |
| article-images | 5MB | 出品者・admin |

---

## 2. シーケンス図

アクター表記：**ブラウザ**／**server**（Server Action＋src/server 層）／**Auth**（Supabase Auth）／**DB**（Postgres・RLS）／**Storage**。

### 2.1 一般ユーザー登録（補償処理付き）

```mermaid
sequenceDiagram
    autonumber
    participant B as ブラウザ
    participant S as server
    participant A as Auth
    participant D as DB

    Note over B: /signup で一般ユーザーを選び /signup/general へ遷移
    B->>S: signupAction（handle・email・password・都道府県・立場）
    S->>D: profiles を handle で検索（重複検査）
    alt handle 重複
        S-->>B: handle_taken（フィールドエラー）
    end
    S->>A: signUp（email・password）
    Note over A: identities が空 = 既存メール → email_unavailable
    S->>A: admin.updateUserById（app_metadata.account_type='general'）
    S->>D: profiles INSERT（handle・prefecture・standpoint）
    alt 途中で失敗
        S->>A: admin.deleteUser（auth ユーザーを補償削除）
        S-->>B: エラー（中途半端な状態を残さない）
    end
    S->>A: refreshSession（JWT に account_type を反映）
    S-->>B: redirect /signup/done（メール確認要なら ?confirm=1）
```

### 2.2 出品者ログイン（共有 ID・合成メール方式）

```mermaid
sequenceDiagram
    autonumber
    participant B as ブラウザ
    participant S as server
    participant A as Auth
    participant D as DB

    B->>S: sellerLoginAction（login_id・password）
    S->>S: 形式検証 → 合成メール {login_id}@sellers.farmille.internal
    S->>D: seller_accounts を login_id で検索
    alt status ≠ approved または auth_user_id なし
        S-->>B: seller_invalid_credentials（原因は判別させない）
    end
    S->>A: signInWithPassword（合成メール・password）
    Note over S: 返った user.id と auth_user_id の一致を検証（不一致は signOut）
    S-->>B: redirect /dashboard（または safeNext）
```

### 2.3 出品者申請 → admin 承認

```mermaid
sequenceDiagram
    autonumber
    participant B as ブラウザ（申請者）
    participant S as server
    participant D as DB
    participant AD as ブラウザ（admin）
    participant A as Auth

    B->>S: sellerApplyAction（8項目・招待コード任意）
    S->>D: login_id 重複検査・招待コード照合
    S->>D: seller_accounts INSERT（status='applied'・anon RLS 経路）
    S-->>B: redirect /sellers/apply/done
    AD->>S: sellerOperationAction（approve）
    Note over S: withAdmin = requireAdmin（AAL2）通過後のみ service_role
    S->>D: applied かつ auth_user_id なし を確認（二重承認防止）
    S->>A: admin.createUser（合成メール・初期PW乱数・app_metadata: seller, seller_id）
    S->>D: status='approved'・approved_at・auth_user_id を更新
    alt 更新失敗
        S->>A: admin.deleteUser（作成済み Auth を補償削除）
    end
    S-->>AD: login_id と初期パスワードを一度だけ表示
```

### 2.4 admin の AAL2（TOTP enroll → verify）

```mermaid
sequenceDiagram
    autonumber
    participant B as ブラウザ（admin）
    participant S as server
    participant A as Auth

    B->>S: /admin 配下へアクセス
    S->>A: getClaims（JWT 検証）
    alt account_type ≠ admin
        S-->>B: 404（存在を明かさない）
    else aal ≠ aal2
        S-->>B: redirect /admin/mfa?next=…
    end
    B->>S: startTotpEnrollmentAction
    S->>A: mfa.enroll（totp）
    A-->>B: QR コードとシークレット
    B->>S: verifyTotpCodeAction（6桁コード）
    S->>A: mfa.challengeAndVerify
    A-->>B: AAL2 セッション発行（JWT aal='aal2'）
    S-->>B: redirect 元の遷移先（/admin など）
```

### 2.5 レビュー投稿（Storage 直アップロード＋集計トリガー）

```mermaid
sequenceDiagram
    autonumber
    participant B as ブラウザ
    participant ST as Storage
    participant S as server
    participant D as DB

    B->>ST: 写真を review-photos/{user_id}/ へ直接アップロード
    B->>S: createReviewAction（星・本文・複数作目・同意・写真パス）
    S->>S: requireGeneralUser・入力検証（農薬同意 false は拒否）
    S->>D: materials/crops の存在確認・同資材への重複投稿検査
    alt 既に自分のレビューあり
        S->>ST: 直前アップロード写真を削除
        S-->>B: redirect 編集画面（?existing=1）
    end
    S->>D: RPCでreviews＋review_cropsを原子的にINSERT（status='published'）
    S->>D: review_photos INSERT（失敗時は reviews を削除してロールバック）
    Note over D: トリガーが materials の review_count / avg_rating / 対照区あり率を再計算
    S-->>B: redirect 資材詳細 #reviews-heading（投稿完了トースト）
```

### 2.6 使用レポートのライフサイクル（編集局ワークフロー）

```mermaid
sequenceDiagram
    autonumber
    participant B as ブラウザ（一般）
    participant ST as Storage
    participant S as server
    participant D as DB
    participant AD as ブラウザ（admin 編集局）

    B->>ST: 写真・動画を report-media/{user_id}/ へ直接アップロード
    B->>S: 下書き保存（draft）
    S->>D: usage_reports を作物ごとに upsert（status='draft'）＋子テーブル入れ替え
    B->>S: 提出（submit・必須項目検証）
    S->>D: status: draft → pending（本人はこれ以降編集不可）
    Note over D: pending は公開側で 404・本人マイページに「調整中」表示
    AD->>S: updateUsageReportEditorialAction（save / publish / decline）
    alt 公開
        S->>D: status='published'・published_at 設定（.eq pending 条件）
    else 差し戻し
        S->>D: status='declined'・editor_note 必須
    end
    S-->>AD: 一覧・公開側・投稿者マイページを revalidate
```

---

## 3. 画面遷移図

凡例：実線＝リンク／リダイレクト。`login?next=` への誘導は「🔒」で略記（未ログイン時）。BottomNav（ホーム・探す・＋投稿・記事・マイページ）は公開＋一般側の全画面に共通なので個別エッジは省略。

認証とアカウント作成の分岐は、実画面スクリーンショットを使った [07-account-screen-flow.md](07-account-screen-flow.md) も併せて参照する。

### 3.1 公開＋一般ユーザー

```mermaid
flowchart TD
    subgraph pub["公開（非ログイン閲覧可）"]
        HOME["ホーム /"]
        SEARCH["資材検索 /search"]
        MAT["資材詳細 /materials/[id]"]
        MATREV["レビュー全件 …/reviews"]
        MATART["資材の記事 …/articles"]
        REP["使用レポート /reports/[id]"]
        ARTS["記事一覧 /articles"]
        ARTD["記事詳細 /articles/[id]"]
        SELLER["出品者ページ /sellers/[id]"]
        PROF["公開プロフィール /users/[id]"]
    end
    subgraph auth["認証"]
        LOGIN["ログイン /login"]
        SIGNUP["登録方法選択 /signup"]
        GSIGNUP["一般登録 /signup/general"]
        APPLY["メーカー・出品者申請 /sellers/apply"]
        RESET["再設定 /password-reset"]
        SLOGIN["出品者ログイン /sellers/login"]
    end
    subgraph me["一般ユーザー（🔒）"]
        POST["投稿する /post"]
        RNEW["レビュー投稿 …/review/new"]
        REDIT["レビュー編集 …/review/[id]/edit"]
        UNEW["使用レポート投稿 …/report/new"]
        ME["マイページ /me"]
        MEEDIT["プロフィール編集 /me/edit"]
        SAVED["検討リスト /me/saved"]
        COMP["資材比較 …/compare"]
    end

    HOME --> SEARCH & ARTS & MAT & REP & SIGNUP
    SEARCH --> MAT
    MAT --> SELLER & MATREV & MATART & REP
    MAT -->|"FAB（一般のみ表示）"| RNEW & UNEW
    MAT -->|"保存トグル 🔒"| LOGIN
    MATART --> ARTD & REP
    ARTS --> REP & ARTD
    ARTD --> SELLER & MAT
    REP --> PROF & MAT
    PROF --> MAT & REP
    SELLER --> MAT & ARTD
    SELLER -->|"資材をもっと見る"| SEARCH

    LOGIN --> SIGNUP & RESET & SLOGIN
    LOGIN -->|"成功 → next または /"| HOME
    SIGNUP -->|"個人用"| GSIGNUP
    SIGNUP -->|"組織用・審査あり"| APPLY
    GSIGNUP -->|"完了"| HOME
    POST --> RNEW & UNEW
    RNEW -->|"完了 → レビュー欄アンカー"| MAT
    RNEW -->|"投稿済みなら"| REDIT
    UNEW -->|"提出 → 編集部確認の案内"| MAT
    ME --> MEEDIT & SAVED & PROF & POST
    ME -->|"メーカー・出品者アカウントを申請"| APPLY
    ME -->|"ログアウト POST /logout"| HOME
    SAVED --> COMP & MAT
```

### 3.2 出品者

```mermaid
flowchart TD
    SIGNUP["登録方法選択 /signup"]
    APPLY["出品者申請 /sellers/apply（公開）"]
    DONE["受付完了 /sellers/apply/done"]
    SLOGIN["出品者ログイン /sellers/login"]
    DASH["ダッシュボード /dashboard 🔒seller"]
    DMAT["一次情報編集 /dashboard/materials/[id]"]
    DARTS["記事管理 /dashboard/articles"]
    DANEW["記事作成 …/new"]
    DAEDIT["記事編集 …/[id]/edit"]
    PUBMAT["公開側 資材詳細"]
    PUBART["公開側 記事詳細"]

    SIGNUP -->|"組織用・審査あり"| APPLY
    APPLY -->|"申請 INSERT（status=applied）"| DONE
    Note1["承認は admin 側（図 2.3）。発行された ID/PW でログイン"]
    DONE -.-> Note1
    SLOGIN -->|"成功"| DASH
    DASH --> DMAT & DARTS
    DMAT -->|"公開ページを確認"| PUBMAT
    DARTS --> DANEW & DAEDIT
    DANEW -->|"公開して保存"| PUBART
    DAEDIT -->|"公開ページを確認"| PUBART
```

### 3.3 運営管理（admin・AAL2 必須）

```mermaid
flowchart TD
    LOGIN["ログイン /login"]
    MFA["2要素認証 /admin/mfa"]
    ADMIN["運営管理ホーム /admin"]
    ASEL["出品者審査 /admin/sellers → [id]"]
    AMAT["資材管理 /admin/materials → new / [id]"]
    AREQ["分類変更申請 …/requests"]
    AREP["通報処理 /admin/reports"]
    AUR["編集局 /admin/usage-reports → [id]"]
    ATAG["検索タグ・作物 /admin/tags"]

    LOGIN -->|"admin・AAL1"| MFA
    MFA -->|"TOTP 検証 → AAL2"| ADMIN
    ADMIN --> ASEL & AMAT & ATAG
    ADMIN -->|"件数カード"| AREP & AUR
    AMAT --> AREQ
    ASEL -->|"公開ページ確認"| PSELLER["公開側 出品者ページ"]
    AMAT -->|"公開ページ確認"| PMAT["公開側 資材詳細"]
    AUR -->|"公開ページ確認"| PREP["公開側 使用レポート"]
    AREP -->|"通報者"| PUSER["公開側 プロフィール"]
```

### 3.4 アクセス制御の要点（図の前提）

| 領域 | 一次防御 | 挙動 |
|---|---|---|
| `/signup` `/signup/general` | proxy | ログイン済み→`/`。一般登録と組織用申請を入力前に分岐 |
| `/me` `/post` | proxy＋ページ内 | 未ログイン→`/login?next=`。出品者・admin が開くと、URLを維持して各管理画面への案内を表示 |
| `/dashboard` | proxy＋`requireSeller` | 未ログイン→`/sellers/login?next=`。非出品者は画面内で拒否表示 |
| `/admin` | `requireAdminPage` | 未ログイン→`/login`。AAL1 の admin→`/admin/mfa`。admin 以外→**404**（存在を明かさない） |
| 通報・削除確認 | — | ページ遷移ではなくモーダル（`<dialog>`）。通報はレビュー・レポート・記事・プロフィールの4箇所 |
