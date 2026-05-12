# AgList.com ギャップ分析レポート

**作成日**: 2026-04-28
**調査者**: Claude (worker session)
**調査対象**: https://aglist.com/
**目的**: MVP（farmille-mvp.vercel.app）が aglist.com の完全模倣を目指している前提で、**aglist にあって MVP / v1 PRD に未取り込み** の機能を可視化し、biz 議論の素材にする。
**スコープ**: 公開ページのみ（`/app`、`/admin` はログイン必須のため対象外）
**併読**:
- `current-state-vs-mvp.md` — MVP と本リポの差分
- `feature-definition-workshop.md` — 機能定義ワークショップ
- `farmille-prd.md` — PRD v2

---

## 0. 調査方法と制約

### 0.1 取得できたもの
- `sitemap.xml` インデックス + サブサイトマップ（products / manufacturers / distributors / partners / blog / faq / subscription）
- 各 entity の URL パターン（slug 形式）と概数
- グローバル URL 構造（`/products/{slug}`, `/manufacturers/{slug}`, `/distributors/{slug}`, `/partner/{slug}`, `/blog/{slug}` 等）
- robots.txt から **未公開領域**（`/app`, `/admin`）の存在確認

### 0.2 取得できなかったもの
- 各ページの本文（aglist は Bubble.io 製の SPA、初期 HTML が空、JS 実行が必要）
- フィルタ UI / 検索仕様 / フォーム項目の詳細
- subscription の料金プラン詳細
- ログイン後機能（`/app/*`）

### 0.3 推奨される追加調査
- **Ryoga が aglist にログインして `/app/*` のスクショ共有**（user 指示で保留中）
- **Ryoga またはデザイン担当 AI に主要ページのスクショ取得依頼** → 視覚情報を補完
- 後日、ログイン後の調査結果を本書に追記

---

## 1. Executive Summary

| # | 発見 | 重要度 | MVP/v1 状態 |
|---|---|---|---|
| 1 | **Distributors（販売代理店）一覧/詳細** が aglist に独立 entity として存在（40 件） | 🔥 大物 | 未取り込み |
| 2 | **Partners（メディア/戦略パートナー）** が独立 entity（4 件） | ⚠️ 中 | 未取り込み |
| 3 | **Blog/Newsroom**（業界ニュース・マーケ記事） | ⚠️ 中 | 未取り込み |
| 4 | **FAQ**（独立したヘルプセンター） | 💡 小 | 未取り込み（PRD §4.10 静的ページに含まれず） |
| 5 | **Subscription（独立料金ページ）** | ⚠️ 中 | PRD §4.11 `/b2b/pricing` と類似、ただし MVP は 404 |
| 6 | **Company Leaderboard**（メーカーランキング、製品ランキングと別軸） | ⚠️ 中 | MVP `/leaderboard` 観測のみ、内容未確認 |
| 7 | **Manufacturer 規模 700+** vs Farmille v1 目標 10 社 | 📊 規模差 | 数年運用後の目標値として参考 |
| 8 | **Product 規模 228 件** vs Farmille v1 目標 30 件 | 📊 規模差 | 同上 |
| 9 | **製品 formulation type メタデータ**（WG/LC/SC/WP 等）が slug に含まれている | 💡 データ設計拡張余地 | PRD で未定義 |
| 10 | **ビジネスモデルがメーカー B2B 中心**（subscription + メーカー向け blog） | 🧭 戦略示唆 | Farmille v1 はメーカー無料、v2 で有料化想定 |

---

## 2. AgList.com 観測サマリ

### 2.1 公開ルート一覧（sitemap.xml index から確定）

