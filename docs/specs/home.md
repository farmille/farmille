# Farmille v1 ホーム画面 仕様 (Phase 18)

**作成日**: 2026-05-01
**対象 Phase**: Phase 18
**作業ブランチ**: `feat/phase-18-home`（仮）
**実装担当**: worker
**位置づけ**: `/`（未ログイン）と `/home`（ログイン済）に注目の資材 + 最新記事 + バナーを集約。アイハーブ風 UI 構成だがレイアウト最終確定は §5.2.14 待ち、本 Phase は design-tokens のグリッド + 横スクロールカードで固定

---

## 0. Architecture Principles 準拠宣言

本 spec は `.claude/skills/farmille-architecture-principles/SKILL.md` の以下に準拠する。

- **§1.1 DOA 優先**: `featured_products` / `home_banners` を第 3 正規形で設計（中間テーブル + マスタ）。JSONB 不使用、各列は素朴な型で定義。中間 `featured_products` の 2 番目 FK `product_id` に逆引き index 付与（§3.1）
- **§1.2 ポータビリティ予算**: Supabase Edge Functions / Realtime 不使用。集約 BFF 1 本で home 用データを返す（fetch waterfall を避ける）
- **§1.3 責務分離**: 全データ取得は FastAPI `/v1/home` 経由。フロント直叩き禁止。Storage は `home-banners` バケットを運営 SQL 直管理（articles と同パターン）
- **§1.4 v1 スコープ厳守**: 「やる」内の §3.1「ホーム」のみ。注目の資材は**手動キュレーション**のみ（自動ランキング不採用、SKILL §1.4 / 要件 §3.4.7）。メーカー有償広告枠 / 自動選定 / パーソナライズはゼロ実装
- **§3.1 / §3.2 レビュー軸**: 全テーブル RLS 有効、NOT NULL / UNIQUE / FK / CHECK 制約、`/v1` プレフィックス、Pydantic バリデーション、統一エラー、GET 冪等
- **ADR-0006 §1.4 整合**: `/home` は薄ラッパとして既に存在（Phase 11/12 で完全削除予定だった経緯がある）。本 Phase では `/home` を「ログイン済みの home コンテンツ」として復活させるか、`/` 未ログインと統合するかを §11 で確定

§3 の共通既定値は **Phase 15 §3 と同じ**（参照）。§13 で本 Phase が踏み込まない領域を明示する。

---

## 1. ゴール / 縮退ライン

### 1.1 必達

- 未ログイン訪問者が `/` で「Farmille は何のサイトか」を即理解できる（hero + 価値提案）
- ログイン済 reviewer / maker が `/home` で注目の資材 + 最新記事 + バナーを一覧できる
- `/` と `/home` で同一の home コンテンツ（注目の資材 / 記事 / バナー）を出し、ヘッダーのログインボタン or アバターのみ出し分ける
- 注目の資材は運営手動キュレーション（`featured_products` テーブル）、SQL 直で投入
- 最新記事は Phase 15 の `/v1/articles` を再利用、上位 5-6 件を取得
- 検索バーが上部にあり、`/products` への遷移が可能

### 1.2 縮退ライン（落ちても v1.5 送り可）

- バナーセクション（`home_banners`）— 0 件時は表示せず、UI 崩れない
- 注目の資材の表示順序の動的並び替え（v1 は `sort_order ASC` 固定）

### 1.3 翌日送り（本 Phase 対象外、§13 と一体）

- メーカー有償広告枠購入 UI（要件 §3.1.7、v1.5+）
- 行動履歴ベースのパーソナライズ（要件 §3.1.7、SKILL §1.4 やらない）
- 「注目の資材」自動選定ロジック（SKILL §1.4 やらない、手動キュレーションのみ）
- アイハーブ風レイアウトの最終確定（要件 §5.2.14、デザイン解析待ち）
- 記事と注目の資材のテーブル統合（要件 §5.2.7）

---

## 2. 画面一覧

| パス | 種別 | データ源 | 認証 |
|---|---|---|---|
| `/` | Server Component | BFF `GET /v1/home` | 不要（未ログイン向け hero + home コンテンツ） |
| `/home` | Server Component | BFF `GET /v1/home` | 認証済 reviewer / maker のみ（unassigned は `/onboarding` redirect） |

### 2.1 `/home` の意味と ADR-0008 への準拠

本 spec は **ADR-0008「`/home` をコンテンツ閲覧入口として再定義」** に従う。ADR-0008 で確定した制約:

