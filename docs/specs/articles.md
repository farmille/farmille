# Farmille v1 記事（週次〜月次レポート）仕様 (Phase 15)

**作成日**: 2026-05-01
**対象 Phase**: Phase 15
**作業ブランチ**: `feat/phase-15-articles`（仮）
**実装担当**: worker
**位置づけ**: 運営手動キュレーション記事の公開機能。AgList 風ブログを「編集体制透明化」「関連製品リンク」付きで提供する

---

## 0. Architecture Principles 準拠宣言

本 spec は `.claude/skills/farmille-architecture-principles/SKILL.md` の以下に準拠する。

- **§1.1 DOA 優先**: `articles` / `article_products` を第 3 正規形で設計、JSONB 不使用、本文は `text` 列に markdown 文字列を保管。中間テーブル `article_products` の 2 番目 FK `product_id` に逆引き index 付与（§3.1）
- **§1.2 ポータビリティ予算**: Supabase Edge Functions 不使用。markdown レンダリングは Next.js Server Component 内で完結。`process.env.API_URL` で BFF 接続、`RAILWAY_*` 直参照なし
- **§1.3 責務分離**: 記事 GET API は FastAPI `/v1/articles*` 経由。フロントから `supabase.from()` / `supabase.rpc()` を呼ばない。記事ヒーロー画像は運営が SQL 直 + service_role で `articles` バケットに投入する運用とし、フロント storage 直叩きは行わない
- **§1.4 v1 スコープ厳守**: 「やる」内の §3.4「記事（週次〜月次レポート）」のみ実装。コメント / いいね / 自動関連記事推薦 / 記事執筆 UI は実装しない（要件 §3.4.7）
- **§3.1 / §3.2 レビュー軸**: 全テーブル RLS 有効、NOT NULL / UNIQUE / FK / CHECK 制約、`/v1` プレフィックス、Pydantic バリデーション、統一エラー、GET 冪等

§13 で本 Phase の境界（`§5.2.18` 等の未確定領域とのライン）を明示する。

---

## 1. ゴール / 縮退ライン

### 1.1 必達

- 未ログイン含む全ユーザーが `/articles`（一覧）と `/articles/[slug]`（詳細）を閲覧できる
- 記事本文は markdown を Server Component で `remark-html` + `rehype-sanitize` 経由でレンダリング
- 記事詳細に「関連製品」セクションが表示され、`/products/[id]` に遷移できる
- 記事の投入・更新は **SQL 直アクセス**（運営手動）。管理画面は作らない（SKILL §1.4「やらない」）

### 1.2 縮退ライン（落ちても v1.5 送り可）

- カテゴリフィルタ（一覧の絞り込み）— 縮退時はカテゴリは表示するがフィルタクエリは省略
- 関連製品の表示順序の最終確定（暫定 `position ASC`）

### 1.3 翌日送り（本 Phase 対象外）

- 記事執筆 UI / 編集 UI（運営管理画面）→ SKILL §1.4「やらない」確定
- コメント / いいね（要件 §3.4.7、v1.5+ 検討）
- 関連記事の自動推薦（要件 §3.4.7、v1.5+ 検討）
- ヒーロー画像の Web UI 経由アップロード（運営は SQL 直で `hero_image_url` を入れる運用）

---

## 2. 画面一覧

| パス | 種別 | データ源 | 認証 |
|---|---|---|---|
| `/articles` | Server Component | BFF `GET /v1/articles` | 不要 |
| `/articles/[slug]` | Server Component | BFF `GET /v1/articles/{slug}` | 不要 |

新規ページ 2 枚のみ。Phase 18（ホーム）からの「最新記事 3-6 件」読み取りも本 Phase の API を使う（§3.1 ホームから本 API への参照は Phase 18 spec で詳細化、本 Phase は API 提供のみ）。

---

## 3. データ書き込み方針（共通プリアンブル）

本 Phase は **記事の書き込みは v1 スコープ外**（運営 SQL 直）。読み取り専用 API のみ。なお、本節で定義する**共通既定値は Phase 16 / 17 / 18 / 19 spec から「Phase 15 §3 と同じ」として参照する**。

### 3.1 BFF 命名規約

- **公開 GET**: `/v1/{resource}`（例: `/v1/articles`、未ログインで叩ける）
- **本人スコープ**: `/v1/me/{resource}`（例: `/v1/me/favorites`、Bearer JWT 必須）
- **メーカー専用**: `/v1/maker/{resource}`（例: `/v1/maker/profile`、Bearer JWT + `role=maker`）