| ルート | 種別 | 件数 | MVP に対応するもの |
|---|---|---|---|
| `/` | トップ | 1 | `/` あり |
| `/products` | 製品一覧 | 1（リスト） | `/bs-materials` あり |
| `/products/{slug}` | 製品詳細 | **228** | `/bs-materials/{id}` あり |
| `/manufacturers` | メーカー一覧 | 1 | `/manufacturers` あり |
| `/manufacturers/{slug}` | メーカー詳細 | **700+** | `/manufacturers/{slug}` あり |
| `/distributors` | 販売代理店一覧 | 1 | **なし** 🔥 |
| `/distributors/{slug}` | 販売代理店詳細 | **40** | **なし** 🔥 |
| `/partners` | パートナー一覧 | 1 | **なし** ⚠️ |
| `/partner/{slug}` | パートナー詳細 | **4** | **なし** ⚠️ |
| `/leaderboard` | リーダーボード（会社ランキング） | 1 | MVP `/leaderboard` 観測あり、内容未確認 |
| `/blogs` | ブログ一覧 | 1 | **なし** ⚠️ |
| `/blog/{slug}` | ブログ記事詳細 | **6** | **なし** ⚠️ |
| `/faq` | FAQ | 1 | **なし** 💡 |
| `/about-us` | 会社紹介 | 1 | MVP `/about` あり |
| `/contact` | お問い合わせ | 1 | MVP `/contact` あり |
| `/terms` | 利用規約 | 1 | MVP `/terms` あり |
| `/privacy` | プライバシーポリシー | 1 | MVP `/privacy` あり |
| `/subscription` | 料金プラン | 1 | MVP `/b2b/pricing`（404） |

### 2.2 robots.txt から確認できた未公開領域

| ルート | 推定用途 |
|---|---|
| `/app` | ログイン後アプリ本体（マイページ、レビュー投稿、メーカー管理画面等） |
| `/admin` | 運営管理画面 |
| `/api` | 内部 API |
| `/version-test` | Bubble.io のテスト環境 |
| `/landscape-embed` `/biocontrol-landscape-embed` | 外部サイト埋め込み用ウィジェット |

### 2.3 製品 slug の例（formulation type 含意）

```
biotrinsic-wt29, biotrinsic-w13, biotrinsic-z15, biotrinsic-pathoshield
biotrinsic-n13--e13, biotrinsic-m34, biotrinsic-m34--n13
rootella-forte, rootella-t, rootella-p, rootella-g, rootella-f, rootella-l, rootella-x
spear-t-liquid-concentrate, trilogy, theia, sluggo
sil-matrix-lc, oso-5-sc, nemaclean-10-wp, madex-xlv, madex-hp
lifegard-wg, javelin-wg, homeplate-non-selective-herbicide, gemstar-lc
```

**読み取れる情報**:
- **シリーズ製品が多い**（biotrinsic-* で 7 件、rootella-* で 7 件）→ メーカーは類似製品を派生で展開
- **formulation type が slug の suffix**: WG (Wettable Granule), LC (Liquid Concentrate), SC (Suspension Concentrate), WP (Wettable Powder)
- **複合製品**: `biotrinsic-m34--n13--e13` のような "成分混合" 製品

### 2.4 メーカー実例（700+ 件中の代表）

```
グローバル大手: BASF, Bayer, Syngenta Biological, Corteva Agriscience, Yara, Novozymes
バイオロジカル専業: Pivot Bio, Indigo Ag, Koppert, Certis Biologicals, Vestaron, Greenlight Biosciences
スタートアップ系: Kula Bio, Sound Agriculture, Pivot Bio, Crobio, Biolevel
日本/アジア系: （観測した範囲では少数）
```

**示唆**: aglist は **北米・欧州中心の英語プラットフォーム**。日本メーカーはほぼ含まれない。

### 2.5 Distributor 実例（40 件中）

```
tep-inc, biologika, willard-agri-service, agrivestedbioag, gregerson-seed
california-ag-solutions, valley-ag, the-ag-center, golden-grains-inc
countyline-ag, dynamic-agronomics, planet-earth-agronomy, basin-fertilizer--chemical-co-llc
```

