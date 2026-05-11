# Farmille MVP デザイン調査依頼プロンプト

**作成日**: 2026-04-28
**目的**: MVP（https://farmille-mvp.vercel.app/）の視覚デザインを画像認識可能な AI に調査してもらい、本リポの `docs/design-tokens.md` を MVP 同等のクオリティに引き上げる
**渡す相手**: 画像/スクショを取得・解釈できる AI（GPT-5 / Gemini / Claude with vision 等）
**前提**: Farmille は Next.js 15 / Tailwind CSS 4 / Vercel。Noto Sans JP 採用。primary 色 `#3A7F5C`

---

## 使い方

1. 下のコードブロック内のプロンプトを丸ごとコピー
2. 画像認識可能な AI（Claude Web / ChatGPT / Gemini など）に貼る
3. AI が DOM/スクショを自動取得できないと言った場合、Ryoga が以下のページのスクショを撮って添付:
   - `/`
   - `/bs-materials`
   - `/bs-materials/{任意のID}`
   - `/manufacturers`
   - `/ranking`
   - `/community`
   - 各ページのデスクトップ（1280px）+ モバイル（375px）合計 12 枚
4. 出力された Markdown を `docs/research/design-mvp-analysis.md` に保存（新規ディレクトリ）
5. 保存後、worker（Claude Code）に「`design-mvp-analysis.md` を `docs/design-tokens.md` に反映して」と依頼

---

## 別 AI に渡すプロンプト（ここから下をコピペ）

````
あなたは UI/UX デザイナーとして、以下の Web サイトの視覚デザインを精密に解析してください。
解析結果は、別チームが Tailwind CSS 4 ベースの Next.js プロジェクトで再現するために使います。
**推測ではなく実測値**で記載し、不明な箇所は「不明」と明記してください。

## 【調査対象 URL】
https://farmille-mvp.vercel.app/

## 【主要ページ】
- /                       （ランディング）
- /bs-materials           （資材一覧）
- /bs-materials/{任意のID} （資材詳細。一覧から 1 件選択）
- /manufacturers          （メーカー一覧）
- /manufacturers/denka    （メーカー詳細サンプル）
- /ranking                （ランキング）
- /community              （コミュニティ）

## 【調査方法】
- ブラウザは Chrome 想定
- ビューポート: デスクトップ 1280px / モバイル 375px の両方
- 余白・色は実測値（推測ではなく hex / rgba / px / rem）
- DevTools で要素検査して値を取得、または提供されたスクショから測定

## 【背景情報（再現側の制約）】
再現プロジェクトは以下の制約を持っています。実測値と乖離する場合はコメントしてください。
- フォント: Noto Sans JP（日本語）/ デフォルト（英数字）
- primary 色: #3A7F5C
- 角丸: rounded（4px）/ rounded-md（6px）のみ。rounded-xl（12px）以上は禁止
- フレームワーク: Tailwind CSS 4
- アクセシビリティ: WCAG AA 準拠（コントラスト比 4.5:1 以上）

## 【出力フォーマット】

以下の構造で **Markdown** を出力してください。

---

# Farmille MVP デザイン解析

## 1. カラーパレット

| 用途 | hex | RGB | コントラスト比 (vs 白) | 使用箇所 |
|---|---|---|---|---|
| primary | #XXXXXX | rgb(...) | X.X:1 | 主要 CTA、リンク等 |
| primary-hover | | | | |
| primary-active | | | | |
| secondary | | | | |
| accent | | | | ★評価アイコン等 |
| background-primary | | | | ページ背景 |
| background-secondary | | | | カード背景 |
| background-muted | | | | hover 時の背景 |
| text-primary | | | | 見出し・本文 |
| text-secondary | | | | サブテキスト |
| text-muted | | | | 補足・キャプション |
| text-inverse | | | | ボタン上の文字等 |
| border-default | | | | カード枠線 |
| border-strong | | | | 強調枠線 |
| star-filled | | | | ★評価塗り |
| star-empty | | | | ★評価空 |
| tag-bg-default | | | | カテゴリタグ背景 |
| tag-text-default | | | | カテゴリタグ文字 |
| tag-bg-effect | | | | 効果タグ背景（色違いがあれば別行） |
| success | | | | |
| warning | | | | |
| error | | | | |
| info | | | | |

