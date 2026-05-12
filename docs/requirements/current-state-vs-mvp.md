# Farmille MVP 機能調査レポート — 現状 vs プロトタイプ

**作成日**: 2026-04-28
**調査者**: Claude (worker session)
**対象 MVP**: https://farmille-mvp.vercel.app/
**目的**: バックエンドを意識せずに作られた MVP プロトタイプを「機能一覧の正」として扱い、本リポ（`docs/requirements/farmille-prd.md`、`docs/specs/*`）との差分を可視化する。
**併読資料**:
- `biz-discussion-agenda.md` — 本レポートから抽出した議論論点
- `design-research-prompt.md` — 視覚デザインを別 AI に調査依頼するプロンプト

---

## 0. 調査スコープと制約

### スコープ
- MVP の主要ナビゲーションページの IA / 機能セット観測
- 本リポの既存 PRD・spec・ADR とのカバレッジマトリクス作成
- 「v1 やらない」決定事項との衝突点の洗い出し
- biz 側で決め切るべき論点の整理

### 制約（取得可否）
| 取得できた | 取得できなかった |
|---|---|
| HTML/DOM テキスト・リンク構造・ナビ階層・公開メタ | フォントレンダリング、色のピクセル値、余白実測、ホバー/トランジション、スクロール演出 |

→ 視覚デザインの最終判定は別 AI に委譲（→ `design-research-prompt.md`）。

### 観測上の注意
- `/b2b` は **404**（フッターからリンクされているのに本体未実装）
- → MVP 自体も完成品ではなく「IA と機能セットの叩き台」として扱う

---

## 1. Executive Summary

| # | 発見 | 重要度 |
|---|---|---|
| 1 | PRD は既に存在（`docs/requirements/farmille-prd.md`、2026-04-27 付）が、**MVP の機能セットを反映していない**。新規で書き起こす方針 | 🔥 |
| 2 | MVP には PRD §4 に存在しない機能が複数：メーカー公開一覧、ランキング、コミュニティ、Farmille AI、B2B LP、静的ページ | 🔥 |
| 3 | MVP は PRD §6「v1 でやらないこと」と衝突: コミュニティ等が UI として実装されている | 🔥 |
| 4 | URL 命名衝突: 本リポ `/products` vs MVP `/bs-materials`（ADR-0006 と整合確認要） | ⚠️ |
| 5 | MVP は張りぼての箇所あり（`/b2b` が 404 等）。仕様の正ではない | ⚠️ |
| 6 | **Farmille AI は v1 で実装する方針が確定**（2026-06 末まで） | 📌 |

**結論**: PRD を新規書き起こし、新規ページの spec を順次起草する必要がある。

---

## 2. MVP サイトマップ（観測）

### グローバルナビ
| ラベル | URL | 状態 |
|---|---|---|
| 資材一覧 | `/bs-materials` | 実装済（14 件表示） |
| メーカー | `/manufacturers` | 実装済 |
| ランキング | `/ranking` | 実装済（TOP 10） |
| コミュニティ | `/community` | 実装済（4 グループ） |
| Farmille AI | （リンク先未確認） | 未確認 |

### フッター
| カテゴリ | リンク | 状態 |
|---|---|---|
| 探す | `/products`, `/categories`, `/crops`, `/leaderboard` | – |
| メーカー様向け | `/b2b`, `/b2b/features`, `/b2b/pricing`, `/b2b/register` | `/b2b` 404 |
| サポート | `/about`, `/contact`, `/terms`, `/privacy` | – |

### 観測した実データ

#### `/bs-materials`（資材一覧、14 件）
- 商品カード項目: 商品名、カテゴリタグ（複数）、メーカー名、★評価、レビュー件数、効果タグ（3-4 + N 件追加表示）、概要、詳細リンク
- 検索: フリーワード（製品名・別名・会社名 部分一致）
- フィルタ:
  - **BS 製品分類**: 海藻抽出物 / アミノ酸 / 腐植酸 / 微生物 / 微量ミネラル / キチン / 動植物抽出物 / その他
  - **BS 主たる効果・効能**: 約 20 項目（栄養利用、非生物的ストレス耐性、収量・品質 等）
- ソート: 観測されず
- ページネーション: なし（14 件全件 1 ページ）
- 実例: Novitek（住友化学）, ソイケア®EX（理研グリーン）, RODALGO（サカタのタネ）
- 詳細パス: `/bs-materials/{cuid}`（例: `/bs-materials/cmo0uvmwb00027kddnp1xf7vh`）

#### `/manufacturers`（メーカー公開一覧）
- カード項目: ロゴ画像、企業名、製品数、強み・特徴（箇条書き）、提供価値（説明文）、本社所在地、業種、詳細リンク
- 検索/フィルタ: なし
- 詳細パス: `/manufacturers/{slug}`（例: `/manufacturers/denka`）
- 実例: デンカ, Syngenta, イノチオアグリ, クミアイ化学工業, サカタのタネ

#### `/ranking`
- BS 資材高評価 **TOP 10**
- 軸: ★評価平均（「レビュー平均評価の高い順」表記）
- 項目: 順位番号、製品画像、メーカー名、製品名、★評価、レビュー件数、含有成分タグ、効果タグ、概要、詳細リンク
- タブ・フィルタ: なし
- `/leaderboard` への参照あり（差分は不明、重複の可能性 → 議論項目）