- `/home` はロール別 dashboard 機能を持たない（ADR-0006 の精神継承）
- 表示内容は「注目の資材 / 最新記事 / 自社記事広告枠 / 検索バー」のみ
- `landingPathForRole()` の reviewer 系 default 着地は引き続き `/products`（既存）。`/home` への自動 redirect は行わず、ヘッダーのロゴクリック等から到達する経路にする

詳細・代替案・帰結は ADR-0008 を参照。

---

## 3. データ書き込み方針

**Phase 15 §3 と同じ**（共通プリアンブル参照）。本 Phase で追加で意識する点:

- 公開 GET `/v1/home` は未認証可
- `featured_products` / `home_banners` の書き込みは v1 では運営 SQL 直のみ（管理画面なし、SKILL §1.4「やらない」）
- フロントから storage 直叩きなし

---

## 4. DB スキーマ変更

migration 2 本（テーブル本体 + RLS）を新規追加。既存テーブルへの ALTER は無し（SKILL §1.1）。

### 4.1 新規テーブル定義（migration 1: `20260502140000_phase18_home_curation_table.sql`）

```sql
-- 注目の資材（運営手動キュレーション）
-- 中間テーブルとして products と関連付けるが、注目になっている期間も表現するため独立テーブルとして設計
CREATE TABLE featured_products (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order   int         NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  displayed_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- 同一 product を複数同時 featured にしない（業務ルール）
  UNIQUE (product_id)
);

-- SKILL §3.1: 中間テーブルの 2 番目 FK 逆引き index 必須
CREATE INDEX featured_products_product_id_idx
  ON featured_products (product_id);

-- 一覧表示は (displayed_at, sort_order) で叩くため複合 index
CREATE INDEX featured_products_displayed_at_sort_order_idx
  ON featured_products (displayed_at DESC, sort_order ASC);

-- ホームバナー（自社記事 / キャンペーン告知）
-- 商用広告は v1 アウトのため、運営手動運用前提
CREATE TABLE home_banners (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  image_url    text        NOT NULL CHECK (length(image_url) BETWEEN 1 AND 2000),
  link_url     text        NOT NULL CHECK (length(link_url) BETWEEN 1 AND 2000),
  sort_order   int         NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  displayed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX home_banners_displayed_at_sort_order_idx
  ON home_banners (displayed_at DESC NULLS LAST, sort_order ASC)
  WHERE displayed_at IS NOT NULL;
```

`displayed_at` は「いつから表示するか」の予約公開（articles の `published_at` と同じパターン）。NULL は非公開。

### 4.2 RLS（migration 2: `20260502140001_phase18_home_curation_rls.sql`）

```sql
ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

-- 公開: displayed_at <= now() のみ表示
CREATE POLICY "featured_products_select_all" ON featured_products
  FOR SELECT TO anon, authenticated
  USING (displayed_at <= now());

-- 書き込みは service_role のみ（policy 不在 = 拒否）

ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_banners_select_all" ON home_banners
  FOR SELECT TO anon, authenticated
  USING (displayed_at IS NOT NULL AND displayed_at <= now());

-- 書き込みは service_role のみ
```

### 4.3 Storage バケット

`home-banners` バケットを Supabase Studio で事前作成（public read）。RLS は SELECT のみ全許可、書き込みは service_role 経由のみ（articles バケットと同じ運用）。MIME: `image/jpeg, image/png, image/webp`、サイズ上限 5MB。

---

## 5. FastAPI エンドポイント

新規ルーター `backend/app/routers/home.py`。`backend/app/main.py` で `/v1/home` 配下に include。集約 endpoint 1 本に絞る（fetch waterfall 回避）。

### 5.1 `GET /v1/home`

```
GET /v1/home?featured_limit={fl}&articles_limit={al}&banners_limit={bl}
認証: 不要
クエリ:
  featured_limit: int (1-20, default 8)
  articles_limit: int (1-12, default 6)
  banners_limit:  int (1-10, default 3)
Response 200:
  {
    "featured_products": [
      {
        "id": uuid,                       # featured_products.id
        "sort_order": int,
        "product": {
          "id": uuid,
          "name": str,
          "maker_name": str | None,
          "image_url": str | None,
          "type_name": str | None
        }
      }, ...
    ],
    "latest_articles": [
      {
        "id": uuid,
        "slug": str,
        "title": str,
        "category": str,
        "hero_image_url": str | None,
        "published_at": datetime,
        "excerpt": str
      }, ...
    ],
    "banners": [
      {
        "id": uuid,
        "title": str,
        "image_url": str,
        "link_url": str,
        "sort_order": int
      }, ...
    ]
  }
Response 422: クエリ不正
```