**示唆**: 米国の地域農業協同組合・農業資材小売・農業コンサル系が中心。日本の JA に類似する役割。

### 2.6 Partner 実例（4 件のみ）

```
biome-makers-inc, biome-makers, newleaf-symbiotics, the-modern-acre-1
```

**示唆**:
- "the-modern-acre" は agritech ポッドキャストとして知られる → **メディアパートナー**
- "biome-makers" "newleaf-symbiotics" は同社が manufacturer にも登録あり → **戦略提携先（プレミアム露出？）**
- 4 件と少数 → 厳選された提携先のみ

### 2.7 Blog 記事タイトル（6 件全件）

```
biologicals-in-agriculture
digital-marketing-trends-ag-biologicals-2025
farmer-endorsements-boost-sales
third-party-platforms-ag-marketing
go-to-market-guide-ag-biologicals
agricultural-biologicals-boom
```

**示唆**:
- **読者ターゲットはメーカー / マーケター**（"ag biologicals の go-to-market guide"、"farmer endorsements が売上を上げる"）
- 農家向けの "how to use" 系コンテンツではない
- aglist の収益構造（メーカー subscription）を補強する **コンテンツマーケティング**

---

## 3. ギャップマトリクス

| aglist 機能 | aglist URL | MVP に存在 | v1 PRD に記載 | 結論 |
|---|---|:---:|:---:|---|
| 製品一覧/詳細 | `/products` `/products/{slug}` | ✅ `/bs-materials` | ✅ §4.2 | 同等 |
| メーカー一覧/詳細 | `/manufacturers` `/manufacturers/{slug}` | ✅ `/manufacturers` | 🟡 §4.3（spec 未起草） | 同等、Farmille は spec 起草中 |
| **販売代理店一覧/詳細** | `/distributors` `/distributors/{slug}` | ❌ | ❌ | **新規論点（§4.1 で詳述）** |
| **パートナー一覧/詳細** | `/partners` `/partner/{slug}` | ❌ | ❌ | **新規論点（§4.2）** |
| **ブログ一覧/記事** | `/blogs` `/blog/{slug}` | ❌ | ❌ | **新規論点（§4.3）** |
| **FAQ** | `/faq` | ❌ | ❌（PRD §4.10 に含まれず） | **新規論点（§4.4）** |
| **料金プラン** | `/subscription` | 🟡 `/b2b/pricing`（MVP も 404） | 🟡 §4.11 B2B LP（biz 決定待ち） | 同等議論、aglist 観測で具体化（§4.5） |
| 会社ランキング | `/leaderboard` | 🟡 `/leaderboard`（MVP 観測のみ） | 🟡 §4.4 の中（`/ranking` と差分未決） | 同等議論、Company 軸を明示化（§4.6） |
| トップ / 会社紹介 / 規約 / プライバシー | `/`, `/about-us`, `/terms`, `/privacy` | ✅ | 🟡 §4.10 | 同等 |
| ログイン後アプリ | `/app/*` | – | ✅ §4.1, §4.7-9 | 観測不能、要 Ryoga ログイン調査 |
| 運営管理画面 | `/admin/*` | – | 🔥 §I（workshop） | 観測不能、要追加調査 |

---

## 4. ギャップ詳細

### 4.1 Distributors（販売代理店）🔥

#### 4.1.1 aglist での実装観測
- 独立 entity として 40 社が登録
- URL: `/distributors`（一覧）、`/distributors/{slug}`（詳細）
- 例: `tep-inc`, `willard-agri-service`, `california-ag-solutions`, `countyline-ag`, `valley-ag`
- 観測範囲: 米国の地域農業協同組合・農業資材小売・農業コンサル