### 3.2 認証境界

- 公開 GET: 未ログイン可（Bearer JWT 任意）
- `/v1/me/*`: Bearer JWT 必須、未指定で 401。BFF で JWT 検証 → `app_metadata.role` 取得（SKILL §3.2、§4.1 アンチパターン #4）
- `/v1/maker/*`: Bearer JWT 必須かつ `app_metadata.role == 'maker'`、不一致で 403
- フロント `/me/*` ページは未ログインで `/login?next={path}` へ Server Component 内 `redirect()`

### 3.3 統一エラーレスポンス

```json
{ "detail": "human readable message", "code": "machine_readable_code" }
```

HTTP ステータスは 400 / 401 / 403 / 404 / 409 / 422 / 500 を使い分ける。`code` は kebab-case（例: `invalid_kind`、`not_owner`）。

### 3.4 RLS 命名規約

`{table}_{action}_{scope}` 形式。`action` は `select|insert|update|delete`、`scope` は `all|self|owner|maker` 等の意味語。例: `articles_select_all` / `user_favorites_select_owner` / `featured_products_select_all`。

### 3.5 Storage RLS パス強制（ADR-0003 踏襲）

`{auth.uid}/{種別}/{filename}` の 2 階層強制。Phase 19 のアバター（`{auth.uid}/avatar/{filename}`）に適用。本 Phase の `articles` バケットは**運営のみ書き込み**で、`auth.uid` 概念がないため SELECT のみの公開バケットとして運用する（INSERT/UPDATE/DELETE は service_role 経由）。

### 3.6 migration ファイル名

`YYYYMMDDHHMMSS_{機能}_{種別}.sql`。本 Phase は `20260502120000_phase15_articles_table.sql` / `20260502120001_phase15_articles_rls.sql` の 2 本。

### 3.7 フロントから Supabase 直叩きの禁止

`frontend/src` 配下で `supabase.from(` / `supabase.rpc(` の出現を 0 件で維持（受け入れ条件 §9）。例外は `supabase.auth.*` と `supabase.storage.*`（後者は写真アップロード用途のみ）。

---

## 4. DB スキーマ変更

migration 2 本（テーブル本体 + RLS）を新規追加。既存テーブルへの ALTER は無し（SKILL §1.1: 新テーブル追加で完結）。

### 4.1 新規テーブル定義（migration 1: `20260502120000_phase15_articles_table.sql`）

```sql
-- 記事カテゴリは固定 enum（v1 は 4 カテゴリで開始、追加は migration で）
CREATE TABLE articles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        NOT NULL UNIQUE
                              CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 80),
  title           text        NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  body_md         text        NOT NULL CHECK (length(body_md) BETWEEN 1 AND 50000),
  hero_image_url  text,
  category        text        NOT NULL
                              CHECK (category IN ('monthly_report','weekly_report','featured','column')),
  author_user_id  uuid        REFERENCES users(id) ON DELETE SET NULL,
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX articles_published_at_idx
  ON articles (published_at DESC NULLS LAST)
  WHERE published_at IS NOT NULL;

CREATE INDEX articles_category_published_at_idx
  ON articles (category, published_at DESC NULLS LAST)
  WHERE published_at IS NOT NULL;

CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 記事×製品（中間）
CREATE TABLE article_products (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position    int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, product_id)
);

-- SKILL §3.1: 中間テーブルの 2 番目 FK 逆引き index 必須
CREATE INDEX article_products_product_id_idx
  ON article_products (product_id);

CREATE INDEX article_products_article_id_position_idx
  ON article_products (article_id, position);
```

`set_updated_at()` は既存 init.sql で定義済の共通関数を利用（既存 `trg_products_updated_at` 等と同パターン）。

### 4.2 RLS（migration 2: `20260502120001_phase15_articles_rls.sql`）

```sql
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 公開: published_at IS NOT NULL かつ 過去 のもののみ未ログインを含めて公開
CREATE POLICY "articles_select_all" ON articles
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());

-- 書き込みは service_role のみ（運営 SQL 直）。authenticated に書き込み権限を一切渡さない
-- → INSERT / UPDATE / DELETE ポリシーは作らない（policy 不在 = 拒否）

ALTER TABLE article_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_products_select_all" ON article_products
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_products.article_id
        AND a.published_at IS NOT NULL
        AND a.published_at <= now()
    )
  );

-- 書き込みは service_role 経由のみ（運営 SQL 直）
```