#### `/community`
- フォーラム形式、4 グループ表示
- 投稿項目: タイトル（例: "各地域で今どんな対策してますか？"）、投稿者（例: 北海道 佐々木農園）、日時、投稿数（3 件 / 4 件）
- リアクション UI（いいね・コメント）: なし
- 投稿フォーム: なし、グループ詳細は「グループを見る」リンクで遷移

#### `/b2b`
- **404**（フッターからリンクされているのに本体未実装）

---

## 3. 機能カバレッジマトリクス

| MVP 機能 | MVP URL | PRD §4 実装済み | 既存 spec | v1 やらない衝突 |
|---|---|:---:|---|:---:|
| ランディング | `/` | ✅ | products.md §4.1 | – |
| 資材一覧 | `/bs-materials` | ✅ ※URL 違い | products.md | – |
| 資材詳細 | `/bs-materials/{id}` | ✅ ※URL 違い | products.md | – |
| **メーカー公開一覧** | `/manufacturers` | ❌ | **なし** | – |
| **メーカー詳細(公開)** | `/manufacturers/{slug}` | ❌ | **なし** | – |
| **ランキング** | `/ranking` `/leaderboard` | ❌ | **なし** | △ |
| **コミュニティ** | `/community` | ❌ | **なし** | ⚠️ §6 リアルタイム更新系列 |
| **Farmille AI** | nav | ❌ | **なし** | 🔥 §6 AI 構造化と衝突。**ただし 6 月末納期で v1 実装方針** |
| カテゴリで探す | `/categories` | ❌（既存はフィルタで吸収） | – | – |
| 作目で探す | `/crops` | ❌（既存はフィルタで吸収） | – | – |
| **B2B LP** | `/b2b/*` | ❌ | **なし**（MVP も `/b2b` 404） | – |
| 静的ページ | `/about` `/contact` `/terms` `/privacy` | ❌ | **なし** | – |
| ログイン / サインアップ / オンボ | `/login` `/signup` `/onboarding/*` | ✅ | auth-flow.md | – |
| 自社資材登録 | `/products/new` | ✅ | maker-product.md | – |
| 自社資材一覧 | `/maker/products` | ✅ | maker-product.md | – |
| 自分のレビュー一覧 | `/me/reviews` | ✅ | phase-12c-farmer-profile.md | – |

---

## 4. 既存リポの「正」となる資産

### PRD（既存、要刷新）
- `docs/requirements/farmille-prd.md`（2026-04-27、未追跡）→ **archive 扱い、新 PRD で置換**

### spec（実装仕様、既存）
- `auth-flow.md` / `products.md` / `review-post.md` / `maker-product.md`
- `edit-delete.md` / `image-edit-and-launch-ready.md`
- `launch-polish.md` / `phase-11c-loading-overlay.md`
- `phase-12a/b/c-*.md` / `progressive-onboarding.md` / `post-launch-hardening.md`

### ADR（意思決定記録）
| ID | タイトル |
|---|---|
| 0001 | Railway 採用 |
| 0002 | レビュー投稿可能ロール統一 |
| 0003 | Storage RLS パス強制 |
| 0004 | Next.js 16 proxy 規約 |
| 0005 | JWT 検証戦略 |
| 0006 | URL 名前空間 3 層分類 |
| 0007 | Storage RLS 監査 |

### デザイントークン
- `docs/design-tokens.md`（primary `#3A7F5C` 等）
- フォント: Noto Sans JP

---

## 5. ギャップ分類

### 5.1 「機能はあるが URL/命名が異なる」 → 命名統一議論
- `/products` vs `/bs-materials`
- `/categories` `/crops` の独立化（現状はフィルタ吸収）

### 5.2 「PRD 未記載・spec なし、MVP に存在」 → spec 起草対象
- `/manufacturers` 公開一覧/詳細
- `/ranking` `/leaderboard`
- `/community`
- `Farmille AI`
- `/b2b/*`
- `/about` `/contact` `/terms` `/privacy`

### 5.3 「PRD §6 やらないと衝突」 → スコープ再判定
- `Farmille AI`（→ 6 月末納期で v1 入りに変更確定）
- `/community`（→ biz 議論で再判定）

### 5.4 「MVP も未完成」 → 仕様化前に biz から要件聴取
- `/b2b`（MVP 自身が 404）

---

## 6. 次のアクション

1. **新規 PRD 執筆**（既存 farmille-prd.md は archive、MVP を起点に作り直し）
2. **biz 議論アジェンダで論点決定** → `biz-discussion-agenda.md` 参照
3. **デザイン調査を別 AI に依頼** → `design-research-prompt.md` 参照
4. **新規ページ spec の先行起草**（biz 確認済み機能から着手）:
   - `/manufacturers` 公開一覧/詳細
   - `/ranking` `/leaderboard`
   - `/community`
   - `Farmille AI`（6 月末納期 → 5 月初旬には spec 確定したい）
   - `/categories` `/crops` 独立ページ（作るなら）
   - `/b2b/*` LP セット
   - `/about` `/contact` `/terms` `/privacy`

---

## 付録 A: 取得できたデザイン情報（断片）

- ロゴ画像: Noun Project の `https://static.thenounproject.com/png/4034870-200.png`
- ロゴテキスト: 「Farmille（ふぁーみる）」
- 装飾アイコン: 花マーク「❁」を使用
- 既存 design-tokens.md primary: `#3A7F5C`
- フォント: Noto Sans JP（既存リポ規約）
- コピーライト: "© 2026 Farmille, Inc. All rights reserved."

詳細な視覚解析は `design-research-prompt.md` で別 AI に渡し、視覚情報を補完する。

---

**以上**