#### 4.1.2 ビジネス的な意味
- **「どこで買えるか」** の情報源 → 製品ページから distributor へ誘導 = 購買導線
- メーカー → distributor → 農家の **商流データ** をプラットフォーム上で可視化
- 日本では **JA、農薬卸（ホクレン、全農、地域 JA）、農業資材販売店** に相当
- Farmille の `ja_staff` ロール（既存）と関連が深いが、**JA とは別概念**（JA は組織内ロール、distributor は組織エンティティ）

#### 4.1.3 想定データモデル
```
distributors:
  id, name, slug, logo_url, headquarters, regions_served, contact_url,
  product_carry (中間テーブル: distributor_products [distributor_id, product_id])
```

#### 4.1.4 v1 含めるかの判断材料
- **Pro**: 「どこで買える」は農家の購買決定で重要、メーカーへの価値も大きい
- **Con**: 商流データの収集が重い（メーカーから提供を受ける必要、distributor 側の同意も）
- **Pro**: DB 設計は軽量（既存 `maker_profiles` のテンプレ流用可能）
- **Con**: v1 スコープには「メーカー & 農家」を集める優先度が高い、distributor 集めは v1.5+ で十分

**Claude 推奨**: **v1.5 以降に延期、v1 は「メーカーから直接購入」または「メーカー Web サイトリンク」で代替**。
ただしデータモデルだけは v1 で先に作っておくと将来移行しやすい。

#### 4.1.5 議論論点
- distributor 一覧を v1 に含めるか
- 含める場合、登録方法（メーカーが推薦 / distributor 自己登録 / 運営手動）
- 製品 → distributor の紐付けデータをどう集めるか
- 日本市場では JA / 農薬卸 / 農業資材店をどう区分するか

---

### 4.2 Partners（メディア / 戦略パートナー）⚠️

#### 4.2.1 aglist での実装観測
- 独立 entity として 4 社のみ（厳選）
- URL: `/partners`（一覧）、`/partner/{slug}`（詳細、**singular**）
- 例: `biome-makers`（biological 計測サービス）、`newleaf-symbiotics`（biological メーカー）、`the-modern-acre`（agritech ポッドキャスト）

#### 4.2.2 ビジネス的な意味
- **メディア提携 / 戦略提携の露出枠**
- aglist にとっては「権威付け」「ネットワーク示唆」の役割
- "biome-makers" "newleaf-symbiotics" は manufacturer にも登録あり → **プレミアム露出**

#### 4.2.3 v1 含めるかの判断材料
- **Pro**: ローンチ時の信頼性向上に寄与（"○○と提携"）
- **Con**: 提携先がそもそも存在しない初期段階では空ページになる
- **Con**: メーカー / 代理店との区別が曖昧、IA を複雑化させる

**Claude 推奨**: **v1 では不採用、v1.5+ で提携先が増えてから検討**。
代替: `/about` ページ内に「提携・支援団体」セクションを置けば十分。

---

### 4.3 Blog / Newsroom ⚠️

#### 4.3.1 aglist での実装観測
- 6 記事のみ
- URL: `/blogs`（一覧）、`/blog/{slug}`（詳細）
- 全記事タイトルから読み取れるテーマ:
  - メーカー向けマーケティングガイド
  - 業界トレンド（"agricultural biologicals boom"）
  - 農家からの推薦が売上に与える効果
- **読者ターゲット**: メーカー、ag-tech マーケター、業界関係者
- **農家向けの「使い方ガイド」系は無し**

#### 4.3.2 ビジネス的な意味
- **SEO 流入の獲得**（業界キーワード）
- **Subscription への送客**（メーカーに「Farmille / aglist の価値」を伝える長尺コンテンツ）
- **権威性の構築**（業界レポート発信）

#### 4.3.3 v1 含めるかの判断材料
- **Pro**: SEO 上の長期資産、メーカー獲得の販促ツール
- **Con**: 記事執筆の運用コストが大きい（誰が書く？月何本？）
- **Con**: ローンチ初期は「製品 + レビュー」のコンテンツに集中すべき