未公開記事（`published_at IS NULL` or 未来）は SELECT 不可。誤公開防止は `published_at` 列で表現（不要なフラグ列を増やさない、§1.1 DOA 優先）。

### 4.3 Storage バケット

`articles` バケットを Supabase Studio で事前作成（public read）。RLS は SELECT のみ全許可、INSERT/UPDATE/DELETE は policy 不在で拒否（service_role が運営手動で投入）。MIME: `image/jpeg, image/png, image/webp`、サイズ上限 5MB。バケット作成手順は `docs/setup-log.md` に追記する（運用ドキュメント側、本 spec の責務外）。

---

## 5. FastAPI エンドポイント

新規ルーター `backend/app/routers/articles.py` を追加し、`backend/app/main.py` で `/v1` 配下に include。

### 5.1 `GET /v1/articles`

```
GET /v1/articles?category={category}&limit={limit}
認証: 不要
クエリ:
  category: Literal["monthly_report","weekly_report","featured","column"] | None
  limit:    int (1-50, default 20)
Response 200:
  {
    "articles": [
      {
        "id": uuid,
        "slug": str,
        "title": str,
        "category": str,
        "hero_image_url": str | None,
        "published_at": datetime,
        "excerpt": str    # body_md 先頭 120 文字を strip した抜粋
      }, ...
    ]
  }
Response 422: バリデーションエラー（共通形式）
```

処理:
1. Pydantic でクエリ検証
2. service_role クライアントで `articles` を `published_at IS NOT NULL AND published_at <= now()` で絞り、`category` 指定時は追加絞り、`published_at DESC` で `limit` 件取得
3. excerpt は body_md から markdown 記法を簡易除去（`re.sub(r'[#*_`>\\-]', '', body_md)[:120]`）して返す（先頭抜粋は表示用、SEO 用 description には別途必要なら拡張）

### 5.2 `GET /v1/articles/{slug}`

```
GET /v1/articles/{slug}
認証: 不要
パスパラメータ:
  slug: str (CHECK 制約と同じ正規表現で Pydantic 検証)
Response 200:
  {
    "id": uuid,
    "slug": str,
    "title": str,
    "body_md": str,             # markdown 生文字列。レンダリングはフロント側
    "category": str,
    "hero_image_url": str | None,
    "author": { "id": uuid, "name": str } | None,  # author_user_id が NULL なら null
    "published_at": datetime,
    "related_products": [
      {
        "id": uuid,
        "name": str,
        "maker_name": str | None,
        "image_url": str | None,
        "position": int
      }, ...
    ]
  }
Response 404: { "detail": "article_not_found", "code": "article_not_found" }
```

処理:
1. `articles` から slug 一致 + 公開条件で 1 行取得（404 判定）
2. `users (id, name)` を join して `author` 構築（NULL 許容）
3. `article_products` を `position ASC` で取得 → `products`（`name` + `users.maker_profiles.company_name` 経由でメーカー名を平坦化、Phase 6 の `_flatten_product` パターン踏襲）+ 先頭 `product_images.url`（`order=0`）を join して `related_products` 構築

### 5.3 Pydantic スキーマ

`backend/app/models/schemas.py` に追加:

```python
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field
from uuid import UUID

ArticleCategory = Literal["monthly_report", "weekly_report", "featured", "column"]

class ArticleListItem(BaseModel):
    id: UUID
    slug: str
    title: str
    category: ArticleCategory
    hero_image_url: str | None
    published_at: datetime
    excerpt: str

class ArticleListResponse(BaseModel):
    articles: list[ArticleListItem]

class ArticleAuthor(BaseModel):
    id: UUID
    name: str

class ArticleRelatedProduct(BaseModel):
    id: UUID
    name: str
    maker_name: str | None
    image_url: str | None
    position: int = Field(ge=0)

class ArticleDetailResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    body_md: str
    category: ArticleCategory
    hero_image_url: str | None
    author: ArticleAuthor | None
    published_at: datetime
    related_products: list[ArticleRelatedProduct]
```

---

## 6. UI 仕様

### 6.1 `/articles`（一覧）