## 2. タイポグラフィ

| 役割 | font-family | font-size (px / rem) | font-weight | line-height | letter-spacing |
|---|---|---|---|---|---|
| H1（ヒーロー） | | | | | |
| H2（セクション見出し） | | | | | |
| H3（カード見出し） | | | | | |
| H4（小見出し） | | | | | |
| body-lg | | | | | |
| body（標準本文） | | | | | |
| body-sm | | | | | |
| caption / small | | | | | |
| label / nav | | | | | |
| button | | | | | |
| price / 数値強調 | | | | | |

英数字と日本語で別フォント指定があれば併記。
モバイル（375px）でフォントサイズが変わる場合は別表で明記。

## 3. スペーシング（Tailwind スケールにマッピング）

| トークン | 値（px / rem） | Tailwind 対応 | 使用箇所 |
|---|---|---|---|
| xs | 4px / 0.25rem | space-1 | |
| sm | 8px / 0.5rem | space-2 | |
| md | 16px / 1rem | space-4 | |
| lg | 24px / 1.5rem | space-6 | |
| xl | 32px / 2rem | space-8 | |
| 2xl | 48px / 3rem | space-12 | |
| 3xl | 64px / 4rem | space-16 | |

| 場面 | 値 |
|---|---|
| section padding（縦、デスクトップ） | |
| section padding（横、デスクトップ） | |
| section padding（縦、モバイル） | |
| section padding（横、モバイル） | |
| container max-width | |
| card padding | |
| card gap (grid) | |
| ボタンの padding | |
| 入力フォームの padding | |

## 4. 角丸・シャドウ・ボーダー

| 用途 | border-radius | box-shadow | border |
|---|---|---|---|
| ボタン（primary） | | | |
| ボタン（secondary） | | | |
| 入力フォーム | | | |
| カード | | | |
| モーダル / ポップオーバー | | | |
| 画像（サムネイル） | | | |
| アバター | | | |

## 5. レイアウト

各主要ページについて、観測した値を記載。

### / （ランディング）
- セクション一覧（上から順）
- ヒーロー: テキスト/画像/CTA の配置、テキスト max-width、CTA ボタンの形状
- ヒーローのグリッド比率（テキスト:画像）
- セクションの max-width（コンテナ幅）
- 確認できたブレークポイント（sm / md / lg / xl の px）

### /bs-materials
- グリッドのカラム数（375px / 768px / 1024px / 1280px それぞれ）
- カード内部レイアウト（画像位置・テキストブロック・タグ配置・CTA 位置）
- フィルタ UI の配置（左サイドバー / 上部バー / モバイル時はドロワー？）
- 検索ボックスの位置と幅

### /bs-materials/{id}（資材詳細）
- ヒーロー部の構造（画像ギャラリー位置、製品名・メーカー・★評価の並び）
- タブ or アコーディオン構造の有無
- レビュー一覧の表示形式（カード / リスト）
- レビュー投稿フォームの位置

### /manufacturers
- 一覧グリッドのカラム数
- カード内部レイアウト

### /manufacturers/{slug}
- メーカープロフィール部の構造
- 自社製品一覧の表示形式

### /ranking
- 順位表示のスタイル（数字バッジ / 大きさ / 色）
- TOP3 と TOP4-10 で見せ方が違うか

### /community
- グループカードのレイアウト
- グループ詳細ページがあれば、その構造

## 6. インタラクション（観測できる範囲で）

| 要素 | hover 効果 | active 効果 | focus 効果 | transition |
|---|---|---|---|---|
| ボタン（primary） | | | | |
| ボタン（secondary） | | | | |
| カード | | | | |
| リンク（インライン） | | | | |
| ナビアイテム | | | | |
| タグ | | | | |
| ★評価 | | | | |

ローディング表示の形（spinner / skeleton / progress bar）と発生場面。

## 7. アイコン・ロゴ・装飾

