# 06 図解 — ER 図・シーケンス図・画面遷移図

生成元：`supabase/migrations/` 全21本と `src/` の実装（2026-09-04・ブランチ rebuild/m0）。設計の正は [01-domain-model.md](01-domain-model.md)、[02-screens.md](02-screens.md)、[08-material-governance-ooui.md](08-material-governance-ooui.md) とし、本書は実装全体を横断する図解として同期する。スキーマ・ルーティング・主要フローを変更する際は本書の該当図も更新する。

GitHub 上でそのまま Mermaid がレンダリングされる。閲覧用のスタンドアロン版（同一ソースから生成）：https://claude.ai/code/artifact/cbd39abf-0d38-4b1e-92c5-38d943f1765f

- [1. ER 図](#1-er-図)
- [2. シーケンス図](#2-シーケンス図)
- [3. 画面遷移図](#3-画面遷移図)

---

## 1. ER 図

45 テーブル。読みやすさのため「全体俯瞰」＋ドメイン別 4 枚に分割する。`created_at`／`updated_at` は各図では省略する。点線はポリモーフィック参照（FK 制約なし・`target_type`＋`target_id`）を示す。

### 1.1 全体俯瞰

```mermaid
erDiagram
    auth_users ||--o| profiles : "一般ユーザー 1:1"
    auth_users ||--o| seller_accounts : "共有ログイン 1:0..1"

    crop_groups ||--o{ crops : ""

    seller_accounts ||--o{ materials : "claim（NULL=未claim）"
    seller_accounts ||--o{ articles : "著者"
    seller_accounts ||--o{ material_change_requests : "申請"

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
    materials ||--o{ material_change_requests : "対象"
    material_change_requests ||--o| material_change_request_details : "提案内容"
    material_change_requests ||--o{ material_change_request_evidences : "提案エビデンス"
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
    reviews ||--|| review_crops : "作目（1件）"
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
        text avatar_url
        text standpoint "内部専用・farmer/ja/expert/other"
    }
    seller_accounts {
        uuid id PK
        uuid auth_user_id FK, UK "auth.users.id・SET NULL・承認時に発行"
        text official_name "NOT NULL"
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
    auth_users ||--o| profiles : "1:1"
    auth_users ||--o| seller_accounts : "共有ログイン"
```

補足：一般ユーザーの `profiles` は投稿者識別用のハンドルとアバターに加え、内部専用の立場を4択で保持する。立場は公開ビューや投稿に出さず、地域・栽培情報・所属などの属性は持たない。

### 1.3 資材と分類（2層所有）

```mermaid
erDiagram
    materials {
        uuid id PK
        text name "NOT NULL・分類層=Farmille"
        text manufacturer_name "NOT NULL・分類層"
        uuid composition_type_id FK "composition_types・RESTRICT・分類層"
        text sales_status "分類層"
        text description "承認済み正本・紹介文"
        text general_use "承認済み正本・一般用途"
        text main_components "承認済み正本・主成分原文"
        text mechanism "承認済み正本・作用機序"
        text usage_text "承認済み正本・使い方"
        text price_range "承認済み正本"
        text official_url "承認済み正本"
        text catalog_url "承認済み正本"
        uuid seller_id FK "seller_accounts・SET NULL・NULL=未claim"
        text publication_status "published/archived"
        timestamptz archived_at "掲載終了日時"
        integer content_revision "承認済み正本の版"
        timestamptz manufacturer_verified_at "メーカー確認日時"
        uuid manufacturer_verified_by_seller_id FK "確認したメーカー"
        text manufacturer_verification_method "確認経路"
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
    material_change_requests {
        uuid id PK
        uuid seller_id FK "CASCADE・申請者"
        uuid material_id FK "RESTRICT・追加申請はNULL"
        uuid result_material_id FK "RESTRICT・承認後の資材"
        text change_type "create/update/archive"
        text status "pending/approved/rejected/cancelled"
        integer base_content_revision "競合検査用"
        text reason "申請理由"
        timestamptz manufacturer_confirmed_at "メーカー関与日時"
        uuid reviewed_by FK "auth.users・審査者"
        timestamptz reviewed_at
        text review_note
    }
    material_change_request_details {
        uuid request_id PK, FK "CASCADE"
        text name "提案スナップショット"
        text manufacturer_name
        uuid composition_type_id FK
        text sales_status
        text description
        text general_use
        text main_components
        text mechanism
        text usage_text
        text price_range
        text official_url
        text catalog_url
    }
    material_change_request_evidences {
        uuid id PK
        uuid request_id FK "CASCADE"
        uuid source_evidence_id FK "現行行との対応"
        text evidence_type
        text title
        text file_url
        text external_url
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
    materials ||--o{ material_change_requests : "対象"
    seller_accounts ||--o{ material_change_requests : "提出"
    material_change_requests ||--o| material_change_request_details : "提案正本"
    material_change_requests ||--o{ material_change_request_evidences : "提案エビデンス"
```

補足：`materials` は運営承認済みの正本で、`(name, manufacturer_name)` UNIQUE。メーカーは正本を直接更新せず、追加・変更・掲載終了を `material_change_requests` へ提出する。運営が承認したときだけ、提案スナップショットと分類・エビデンスの子テーブルを正本へ原子的に反映する。運営は申請を介さず任意メーカーの資材を直接登録できる。claim は操作権、`manufacturer_verified_at` はメーカー関与の事実であり、別の状態として扱う。提案分類の6関連テーブルは [01-domain-model.md](01-domain-model.md) §3 と [08-material-governance-ooui.md](08-material-governance-ooui.md) §4 を参照する。

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

    reviews ||--|| review_crops : "1件"
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

補足：`review_crops.review_id` は UNIQUEで、1レビューにつき作目を1件だけ保持する。遅延制約トリガーが0件も拒否する。`saved_materials` は `(user_id, material_id)` UNIQUE、`helpful_votes` は `(user_id, target_type, target_id)` UNIQUE。`view_events` は追記専用（UPDATE／DELETE 権限を剥奪）。`reviews` の INSERT／UPDATE／DELETE で集計トリガーが `materials.review_count`、`avg_rating`、`control_plot_ratio` を再計算する。

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
| `public_profiles` | definer・SELECT のみ | profiles のハンドル・アバター・登録日時だけを返す |
| `public_sellers` | invoker＋列 GRANT | approved のメーカーのみ・contact_*／invite_code／rejected_reason を遮断 |
| `helpful_counts` | definer・SELECT のみ | helpful_votes の件数集計（個票は本人のみ） |
| `view_counts_daily` | definer・SELECT のみ | view_events の JST 日次集計（生ログは admin のみ） |

| Storage バケット | 上限 | 書き込み主体（パス先頭＝所有者） |
|---|---|---|
| avatars | 2MB | 一般本人 `{user_id}/…` |
| review-photos | 5MB | 一般本人 |
| report-media | 50MB（動画可） | 一般本人 |
| material-images | 5MB | メーカー `{seller_id}/…`・admin |
| article-images | 5MB | メーカー・admin |

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
    B->>S: signupAction（handle・email・password・standpoint）
    S->>D: profiles を handle で検索（重複検査）
    alt handle 重複
        S-->>B: handle_taken（フィールドエラー）
    end
    S->>A: signUp（email・password）
    Note over A: identities が空 = 既存メール → email_unavailable
    S->>A: admin.updateUserById（app_metadata.account_type='general'）
    S->>D: profiles INSERT（handle・standpoint）
    alt 途中で失敗
        S->>A: admin.deleteUser（auth ユーザーを補償削除）
        S-->>B: エラー（中途半端な状態を残さない）
    end
    S->>A: refreshSession（JWT に account_type を反映）
    S-->>B: redirect /signup/done（メール確認要なら ?confirm=1）
```

### 2.2 メーカーログイン（共有 ID・合成メール方式）

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

### 2.3 メーカー申請 → admin 承認

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
    B->>S: createReviewAction（星・本文・単一作目・同意・写真パス）
    S->>S: requireGeneralUser・入力検証（農薬同意 false は拒否）
    S->>D: materials/crops の存在確認・同資材への重複投稿検査
    alt 既に自分のレビューあり
        S->>ST: 直前アップロード写真を削除
        S-->>B: redirect 編集画面（?existing=1）
    end
    S->>D: RPCでreviews＋review_crops 1行を原子的にINSERT（status='published'）
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

### 2.7 資材の共同管理（メーカー申請＋運営承認）

```mermaid
sequenceDiagram
    autonumber
    participant M as メーカー
    participant S as Server Action
    participant D as DB
    participant A as 運営（AAL2）
    participant P as 公開画面

    alt 運営が先に資材を登録
        A->>S: 任意メーカー名で資材を登録
        S->>D: materialsへ正本を直接INSERT
        Note over D: claim前・メーカー未確認でも公開可能
    end
    alt 初期データが正しい
        M->>S: この情報を確認済みにする
        S->>D: manufacturer_verified_atを即時記録
        D-->>P: メーカー確認済みマークを表示
    else 追加・変更・掲載終了を依頼
        M->>S: 資材変更申請を提出
        S->>D: material_change_requestsと提案子テーブルを原子的に保存
        Note over P: pending中は承認済み正本を維持
        A->>S: 現行正本と提案内容を比較して承認または却下
        alt 承認
            S->>D: content_revisionを照合し、正本へ原子的に反映
            D-->>P: 公開内容を更新
        else 却下
            S->>D: rejectedと理由を記録
            D-->>M: 申請詳細で理由を表示
        end
    end
```

---

## 3. 主要導線の画面遷移図

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
        SELLER["メーカーページ /sellers/[id]"]
        PROF["一般ユーザーページ /users/[id]"]
    end
    subgraph auth["認証"]
        LOGIN["ログイン /login"]
        SIGNUP["登録方法選択 /signup"]
        GSIGNUP["一般登録 /signup/general"]
        SELLERLP["メーカー向けLP /sellers"]
        APPLY["メーカー申請 /sellers/apply"]
        RESET["再設定 /password-reset"]
        SLOGIN["メーカーログイン /sellers/login"]
    end
    subgraph me["一般ユーザー（🔒）"]
        POST["投稿する /post"]
        RNEW["レビュー投稿 …/review/new"]
        REDIT["レビュー編集 …/review/[id]/edit"]
        UNEW["使用レポート投稿 …/report/new"]
        ME["マイページ /me"]
        MEEDIT["表示情報編集 /me/edit"]
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
    SIGNUP -->|"メーカー・審査あり"| SELLERLP
    SELLERLP --> APPLY & SLOGIN
    GSIGNUP -->|"完了"| HOME
    POST --> RNEW & UNEW
    RNEW -->|"完了 → レビュー欄アンカー"| MAT
    RNEW -->|"投稿済みなら"| REDIT
    UNEW -->|"提出 → 編集部確認の案内"| MAT
    ME --> MEEDIT & SAVED & PROF & POST
    ME -->|"メーカーアカウントを申請"| SELLERLP
    ME -->|"ログアウト POST /logout"| HOME
    SAVED --> COMP & MAT
```

### 3.2 メーカー

```mermaid
flowchart TD
    SIGNUP["登録方法選択 /signup"]
    SELLERLP["メーカー向けLP /sellers"]
    APPLY["メーカー申請 /sellers/apply（公開）"]
    DONE["受付完了 /sellers/apply/done"]
    SLOGIN["メーカーログイン /sellers/login"]
    DASH["ダッシュボード /dashboard 🔒seller"]
    DMATS["自社資材 /dashboard/materials"]
    DMNEW["資材追加申請 …/new"]
    DMAT["自社資材詳細 …/[id]"]
    DMREQ["資材変更申請 …/requests/[id]"]
    DARTS["記事管理 /dashboard/articles"]
    DANEW["記事作成 …/new"]
    DAEDIT["記事編集 …/[id]/edit"]
    PUBMAT["公開側 資材詳細"]
    PUBART["公開側 記事詳細"]

    SIGNUP -->|"メーカー・審査あり"| SELLERLP
    SELLERLP --> APPLY & SLOGIN
    APPLY -->|"申請 INSERT（status=applied）"| DONE
    Note1["承認は admin 側（図 2.3）。発行された ID/PW でログイン"]
    DONE -.-> Note1
    SLOGIN -->|"成功"| DASH
    DASH --> DMATS & DARTS
    DMATS --> DMNEW & DMAT & DMREQ
    DMNEW -->|"追加申請"| DMREQ
    DMAT -->|"変更・掲載終了申請"| DMREQ
    DMAT -->|"公開ページを確認"| PUBMAT
    DMREQ -->|"承認後の公開資材"| PUBMAT
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
    ASEL["メーカー審査 /admin/sellers → [id]"]
    AMAT["資材管理 /admin/materials → new / [id]"]
    AREQ["資材変更申請 /admin/materials/requests → [id]"]
    AREP["通報処理 /admin/reports"]
    AUR["編集局 /admin/usage-reports → [id]"]
    ATAG["検索タグ・作物 /admin/tags"]

    LOGIN -->|"admin・AAL1"| MFA
    MFA -->|"TOTP 検証 → AAL2"| ADMIN
    ADMIN --> ASEL & AMAT & ATAG
    ADMIN -->|"件数カード"| AREP & AUR
    AMAT --> AREQ
    ASEL -->|"公開ページ確認"| PSELLER["公開側 メーカーページ"]
    AMAT -->|"公開ページ確認"| PMAT["公開側 資材詳細"]
    AUR -->|"公開ページ確認"| PREP["公開側 使用レポート"]
    AREP -->|"通報者"| PUSER["公開側 プロフィール"]
```

### 3.4 アクセス制御の要点（図の前提）

| 領域 | 一次防御 | 挙動 |
|---|---|---|
| `/signup` `/signup/general` | proxy | ログイン済み→`/`。一般登録とメーカー向けLPを入力前に分岐 |
| `/sellers` | 公開 | メーカー向けの対象条件・機能・承認フローを示し、申請またはログインへ分岐 |
| `/me` `/post` | proxy＋ページ内 | 未ログイン→`/login?next=`。メーカー・admin が開くと、URLを維持して各管理画面への案内を表示 |
| `/dashboard` | proxy＋`requireSeller` | 未ログイン→`/sellers/login?next=`。メーカー以外は画面内で拒否表示 |
| `/admin` | `requireAdminPage` | 未ログイン→`/login`。AAL1 の admin→`/admin/mfa`。admin 以外→**404**（存在を明かさない） |
| 通報・削除確認 | — | ページ遷移ではなくモーダル（`<dialog>`）。通報はレビュー・レポート・記事・プロフィールの4箇所 |

## 4. 全画面を含む実装ルート図

§3は主要タスクの読みやすさを優先した図である。本節は `src/app/**/page.tsx` を機械的に照合し、開発専用画面を含む全51画面をノードとして示す。矢印は画面内リンク、フォーム完了後のリダイレクト、または権限境界からの誘導を表す。共通ヘッダーと下部ナビから繰り返し到達する矢印は省略する。

### 4.1 公開・認証・一般ユーザー

```mermaid
flowchart LR
    HOME["ホーム<br/>/"]
    SEARCH["資材検索<br/>/search"]
    MATERIAL["資材詳細<br/>/materials/[id]"]
    REVIEWS["レビュー一覧<br/>/materials/[id]/reviews"]
    MATART["関連記事<br/>/materials/[id]/articles"]
    REPORT["使用レポート<br/>/reports/[id]"]
    ARTICLES["記事一覧<br/>/articles"]
    ARTICLE["記事詳細<br/>/articles/[id]"]
    SELLER["メーカー公開ページ<br/>/sellers/[id]"]
    USER["一般ユーザーページ<br/>/users/[id]"]

    SIGNUP["登録方法選択<br/>/signup"]
    GENERAL_SIGNUP["一般登録<br/>/signup/general"]
    SIGNUP_DONE["一般登録完了<br/>/signup/done"]
    LOGIN["一般・運営ログイン<br/>/login"]
    RESET["パスワード再設定<br/>/password-reset"]
    RESET_UPDATE["新パスワード設定<br/>/password-reset/update"]
    SELLER_LP["メーカー向けLP<br/>/sellers"]
    SELLER_APPLY["メーカー申請<br/>/sellers/apply"]
    SELLER_APPLY_DONE["申請受付完了<br/>/sellers/apply/done"]
    SELLER_LOGIN["メーカーログイン<br/>/sellers/login"]

    POST["投稿先選択<br/>/post"]
    REVIEW_NEW["レビュー投稿<br/>/materials/[id]/review/new"]
    REVIEW_EDIT["レビュー編集<br/>/materials/[id]/review/[reviewId]/edit"]
    REPORT_NEW["使用レポート投稿<br/>/materials/[id]/report/new"]
    ME["マイページ<br/>/me"]
    ME_EDIT["表示情報編集<br/>/me/edit"]
    SAVED["検討リスト<br/>/me/saved"]
    COMPARE["資材比較<br/>/me/saved/compare"]
    DEV_TOKENS["トークン確認<br/>/dev/tokens"]
    DEV_UI["UIカタログ<br/>/dev/ui"]

    HOME --> SEARCH & MATERIAL & REPORT & ARTICLES & SIGNUP
    SEARCH --> MATERIAL
    MATERIAL --> REVIEWS & MATART & REPORT & SELLER
    MATERIAL -->|"要一般ログイン"| REVIEW_NEW & REPORT_NEW
    REVIEWS --> REVIEW_EDIT
    MATART --> ARTICLE & REPORT
    ARTICLES --> ARTICLE & REPORT
    ARTICLE --> SELLER & MATERIAL
    REPORT --> USER & MATERIAL
    SELLER --> MATERIAL & ARTICLE
    USER --> MATERIAL & REPORT

    SIGNUP -->|"個人"| GENERAL_SIGNUP
    GENERAL_SIGNUP --> SIGNUP_DONE
    SIGNUP_DONE --> HOME
    SIGNUP -->|"メーカー"| SELLER_LP
    SELLER_LP --> SELLER_APPLY & SELLER_LOGIN
    SELLER_APPLY --> SELLER_APPLY_DONE
    SELLER_APPLY_DONE --> SELLER_LOGIN
    LOGIN --> RESET
    RESET -->|"メールリンク"| RESET_UPDATE
    RESET_UPDATE --> LOGIN
    LOGIN -->|"一般"| ME
    LOGIN -->|"メーカーはこちら"| SELLER_LOGIN
    HOME --> POST & ME
    POST --> REVIEW_NEW & REPORT_NEW
    REVIEW_NEW --> MATERIAL
    REVIEW_NEW -->|"投稿済み"| REVIEW_EDIT
    REVIEW_EDIT --> MATERIAL
    REPORT_NEW --> ME
    ME --> ME_EDIT & SAVED & USER & POST & SELLER_LP
    SAVED --> COMPARE & MATERIAL
    COMPARE --> MATERIAL
    DEV_TOKENS -. "開発時のみ" .-> DEV_UI
```

### 4.2 メーカー・運営

```mermaid
flowchart LR
    SELLER_LP["メーカー向けLP<br/>/sellers"]
    SELLER_LOGIN["メーカーログイン<br/>/sellers/login"]
    DASHBOARD["メーカーホーム<br/>/dashboard"]
    SELLER_MATERIALS["自社資材<br/>/dashboard/materials"]
    SELLER_MATERIAL_NEW["資材追加申請<br/>/dashboard/materials/new"]
    SELLER_MATERIAL["自社資材詳細<br/>/dashboard/materials/[id]"]
    SELLER_REQUEST["資材変更申請<br/>/dashboard/materials/requests/[id]"]
    SELLER_ARTICLES["記事管理<br/>/dashboard/articles"]
    SELLER_ARTICLE_NEW["記事作成<br/>/dashboard/articles/new"]
    SELLER_ARTICLE_EDIT["記事編集<br/>/dashboard/articles/[id]/edit"]

    LOGIN["運営ログイン<br/>/login"]
    MFA["2要素認証<br/>/admin/mfa"]
    ADMIN["運営管理ホーム<br/>/admin"]
    ADMIN_SELLERS["メーカー審査<br/>/admin/sellers"]
    ADMIN_SELLER["メーカー審査詳細<br/>/admin/sellers/[id]"]
    ADMIN_MATERIALS["資材管理<br/>/admin/materials"]
    ADMIN_MATERIAL_NEW["資材直接登録<br/>/admin/materials/new"]
    ADMIN_MATERIAL["資材正本編集<br/>/admin/materials/[id]"]
    ADMIN_REQUESTS["資材変更申請<br/>/admin/materials/requests"]
    ADMIN_REQUEST["申請審査<br/>/admin/materials/requests/[id]"]
    ADMIN_TAGS["タグ・作物管理<br/>/admin/tags"]
    ADMIN_REPORTS["通報処理<br/>/admin/reports"]
    ADMIN_USAGE["使用レポート編集局<br/>/admin/usage-reports"]
    ADMIN_USAGE_DETAIL["使用レポート編集<br/>/admin/usage-reports/[id]"]

    PUBLIC_MATERIAL["公開資材<br/>/materials/[id]"]
    PUBLIC_ARTICLE["公開記事<br/>/articles/[id]"]
    PUBLIC_SELLER["公開メーカー<br/>/sellers/[id]"]
    PUBLIC_REPORT["公開使用レポート<br/>/reports/[id]"]

    SELLER_LP --> SELLER_LOGIN
    SELLER_LOGIN --> DASHBOARD
    DASHBOARD --> SELLER_MATERIALS & SELLER_ARTICLES
    SELLER_MATERIALS --> SELLER_MATERIAL_NEW & SELLER_MATERIAL & SELLER_REQUEST
    SELLER_MATERIAL_NEW -->|"追加申請"| SELLER_REQUEST
    SELLER_MATERIAL -->|"変更・掲載終了申請"| SELLER_REQUEST
    SELLER_MATERIAL -->|"初期データ確認"| PUBLIC_MATERIAL
    SELLER_REQUEST -->|"承認後"| PUBLIC_MATERIAL
    SELLER_ARTICLES --> SELLER_ARTICLE_NEW & SELLER_ARTICLE_EDIT
    SELLER_ARTICLE_NEW --> PUBLIC_ARTICLE
    SELLER_ARTICLE_EDIT --> PUBLIC_ARTICLE

    LOGIN -->|"admin・AAL1"| MFA
    MFA --> ADMIN
    ADMIN --> ADMIN_SELLERS & ADMIN_MATERIALS & ADMIN_REQUESTS & ADMIN_TAGS & ADMIN_REPORTS & ADMIN_USAGE
    ADMIN_SELLERS --> ADMIN_SELLER
    ADMIN_SELLER --> PUBLIC_SELLER
    ADMIN_MATERIALS --> ADMIN_MATERIAL_NEW & ADMIN_MATERIAL & ADMIN_REQUESTS
    ADMIN_MATERIAL_NEW --> PUBLIC_MATERIAL
    ADMIN_MATERIAL --> PUBLIC_MATERIAL
    ADMIN_REQUESTS --> ADMIN_REQUEST
    ADMIN_REQUEST -->|"承認・却下"| SELLER_REQUEST
    ADMIN_REQUEST -->|"承認"| PUBLIC_MATERIAL
    ADMIN_USAGE --> ADMIN_USAGE_DETAIL
    ADMIN_USAGE_DETAIL --> PUBLIC_REPORT
```

### 4.3 画面以外のApp Router入口

| 入口 | 種別 | 役割 |
|---|---|---|
| `/auth/confirm` | Route Handler | 一般ユーザーのメール確認後にセッションを確立して遷移 |
| `/logout` | Route Handler | セッション破棄後にホームへ遷移 |
| `/sitemap.xml` | メタデータルート | 公開対象の資材・記事・メーカー等を検索エンジンへ通知 |
| `/robots.txt` | メタデータルート | クロール方針を返す |
| `/opengraph-image` | メタデータルート | 共通OG画像を返す |
| `not-found.tsx`・`error.tsx` | 共通状態画面 | 404と取得失敗を、各領域で意味の伝わる日本語に分ける |
