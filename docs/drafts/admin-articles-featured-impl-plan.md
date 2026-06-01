# draft: admin/articles + admin/featured-products 本実装プラン

**stage**: post-demo (2026-05-27 以降の別 PR)
**前提**: 本日 (2026-05-27) の hotfix で featured ロジックは `products.updated_at DESC` 直接参照に置換済、articles の hero 画像は SQL 直挿入で 3 件分だけ仕込み済。この 2 つを **admin UI で運用可能にする** ための本実装。

---

## 全体方針

### Storage か URL 直入力か

| 方式 | pros | cons | 工数 |
|---|---|---|---|
| **A. URL 直入力 (recommended for v1.1)** | 最速、ADR 不要、外部 CDN を活用可、storage 課金なし | URL 切れリスク、画像差し替えに権限なし、画質統制できない | 半日 |
| B. Supabase Storage `articles-hero` バケット | フル統制、署名 URL で privacy 可、admin 完結 | RLS / signed URL / アップロード UI / 画像最適化全部設計、ADR 1 本必要 | 1.5-2日 |
| C. Hybrid (URL 入力 OR Storage どちらでも) | 柔軟 | 実装複雑、admin が混乱 | 2-3日 |

**推奨**: まず **A** で MVP リリース → 蓄積が見えてから B に格上げ。デザイントークン的にも v1 の「データ層厳格、UI は速度優先」と整合。

---

## Phase A: URL 直入力 admin (半日想定)

### A-1: admin/featured-products 本実装

現状 `frontend/src/app/admin/featured-products/page.tsx` は stub。**今回 home.py で featured curation を `products.updated_at DESC` に置換済なので、この画面は「最近更新の表示順を確認するだけのプレビュー」になる**。

選択肢:
1. **画面を廃止** (sidebar から削除) — 一番速い、4 行削除で済む
2. プレビューに作り替え — `/v1/home` を叩いて featured 8件を read-only 表示 + 「ロジック: products.updated_at DESC」と明記
3. キュレーション機構を復活 — featured_products テーブル + 手動制御 (元 spec 通り)

選択肢 1 か 2 推奨。biz チームに「featured curation したい」と要望が出てから 3 を別フェーズで。

### A-2: admin/articles 最小 CRUD

現状 `frontend/src/app/admin/articles/page.tsx` も stub。**今日のデモ要件「画像だけ admin で書ける」を満たす最小実装**。

#### スコープ (含む)
- `/admin/articles` 一覧 (slug / title / category / published_at / hero_image_url サムネ)
- `/admin/articles/[id]` 編集フォーム:
  - title (text)
  - slug (text, regex check)
  - category (select: monthly_report / weekly_report / featured / column)
  - **hero_image_url** (URL 入力、プレビュー画像表示、validate `^https://`)
  - published_at (datetime-local)
  - body_md (textarea、軽い preview なし — preview は次フェーズ)

#### スコープ (含まない、v1.2+)
- 新規記事作成 (Git PR 運用維持)
- 画像アップロード (URL 入力のみ)
- markdown preview / WYSIWYG
- article_products (関連資材) 編集
- 削除 (Git revert 運用)

### A-3: backend endpoints

`backend/app/routers/admin_articles.py` (新規):

```python
@router.get("")  # admin only, AAL2
async def list_admin_articles(user = require_role("admin", aal="aal2")):
    ...

@router.get("/{id}")
async def get_admin_article(id: UUID, user = require_role("admin", aal="aal2")):
    ...

@router.patch("/{id}")
async def update_admin_article(
    id: UUID,
    payload: AdminArticlePatchPayload,  # title? hero_image_url? published_at? body_md? category?
    user = require_role("admin", aal="aal2"),
):
    # 部分更新、updated_at は trigger 任せ
    # hero_image_url は https:// validate、host allowlist は意図的にしない (URL 切れたら admin が直す責任)
    ...
```

注: ADR-0012 の AAL2 ガードを必ず適用。`require_role` は既存 helper を使う。

### A-4: 画像 host allowlist 戦略

`next.config.ts` の `images.remotePatterns` は build 時 fix。admin が任意の URL を入れられると Next.js Image エラーになる。