- Server Component
- 上部: ページタイトル「記事一覧」、カテゴリ切替タブ（all / monthly_report / weekly_report / featured / column）
- カード: hero_image_url（存在しない場合 placeholder）/ category バッジ / title / published_at / excerpt
- カテゴリタブは URL クエリ `?category=...` に反映、選択中のタブで Server Component 再フェッチ
- 既存 design-tokens（`--primary` 等）を再利用、新規グローバル CSS は追加しない

### 6.2 `/articles/[slug]`（詳細）

- Server Component
- ヘッダー: hero_image_url（next/image）/ category バッジ / title / 著者名 + 公開日
- 本文: markdown → HTML を **Server Component で** `remark` → `remark-html` → `rehype-sanitize` のパイプで処理し、`dangerouslySetInnerHTML` で描画。Client Component は使わない（SSR 完結、SEO 友好）
  - サニタイズ allowlist は `rehype-sanitize` の default schema をベースに、`img` の `src` のみ Supabase Storage と既存 `placehold.co` ホストに限定
- 「関連製品」セクション: `related_products` を `<ProductCard>` 既存コンポーネントで横並び（Phase 6 既存 UI の再利用）

### 6.3 エラー / 空状態

- 一覧で 0 件: 「まだ記事がありません」プレースホルダ
- 詳細で 404: Next.js の `notFound()` を Server Component 内で呼び、既存 `not-found.tsx` の規約 UI を表示

### 6.4 next/image remotePatterns

`articles` バケットの URL は既存 `*.supabase.co` allowlist で吸収可能（Phase 10 §14.2 で確定済）。新規追加なし。

---

## 7. 触らないファイル

- `supabase/migrations/20260415*` / `20260420*` / `20260423*` / `20260424*`（既存）
- `backend/app/routers/auth.py` / `onboarding.py` / `crops.py` / `product_types.py` / `product_benefits.py` / `certifications.py` / `maker.py` / `products.py` / `reviews.py` / `me.py`
- `frontend/src/app/(auth)/*` / `frontend/src/app/onboarding/*` / `frontend/src/app/products/*` / `frontend/src/app/maker/*` / `frontend/src/app/me/*`
- `frontend/src/proxy.ts`
- `.claude/` 配下
- 既存 spec 全て（過去 Phase 不変）

---

## 8. 触るファイル（予想）

### 新規
- `supabase/migrations/20260502120000_phase15_articles_table.sql`
- `supabase/migrations/20260502120001_phase15_articles_rls.sql`
- `backend/app/routers/articles.py`
- `frontend/src/app/articles/page.tsx`
- `frontend/src/app/articles/[slug]/page.tsx`
- `frontend/src/app/articles/_components/article-card.tsx`
- `frontend/src/app/articles/_components/category-tabs.tsx`
- `frontend/src/lib/markdown/render.ts`（remark/rehype のラッパ、Server Component 用）

### 既存修正
- `backend/app/main.py`（`articles.router` の include）
- `backend/app/models/schemas.py`（§5.3 のモデル追加）
- `frontend/package.json`（`remark`, `remark-html`, `rehype-sanitize`, `unified` を追加）

---

## 9. 受け入れ条件

### 9.1 API
- [ ] 未認証で `GET /v1/articles` 200、`published_at` 未設定 / 未来の記事は含まれない
- [ ] `?category=column` で category フィルタが効く
- [ ] `limit=51` で 422
- [ ] `GET /v1/articles/{slug}` で 200、`related_products` が `position ASC` で並ぶ
- [ ] 存在しない slug で 404 `article_not_found`
- [ ] 不正 slug（大文字、空白、長すぎ）で 422

### 9.2 UI
- [ ] `/articles` で記事カードがグリッド表示、カテゴリタブで絞り込める
- [ ] `/articles/{slug}` で本文が HTML レンダリング、`<script>` がサニタイズで除去される
- [ ] 関連製品カードクリックで `/products/{id}` に遷移
- [ ] hero_image_url が NULL のときも UI が崩れない

### 9.3 BFF 原則
- [ ] `grep -rn "supabase\.\(from\|rpc\)(" frontend/src` exit 1（0 件）
- [ ] フロントから storage 直叩きなし（articles バケットは運営 SQL 直のみ）

### 9.4 ビルド / 検証
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] `supabase db push --linked` で dev に migration 適用成功

---

## 10. 設計上の注意

### 10.1 markdown サニタイズの徹底