**Claude 推奨**: **v1 は不採用、v1.5 で月 1〜2 記事から開始**。
代替（v1）: ローンチ告知記事 1 本だけ `/about` 配下に置く（"Farmille サービス開始に寄せて"）

---

### 4.4 FAQ（独立ヘルプセンター）💡

#### 4.4.1 aglist での実装観測
- `/faq` 単一ページとして存在
- カテゴリ分類や質問数は本文取得不能のため不明

#### 4.4.2 ビジネス的な意味
- ユーザーの自己解決率を上げ、`/contact` への問い合わせを減らす
- ローンチ初期は不要だが、ユーザー数が増えると必須

#### 4.4.3 v1 含めるかの判断材料
- **Pro**: 静的コンテンツのみで実装軽量
- **Con**: ローンチ前に「想定 FAQ」を書くのは予測作業
- **Pro**: `/contact` の負担軽減

**Claude 推奨**: **v1 は不要、ローンチ後 1-2 ヶ月の問い合わせを集計して FAQ 化（v1.5）**。
代替（v1）: `/contact` ページに「よくあるご質問」セクションを 5-10 個だけ置く（FAQ ページは作らない）

---

### 4.5 Subscription（料金プラン）⚠️

#### 4.5.1 aglist での実装観測
- `/subscription` 単一ページ
- 内容（プラン構成、価格、機能差）は本文取得不能
- 既存ブログ記事「go-to-market-guide-ag-biologicals」の存在から、**メーカー有料サブスク** が中心と推定

#### 4.5.2 Farmille の対応状況
- PRD §4.11 で `/b2b/pricing` を未確定として記載
- MVP は `/b2b` 自体が 404
- workshop §G で「v1 含めるか / v1.5 か」を biz 議論論点としている

#### 4.5.3 aglist 観測から得られる示唆
- 単一ルート `/subscription` で完結している（複雑な料金ページではない可能性）
- aglist は "subscription" 命名 → 月額/年額 サブスク モデル
- メーカーが主な対象（partners と blog テーマがメーカー向け）

#### 4.5.4 Claude 追加提言（既存 §G に補足）
- v1 は **「無料プラン」のみ表示の `/subscription` ページを置く**（aglist 命名を踏襲しつつ実体は無料）
- 課金導線（決済）は v1.5 以降
- メーカー有料化は PRD §8.11 メーカー分析ダッシュボードと連動

---

### 4.6 Leaderboard（会社ランキング）⚠️

#### 4.6.1 aglist での実装観測
- ページタイトル: **"Top Ag Biological Companies & Rankings | AgList Leaderboard"**
- → **会社（メーカー）ランキング** が主軸、製品ランキングではない

#### 4.6.2 既存 Farmille 議論との接続
- workshop §C で `/ranking` と `/leaderboard` の差分が未決
- aglist 観測により以下の **強い候補** が出る:
  - `/ranking` = **製品ランキング**（★評価の高い製品 TOP 10）
  - `/leaderboard` = **メーカーランキング**（自社製品の総合評価が高いメーカー TOP 10）

#### 4.6.3 ビジネス的な意味（メーカーランキングの価値）
- **メーカー側の登録動機を強化**: 「ランキング上位を目指してレビュー獲得」
- **農家側**: 「信頼できるメーカー」の発見導線
- **「インセンティブ設計」（PRD §6 やらない）との境界**: ランキング表示自体は集計の可視化、報酬は無し

#### 4.6.4 Claude 推奨（workshop §C への追記）
- `/ranking` = 製品 TOP 10（★評価平均）
- `/leaderboard` = メーカー TOP 10（自社製品の総合★評価平均、最低製品数フィルタあり）
- 二段構えで両方 v1 実装可能（DB 集計のみ、UI も類似）

---

## 5. 周辺観察（戦略・データ設計の示唆）

### 5.1 カタログ規模の比較