選択肢:
- (a) admin 入力時に warning 「次のホストは whitelist 済: ...」を表示、未 whitelist だと壊れる旨明記
- (b) `unoptimized` prop で next/image を bypass (LCP 悪化、本番非推奨)
- (c) **next.config.ts に共通ホスト追加** + admin に「使える host 一覧」UI で示す
- (d) Supabase Storage に移行する Phase B が本命解 (allowlist 1 個で済む)

**A 段階の暫定**: (c) で進める。articles 用の hero 画像は実質 Unsplash + supabase storage + (将来) 自社 CDN だけになるので、whitelist 3-4 個で済む。

### A-5: 必要工数 (見積)

| Task | 想定 |
|---|---|
| backend admin_articles router + schemas | 2h |
| frontend /admin/articles list + edit page | 3h |
| Image preview / URL validate UI | 1h |
| featured-products page 廃止 or プレビュー化 | 0.5h |
| AAL2 / role test (pytest + 手動) | 1h |
| spec / docs 更新 (home.md / articles.md) | 0.5h |
| **計** | **半日 〜 1日 (8h)** |

---

## Phase B: Supabase Storage 統合 (本命、v1.2 以降)

### 設計骨子

#### バケット: `articles-hero`
- `public = false` (signed URL でアクセス) **or** `public = true` (簡便、admin only upload)
- public 推奨 (article 自体が公開コンテンツ、画像も同程度の機密性)

#### RLS:
- SELECT: anon 含む全員 OK (public バケットなら storage.objects 経由で素通し)
- INSERT/UPDATE/DELETE: `auth.jwt()->>'role' = 'admin'` かつ AAL2

#### Path 規約
`articles-hero/{article_id}/{filename}.{ext}`

#### Frontend
- `<input type="file" accept="image/*">` で選択
- リサイズ (browser-image-compression で 1600px @ q=80)
- `supabase.storage.from('articles-hero').upload(...)` (admin token、AAL2 必須)
- 完了したら public URL を取得し form の hero_image_url に流し込む
- 既存 articles の URL は引き続き有効

#### Backend
- 特に追加なし (Storage は frontend ↔ Supabase 直)
- ただし「URL は articles-hero バケット配下のみ受理」みたいな validate を入れたいなら admin_articles.patch で正規表現チェック

#### ADR 必要性
- AAL2 + RLS 設計 + path 規約は ADR 1 本起こす (`docs/decisions/00XX-articles-hero-storage.md`)
- 既存の `product_images` storage RLS (migration `20260423000000_product_images_storage_rls.sql`) を参考に

### Phase B 工数
| Task | 想定 |
|---|---|
| Storage bucket migration + RLS | 1h |
| ADR 起票 + review | 1h |
| frontend file picker + 圧縮 + upload UI | 4h |
| 既存記事の URL を Storage に移行する script (任意) | 2h |
| pytest (RLS) + 手動 UAT | 2h |
| **計** | **1-1.5日** |

---

## 推奨スケジュール

1. **今日 (2026-05-27)** — hotfix 済 (このドキュメントの前提)
2. **来週前半 (2026-05-28〜30)** — Phase A 実装 + PR (この時点では URL 入力で済ます)
3. **メーカー登録が増えて画像差し替え需要が出たら** — Phase B 着手

---

## 関連スキーマ参照

- `articles.hero_image_url text` (既存、migration `20260502120000_phase15_articles_table.sql:10`)
- `featured_products` テーブル (今回の hotfix で参照されなくなった、テーブル自体は削除しない — 将来復活余地)
- `product_images.url` (既存パターン、storage 経由でも公開 URL 直でも入る)

## 関連 ADR 候補

- ADR-00XX articles hero image storage strategy
- ADR-00XX home featured logic 再評価 (今回の hotfix を spec/ADR に反映)

## 既知の落とし穴

- `next.config.ts` の remotePatterns を増やす度に Vercel build を再走らせる必要あり (dev は HMR で OK)
- admin が URL 入力時に CORS で画像取れないホストを指定すると next/image が壊れて 500 → frontend で先回り fetch + HEAD で validate するか、admin に「保存後にプレビューが出ない場合は URL を見直して」と表示
- featured_products テーブルから参照が外れたので、`featured_products` への INSERT が dev に残っている (3行)。silent 残骸、害なし、放置可