`rehype-sanitize` の default schema では `<script>` / `<iframe>` / `on*` 属性が除去される。本 Phase では default を維持し、独自に allowlist を緩めない。記事本文に YouTube 埋め込みを許す等の要望は v1.5+ で個別対応（拡張時は ADR を起票）。

### 10.2 `published_at` ベース公開フラグ

`is_published boolean` 列は追加しない。`published_at IS NOT NULL AND published_at <= now()` の単一条件で予約公開・取り下げを表現する（取り下げは SQL で `UPDATE articles SET published_at = NULL`）。SKILL §1.1: 列の冗長化を避ける。

### 10.3 `excerpt` の生成戦略

DB に `excerpt` 列を持たず、API レスポンス時に `body_md` から動的生成する。理由:
- excerpt の生成ロジック変更時に migration 不要
- DB を「事実のみ」に保つ（DOA）

性能懸念は v1 規模（数十件）では発生しない。1,000 件超になったら excerpt 列追加 or マテビュー化を検討（v1.5+）。

### 10.4 アンチパターン回避（SKILL §4）

| # | 回避内容 |
|---|---|
| 1 役割の二重管理 | 本 Phase は role を扱わない |
| 2 JSONB 濫用 | 全列を素朴な型で定義、JSONB 不使用 |
| 3 UI 都合で DB 捻じ曲げ | excerpt は API 層で生成、DB 列追加せず |
| 4 user_metadata に role | 該当なし |
| 5 フロント直叩き | BFF 経由のみ、storage は運営 SQL 直 |
| 6 RLS を第一防御 | API 層は service_role 経由、RLS は第二防御 |
| 7 変更履歴を本文に | 本 spec に「旧版では」等の時系列記述なし |
| 8 注釈メモ | TODO / FIXME を本文に残さない |
| 9 ついで実装 | コメント / いいね / 自動推薦は §13 で明示除外 |
| 10 未採用技術前提 | Sentry / GitHub Actions CI 等の前提コードなし |

---

## 11. Ryoga 判断（確定済 / 未確定の論点）

### 11.1 確定
- ファイル名 `articles.md`（機能名スタイル）
- markdown レンダリングは Server Component + `remark-html` + `rehype-sanitize`、Client 採用しない
- `articles` Storage バケットは運営 SQL 直運用、書き込み policy なし
- `published_at` 列のみで公開状態管理、`is_published` 列は作らない
- カテゴリは `monthly_report / weekly_report / featured / column` の 4 値で開始、追加は migration

### 11.2 未確定（v1 ローンチまでに biz 議論で確定する想定、本 Phase では実装着手しない）
- 記事更新頻度（要件 §5.2.6）
- 記事執筆ワークフロー（要件 §5.2.18 — 本 Phase ではテーブル定義のみで運用フローは規定しない）
- 関連製品の最終的な並び順アルゴリズム（v1 は手動 `position`）

---

## 12. 作業スケジュール（目安）

| Step | 内容 | 見込み |
|---|---|---|
| 1 | migration 2 本（テーブル + RLS） | 1 時間 |
| 2 | backend: articles.py + schemas | 2 時間 |
| 3 | frontend: 一覧ページ + カードコンポーネント | 1.5 時間 |
| 4 | frontend: 詳細ページ + markdown レンダリング | 2 時間 |
| 5 | 検証（pnpm tsc/lint/build, supabase db push, 手動 E2E） | 1 時間 |
| 合計 | | **約 7.5 時間** |

---

## 13. §5 未確定領域との境界（やらないことの明示）

本 Phase で**実装しない**もの（要件 §3.4 / §5.2 / SKILL §1.4 と整合）:

- 記事執筆 / 編集 / 削除 UI（管理画面は v1 アウト）
- 記事へのコメント / いいね / リアクション（要件 §3.4.7）
- 関連記事の自動推薦（要件 §3.4.7、行動履歴ベースは恒久的に v1 アウト）
- 自動ランキング（記事閲覧数 / シェア数集計、要件 §3.4.7）
- 記事の予約公開 UI（DB 列としては `published_at` 未来日で対応可能だが、UI は不要）
- 記事の RSS / Atom feed
- 記事へのタグ複数付与（カテゴリ単一で開始、複数化は v1.5+ で `article_tags` 中間テーブル新設なら ADR 起票）
- 記事内 markdown でのカスタム埋め込み（YouTube / Twitter）
- 多言語化（v1 は日本語のみ）

---

**以上**