処理:
1. Pydantic でクエリ検証
2. 並列フェッチ（asyncio.gather 等）で 3 系統を取得:
   - `featured_products` を `displayed_at <= now()` で絞り `sort_order ASC, displayed_at DESC` で `featured_limit` 件 → product join（既存 `_flatten_product` 再利用）
   - `articles` を Phase 15 の同一クエリで `articles_limit` 件
   - `home_banners` を `displayed_at IS NOT NULL AND displayed_at <= now()` で `sort_order ASC, displayed_at DESC` で `banners_limit` 件
3. 1 つの response にまとめて返却

### 5.2 Pydantic スキーマ

```python
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Literal

ArticleCategory = Literal["monthly_report", "weekly_report", "featured", "column"]

class FeaturedProductInner(BaseModel):
    id: UUID
    name: str
    maker_name: str | None
    image_url: str | None
    type_name: str | None

class FeaturedProductItem(BaseModel):
    id: UUID
    sort_order: int = Field(ge=0)
    product: FeaturedProductInner

class HomeArticleItem(BaseModel):
    id: UUID
    slug: str
    title: str
    category: ArticleCategory
    hero_image_url: str | None
    published_at: datetime
    excerpt: str

class HomeBannerItem(BaseModel):
    id: UUID
    title: str
    image_url: str
    link_url: str
    sort_order: int = Field(ge=0)

class HomeResponse(BaseModel):
    featured_products: list[FeaturedProductItem]
    latest_articles: list[HomeArticleItem]
    banners: list[HomeBannerItem]
```

---

## 6. UI 仕様

### 6.1 `/`（未ログイン向け hero + home コンテンツ）

- Server Component
- 上部: Farmille ロゴ + キャッチコピー + サインアップ / ログイン CTA
- 検索バー: 既存 `/products` への遷移（クエリ `?q=...` は未実装、v1.5+。v1 は単なる遷移リンクで可、worker 判断）
- バナーセクション: `banners` を横スクロールカードで表示（0 件時は非表示）
- 「注目の資材」セクション: `featured_products` を横並び 4-8 製品（既存 `<ProductCard>` 再利用）
- 「最新の記事」セクション: `latest_articles` を 3-6 件カード表示（Phase 15 のカードコンポーネント再利用）
- フッター: 既存共通フッター（利用規約 / プライバシーポリシー / お問い合わせ / About）

### 6.2 `/home`（ログイン済）

- Server Component
- アクセス制御:
  - 未ログイン → `/` に redirect（誘導）
  - unassigned → `/onboarding` redirect
- 上部: ヘッダーにアバター + ロール表示
- コンテンツ部分は `/` と同一（`<HomeContent>` 共有 Server Component に切り出して両ページで再利用）
- 検索バー / バナー / 注目の資材 / 最新記事の構造は同一

### 6.3 共通コンポーネント

- `<HomeContent>`: `/v1/home` の response を受け取り、3 セクションを描画
- `<HeroSection>`: `/` のみで使う hero（`/home` では不要）
- 既存 `<ProductCard>`（Phase 6）/ `<ArticleCard>`（Phase 15）を再利用
- バナーカードは `<BannerCard>` を新規作成

### 6.4 デザイン

- design-tokens.md 準拠（`--primary` `--foreground` 等の CSS 変数を使用）
- 角丸 `rounded` / `rounded-md`（design-tokens 準拠）
- グリッド: tailwind の `grid grid-cols-{n}` で responsive（mobile 2 / tablet 3 / desktop 4）
- 横スクロールカード: `overflow-x-auto` + `snap-x` の素朴実装（要件 §5.2.14 のアイハーブ風最終形は v1.5+）

### 6.5 next/image remotePatterns

`home-banners` バケットの URL は既存 `*.supabase.co` allowlist で吸収可能（Phase 10 §14.2 確定済）。新規追加なし。

---

## 7. 触らないファイル

- `supabase/migrations/20260415*` / `20260420*` / `20260423*` / `20260424*` / `20260502120*` / `20260502130*`
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py` / `maker.py` / `products.py` / `reviews.py` / `me.py` / `articles.py` / `me_favorites.py` / `manufacturers.py` / `maker_profile.py`
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*` / `frontend/src/app/products/*` / `frontend/src/app/maker/*` / `frontend/src/app/me/*` / `frontend/src/app/articles/*` / `frontend/src/app/manufacturers/*`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- 既存 spec 全て

---

## 8. 触るファイル（予想）