| 指標 | aglist | Farmille v1 KPI | 倍率 |
|---|---|---|---|
| 製品数 | 228 | 30 | 7.6 倍 |
| メーカー数 | 700+ | 10 | 70 倍 |
| 代理店数 | 40 | – | – |
| ブログ記事数 | 6 | – | – |

**示唆**: aglist は数年運用された蓄積。Farmille v1 直後の比較ではなく、**v3+ の到達目標**として参考。

### 5.2 ビジネスモデルの違い

| 観点 | aglist | Farmille v1 |
|---|---|---|
| 収益源 | メーカー subscription（推定） | なし（無料） |
| 主な顧客 | メーカー（B2B） | 農家 + メーカー（両側） |
| コンテンツ戦略 | メーカー向けマーケ blog | 農家レビュー集積 |
| 言語 / 市場 | 英語 / 北米中心 | 日本語 / 国内中心 |
| 「中立性」の建付け | メーカーから集金しつつ製品評価を出す | 農家無料・メーカー無料、v2 でメーカー有料化 |

**示唆**: aglist の機能を完全模倣すると、**ビジネスモデルも自然と aglist 寄り**になる（特に subscription / blog）。Farmille は「中立的情報インフラ」のポジション（PRD §9.3）を維持するなら、機能採否でフィルタが必要。

### 5.3 製品メタデータ拡張余地（formulation type）

aglist の製品 slug から確認できた formulation type 略号:
- `WG` = Wettable Granule（水和顆粒）
- `WP` = Wettable Powder（水和剤）
- `SC` = Suspension Concentrate（フロアブル）
- `LC` = Liquid Concentrate（液剤）
- `XLV`, `HP` = メーカー独自バリエーション

**Farmille での扱い**:
- 現状 PRD では未定義
- `products` テーブルに `formulation_type` カラム追加（v1 でも軽量）
- フィルタ軸として有効（農家は剤型で散布方法を判断する）

**Claude 推奨**: **v1 で `products.formulation_type` カラムを追加**（任意項目、メーカー登録時に選択）。マスタは初期 5-7 件で十分。

### 5.4 シリーズ製品の管理

aglist では `biotrinsic-*`, `rootella-*` のように **同シリーズの派生製品** が多数登録されている（biotrinsic で 7 件、rootella で 7 件）。

**Farmille での示唆**:
- 「シリーズ」エンティティを作るかどうか（`product_series` テーブル）
- 派生製品は別 product として扱う or グループ化
- v1 は別 product でフラットに登録、v1.5 でシリーズ概念を導入

**Claude 推奨**: **v1 はフラット**、v1.5 でシリーズ概念追加。

---

## 6. biz 議論への接続

### 6.1 `feature-definition-workshop.md` への追記提案

| workshop の論点 | aglist 観測からの追記 |
|---|---|
| §C ランキング | `/leaderboard` = メーカー TOP 10 として明確化（§4.6 参照） |
| §G B2B LP / 料金 | `/subscription` 命名採用、v1 は無料プラン表示のみ（§4.5 参照） |
| §H 静的ページ | FAQ は v1 不要、`/contact` 内 5-10 件で代替（§4.4 参照） |

### 6.2 新規論点として追加候補（workshop に §J 以降として追加）

| 新論点 | 内容 | 緊急度 |
|---|---|---|
| **§J. Distributors（販売代理店）** | v1 / v1.5 / 不採用 + データモデル方針 | ⚠️ 中（§4.1） |
| **§K. Partners（メディア/戦略パートナー）** | v1 / v1.5 / 不採用 | 💡 低（§4.2） |
| **§L. Blog / Newsroom** | v1 / v1.5 / 不採用 + 運用主体 | 💡 低（§4.3） |
| **§M. 製品メタデータ拡張（formulation type, シリーズ等）** | DB スキーマ拡張 | 💡 低（§5.3, §5.4） |

### 6.3 PRD §6「やらない」候補追加