- アイコンライブラリ推定（Lucide / Heroicons / Material Icons / Tabler / 独自）
- アイコンの平均サイズ（標準/小/大）
- 装飾モチーフ（観測した「❁」花アイコンなど。出現場所と頻度）
- ロゴ仕様:
  - マーク + 文字組みの構造
  - サイズバリエーション（ヘッダー用 / フッター用 / OGP 用）
  - 色バリエーション（明色背景 / 暗色背景）

## 8. レスポンシブ挙動

| ビューポート | グリッド変化 | ナビ形式 | フォントスケール変化 |
|---|---|---|---|
| 375px | カラム数: | ハンバーガー / 通常 | |
| 768px | | | |
| 1024px | | | |
| 1280px+ | | | |

## 9. ダークモード

- 対応の有無
- 対応している場合、各色のダーク版を §1 と同じ表で

## 10. 既存制約との整合性チェック

以下は再現側で採用済みの設計。MVP の実測値と比較して、**どこを既存に合わせ、どこを MVP に寄せるべきか**コメントしてください。

| 既存制約 | MVP 実測 | 推奨対応 |
|---|---|---|
| フォント: Noto Sans JP | | |
| primary: #3A7F5C | | |
| 角丸: rounded / rounded-md のみ | | |
| その他観測した制約違反 | | |

## 11. アクセシビリティ評価

- WCAG AA コントラスト比違反箇所（あれば全て列挙）
- フォーカスインジケータの視認性
- タップ領域（モバイル）が 44x44px 以上か
- 画像の alt 属性が適切か（観測範囲）

## 12. 推奨改修アクション（再現側プロジェクト向け）

以下を箇条書きで具体的に:

### 12.1 `docs/design-tokens.md` への追加・変更
- 追加すべき CSS カスタムプロパティ（名前と値）
- 変更すべき既存プロパティ
- 削除すべき不要プロパティ

### 12.2 Tailwind config への変更
- `theme.extend.colors` の更新内容
- `theme.extend.fontSize` の更新内容
- `theme.extend.spacing` の更新内容
- 必要なプラグイン

### 12.3 グローバル CSS への変更
- `globals.css` の更新内容
- フォント読み込み変更

### 12.4 アクセシビリティ改善ポイント
- WCAG AA 準拠のために primary 色や text 色の明度調整が必要なら明記
- フォーカスインジケータの設計

### 12.5 注意点
- 既存実装と MVP の差分のうち、**意図的に既存を維持すべき項目**（例: 角丸禁止ルール）
- **必ず MVP に寄せるべき項目**

---

## 【出力時の制約】

- 推測ではなく**実測値**で書く（hex / rgba / px / rem）
- スクショ取得時は viewport を明記
- 不明な箇所は「不明」と書き、推測を断定しない
- 計測ミス・取得不能時は理由とともに記載
- 全項目 Markdown テーブル / 箇条書きで記載
- コードブロックで囲める設定値（Tailwind config 等）はそのままコピペ可能な形で
````

---

## このプロンプトを渡す相手の選定

| AI | 推奨度 | 理由 |
|---|:---:|---|
| Claude（vision） | ◎ | 画像解析精度が高い、構造化出力が得意。スクショを Ryoga 側で撮って添付 |
| ChatGPT (GPT-5) + browse | ◎ | 自動でブラウジング可能。スクショ自動取得もできる |
| Gemini | ○ | 画像複数枚渡しに強い。Ryoga 側でスクショ撮影 |
| Figma AI / v0 等のデザイン系 | △ | 解析より生成寄り、本タスクには不向き |

---

## 出力の保存先と次のステップ

1. **保存先**: `docs/research/design-mvp-analysis.md`（新規ディレクトリ `docs/research/` を作る）
2. **保存後の依頼**: worker（Claude Code）に以下を依頼:
   - 「`docs/research/design-mvp-analysis.md` を読んで、`docs/design-tokens.md` を MVP 寄りに更新する PR を作成して」
   - worker は §10「既存制約との整合性」と §12「推奨改修アクション」を参考に、Tailwind config と globals.css を更新する

---

**以上**