### 新規
- `supabase/migrations/20260502140000_phase18_home_curation_table.sql`
- `supabase/migrations/20260502140001_phase18_home_curation_rls.sql`
- `backend/app/routers/home.py`
- `frontend/src/app/home/page.tsx`（既存薄ラッパを正式 home ページに昇格）
- `frontend/src/app/_components/home-content.tsx`（`/` と `/home` で共有）
- `frontend/src/app/_components/hero-section.tsx`（`/` のみ）
- `frontend/src/app/_components/banner-card.tsx`
- `frontend/src/app/_components/featured-products-section.tsx`
- `frontend/src/app/_components/latest-articles-section.tsx`

### 既存修正
- `frontend/src/app/page.tsx`（既存 LP 内容を `<HeroSection>` + `<HomeContent>` 構成に置換）
- `backend/app/main.py`（`home.router` の include）
- `backend/app/models/schemas.py`（§5.2 のモデル追加）
- ADR-0006 の改訂（必要なら、§11.1 で確定）

---

## 9. 受け入れ条件

### 9.1 API 動作
- [ ] 未認証で `GET /v1/home` 200、3 配列が返る
- [ ] `displayed_at` が未来 / NULL の `featured_products` は含まれない
- [ ] `displayed_at` が NULL の `home_banners` は含まれない
- [ ] `featured_limit=21` で 422
- [ ] articles は `published_at IS NOT NULL AND published_at <= now()` のみ（Phase 15 と同じ動作）
- [ ] 0 件の場合は空配列を返す（200、エラーにしない）

### 9.2 UI 動作
- [ ] 未ログインで `/` にアクセスすると hero + 注目の資材 + 記事 + バナーが表示
- [ ] reviewer ログイン済で `/home` にアクセスすると注目の資材 + 記事 + バナーが表示
- [ ] unassigned で `/home` → `/onboarding` redirect
- [ ] 検索バーから `/products` へ遷移可能
- [ ] バナー 0 件 / 注目の資材 0 件 / 記事 0 件 の場合に UI が崩れない
- [ ] 注目の資材カードクリックで `/products/{id}` に遷移
- [ ] 記事カードクリックで `/articles/{slug}` に遷移
- [ ] バナークリックで `link_url` に遷移（target=_blank は外部 URL の場合のみ、worker 判断）

### 9.3 BFF 原則
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1（0 件）
- [ ] フロントから storage 直叩きなし

### 9.4 ビルド / 検証
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] `supabase db push --linked` で dev 適用成功

---

## 10. 設計上の注意

### 10.1 集約 endpoint `GET /v1/home` の設計理由

3 系統（featured / articles / banners）を別々に呼ぶと、Server Component で 3 回 fetch するか、Client Component で waterfall になる。単一 endpoint で並列フェッチして返すことで:
- ネットワーク往復削減（特に Vercel ↔ Railway の dyno 距離）
- フロント側のローディング状態管理が単純化
- BFF が「home の表示形」を業務的に確定する箇所として一元化

ただし将来 home に追加するセクション（v1.5+ のメーカー広告等）が増える場合、endpoint が肥大化する懸念がある。3-5 セクションを超えたら個別 endpoint への分割を検討（v1.5+）。

### 10.2 `featured_products` の `UNIQUE (product_id)` 制約

同一 product を複数同時 featured にしない（業務ルール）。理由:
- ホーム画面で同じ製品が複数枠に出ると UX 上不自然
- 並び順（sort_order）の意味が曖昧になる

「期間別に複数 featured 履歴を残したい」という要件が将来出たら、`displayed_at` を `displayed_from` / `displayed_to` の範囲に分けて履歴テーブル化する（v1.5+ で migration、本 Phase は単純構造）。

### 10.3 アンチパターン回避（SKILL §4）

| # | 回避内容 |
|---|---|
| 1 役割の二重管理 | 該当なし |
| 2 JSONB 濫用 | 全列素朴な型、JSONB なし |
| 3 UI 都合で DB 捻じ曲げ | アイハーブ風 UI 最終形が未確定でも DB は最小構造で固定、UI 側で吸収 |
| 4 user_metadata に role | 該当なし |
| 5 フロント直叩き | `/v1/home` 集約 BFF 経由のみ |
| 6 RLS を第一防御 | API は service_role 経由、RLS は第二防御（公開 SELECT のみ） |
| 7 変更履歴を本文に | 「旧版では」等の時系列記述なし |
| 8 注釈メモ | TODO / FIXME 残置なし |
| 9 ついで実装 | 自動ランキング / 広告 / パーソナライズは §13 で明示除外 |
| 10 未採用技術前提 | Sentry / Realtime / GitHub Actions CI 前提なし |

### 10.4 ADR-0008 への準拠

本 Phase の `/home` 実装は **ADR-0008「`/home` をコンテンツ閲覧入口として再定義」** に従う。ADR で確定した運用ルール:

- `/home` は **コンテンツ閲覧の入口**（注目の資材 / 記事 / バナー）であり、**ロール別 dashboard 機能ではない**
- ロール別の機能集約（投稿ボタン / 統計）は引き続き `/products` / `/maker/products` / `/me/*` に分散
- `landingPathForRole()` の reviewer 系 default は `/products` を維持（自動的に `/home` へ飛ばさない）
- `/home` は能動的にナビゲーションした場合のみ到達

### 10.5 自動ランキングを取り入れない理由（再掲）

「ホームに『人気の資材ランキング』を出す」誘惑があるが、SKILL §1.4「やらない」リスト + 要件 §3.1.7 で **恒久的に不採用**。理由:
- 公平性懸念（少数レビュー時の偏り）
- メーカー間の競争構造を煽るリスク
- 月次レポート手動公開で代替（記事として透明化）

本 Phase では「注目の資材 = 運営手動キュレーション」のみで実装。`featured_products` テーブルは「レーティング集計の cache」ではなく「運営の選定リスト」として設計されている。

---

## 11. Ryoga 判断

### 11.1 確定済 / 要確認
- ファイル名 `home.md`
- `/` と `/home` の両方を本 Phase で実装、コンテンツ部分は `<HomeContent>` で共有
- 注目の資材は手動キュレーションのみ、自動ランキングなし
- 集約 endpoint `/v1/home` で 3 系統まとめて返す
- `featured_products` の `UNIQUE (product_id)` 維持（同時複数 featured 不可）
- **要 Ryoga 判断**: ADR-0008 を Accepted に確定（現在 Proposed、worker session で起草済み）。確定後、本 spec §10.4 の引用が固定化する

### 11.2 worker 判断可（Ryoga 確認不要）
- 検索バーの実装（v1 は `/products` へのリンクのみ、クエリ転送は v1.5+）
- バナーカードの細かいデザイン
- `<HomeContent>` の Server Component / Client Component 分離方針
- `/` と `/home` の hero 出し分け詳細

### 11.3 v1 ローンチまでに biz 確定する論点（本 Phase では実装しない）
- 要件 §5.2.14 アイハーブ風レイアウト最終確定（デザイン解析待ち）
- 要件 §5.2.7 注目の資材更新頻度 / 月次レポートと記事のテーブル統合可否
- 要件 §5.2.17 `featured_products` / `home_banners` の運営手動運用フロー（更新頻度・選定担当者）— 本 Phase ではテーブルのみ確定、フロー文書は別途

---

## 12. 作業スケジュール（目安）

| Step | 内容 | 見込み |
|---|---|---|
| 1 | migration 2 本（テーブル + RLS） | 1 時間 |
| 2 | backend: home.py（集約 GET）+ schemas | 2 時間 |
| 3 | frontend: `<HomeContent>` 共有コンポーネント | 1.5 時間 |
| 4 | frontend: `/` ページ書き換え（hero + content） | 1.5 時間 |
| 5 | frontend: `/home` ページ昇格（content + auth gate） | 1 時間 |
| 6 | frontend: バナー / featured / articles セクションコンポーネント | 2 時間 |
| 7 | ADR-0006 改訂（§11.1 確定後）+ 検証 | 1.5 時間 |
| 合計 | | **約 10.5 時間** |

---

## 13. §5 未確定領域との境界（やらないことの明示）

本 Phase で**実装しない**もの（要件 §3.1 / §5.2 / SKILL §1.4 と整合）:

- **メーカー有償広告枠購入 UI / 広告サーバ連携**（要件 §3.1.7、v1.5+）
- **アフィリエイト広告**（v1〜v3 不採用）
- **行動履歴ベースのパーソナライズ / レコメンド**（要件 §3.1.7、SKILL §1.4 やらない）
- **「注目の資材」自動選定ロジック**（SKILL §1.4 やらない、`featured_products` は手動キュレーションのみ）
- **★評価 / レビュー数 / 閲覧数ベースの自動ランキング**（SKILL §1.4 やらない、要件 §3.4.7）
- **自動関連記事推薦**（要件 §3.4.7）
- **アイハーブ風レイアウトの最終確定**（要件 §5.2.14、デザイン解析待ち）
- **`featured_products` / `home_banners` の運営管理画面**（管理画面は v1 アウト、SQL 直のみ）
- **A/B テスト基盤**
- **メーカー独自の hero スポット購入**（v1.5+）
- **ロール別 dashboard 機能**（ADR-0006 / SKILL §1.4 維持、`/home` は閲覧入口のみ）

---

**以上**