biz 議論で「v1 採用しない」確定したものは PRD §6 に追加:
- Distributors（v1 不採用、v1.5 検討）
- Partners（v1 不採用、v1.5 検討）
- Blog（v1 不採用、v1.5 検討）

### 6.4 PRD §8「v2 候補」更新

- §8.13（新規）: **Distributors / 商流データ機能** — 製品 → 代理店 → 農家の購買導線可視化
- §8.14（新規）: **コンテンツマーケ（Blog / 業界レポート）** — SEO + メーカー販促

---

## 7. 次のアクション

### 7.1 short-term（biz 議論に向けて）
- [ ] 本書を `feature-definition-workshop.md` と一緒に Google Doc 化して 3 名共有
- [ ] workshop §C / §G / §H に §4.4-4.6 の補足情報を反映するか biz 確認
- [ ] 新規論点 §J-§M を workshop に追加するか biz 確認

### 7.2 mid-term（Ryoga aglist ログイン後）
- [ ] Ryoga が `/app/*` を確認、本書 §0.3 の制約を解消
- [ ] ログイン後機能（マイページ、メーカー管理、レビュー投稿、検索体験）の調査結果を本書 §8 として追加
- [ ] その時点で **検索フロー議論**（保留中）を workshop に §K として追加

### 7.3 long-term（spec 起草時）
- [ ] §5.3 formulation type の DB スキーマ拡張 ADR
- [ ] §4.6 メーカーランキング集計の SQL 設計
- [ ] aglist の Bubble.io 実装が参考になる UI パターンを `design-mvp-analysis.md` に補足取り込み

---

## 付録 A: 観測した aglist URL の完全リスト

### A.1 公開ルート
```
/                          トップ
/products                  製品一覧
/products/{slug}           製品詳細（228 件）
/manufacturers             メーカー一覧
/manufacturers/{slug}      メーカー詳細（700+ 件）
/distributors              販売代理店一覧
/distributors/{slug}       販売代理店詳細（40 件）
/partners                  パートナー一覧
/partner/{slug}            パートナー詳細（4 件、singular）
/leaderboard               メーカーランキング
/blogs                     ブログ一覧
/blog/{slug}               ブログ記事（6 件）
/faq                       FAQ
/about-us                  会社紹介
/contact                   お問い合わせ
/terms                     利用規約
/privacy                   プライバシーポリシー
/subscription              料金プラン
```

### A.2 非公開ルート（robots.txt より）
```
/app                       ログイン後アプリ本体
/admin                     運営管理画面
/api                       内部 API
/version-test              Bubble.io テスト環境
/landscape-embed           埋め込みウィジェット
/biocontrol-landscape-embed 埋め込みウィジェット
```

### A.3 サブサイトマップ
```
/sitemap-products.xml      製品一覧ルート
/sitemap-product.xml       製品詳細（228 件）
/sitemap-manufacturers.xml メーカー一覧ルート
/sitemap-manufacturer.xml  メーカー詳細（700+ 件）
/sitemap-distributors.xml  代理店一覧ルート
/sitemap-distributor.xml   代理店詳細（40 件）
/sitemap-partners.xml      パートナー一覧ルート
/sitemap-partner.xml       パートナー詳細（4 件）
/sitemap-blogs.xml         ブログ一覧ルート
/sitemap-blog.xml          記事詳細（6 件）
/sitemap-faq.xml           FAQ
/sitemap-about-us.xml      会社紹介
/sitemap-contact.xml       お問い合わせ
/sitemap-terms.xml         利用規約
/sitemap-privacy.xml       プライバシーポリシー
/sitemap-subscription.xml  料金プラン
/sitemap-leaderboard.xml   リーダーボード
```

---

**以上**

本書は Ryoga が aglist にログインして `/app/*` 以下を確認した時点で、§8（ログイン後機能の追加調査）を追記して更新する想定。
