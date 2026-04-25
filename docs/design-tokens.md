# Farmille デザインドック

## 1. デザイン原則

1.  **信頼性と専門性**: 農業分野の専門家が安心して利用できる、堅実で信頼感のあるデザインを追求します。
2.  **普遍的な使いやすさ**: 20代から60代以上の幅広い年齢層の農家が直感的に操作でき、迷うことなく情報にアクセスできるインターフェースを提供します。
3.  **目に優しく洗練された体験**: 長時間の利用でも疲労を感じさせない、落ち着いた配色と適切な情報密度により、洗練されたユーザー体験を実現します。

## 2. カラーパレット

メインカラーは「緑」を基調とし、安っぽさを排除した深みのあるトーンを選定します。日本の農家が朝5時に見ても目に優しいよう、彩度を抑えつつも視認性を確保します。SmartHRやfreeeのような信頼感のある配色を参考に、プロフェッショナルな印象を与えます。

| 用途 | Tailwind クラス名 | Hex値 | 根拠・使用用途 |
| :--- | :--- | :--- | :--- |
| **ベースカラー** | | | |
| 背景（メイン） | `bg-background` | `#F8F8F8` | クリーンで視認性の高い背景色。白飛びを防ぎ、目に優しいトーン。 |
| 背景（サブ） | `bg-muted` | `#F0F0F0` | カードやセクションの背景に使い、情報の区切りを明確にする。 |
| テキスト（メイン） | `text-foreground` | `#333333` | 可読性を最優先した濃いグレー。黒に近いが、目に刺激を与えない。 |
| テキスト（サブ） | `text-muted-foreground` | `#666666` | 補助的な情報やキャプションに。メインテキストとのコントラストを保つ。 |
| ボーダー | `border` | `#DDDDDD` | 要素の区切りや入力フィールドの境界線に。主張しすぎず、視認性を確保。 |
| **プライマリカラー** | | | |
| プライマリ（メイン） | `bg-primary` | `#3A7F5C` | Farmilleのブランドを象徴する深みのある緑。ボタン、リンク、アクティブな要素に。信頼感と自然を表現。 |
| プライマリ（ホバー） | `bg-primary-hover` | `#2E6B4D` | プライマリカラーのホバー状態。インタラクションを明確にする。 |
| プライマリ（テキスト） | `text-primary` | `#3A7F5C` | プライマリカラーのテキスト。強調したい見出しやアイコンに。 |
| **セマンティックカラー** | | | |
| 成功 | `bg-success` | `#4CAF50` | 成功メッセージ、完了ステータスに。視覚的にポジティブな印象を与える。 |
| 警告 | `bg-warning` | `#FFC107` | 警告メッセージ、注意喚起に。視認性が高く、緊急性を伝える。 |
| エラー | `bg-error` | `#F44336` | エラーメッセージ、危険な操作に。明確に問題があることを示す。 |

## 3. タイポグラフィ

読みやすさと視認性を最優先し、特に日本語フォントは幅広い年齢層に受け入れられるものを選定します。欧文フォントはモダンで洗練された印象を与えつつ、日本語フォントとの調和を重視します。

-   **欧文フォント**: `Inter` (Google Fonts) - モダンで視認性が高く、Webでの利用に最適。
-   **日本語フォント**: `Noto Sans JP` (Google Fonts) - ウェイトが豊富で、可読性が高く、プロフェッショナルな印象を与える。

### スケール

| 用途 | Tailwind クラス名 | px値 (ベース16px) | 根拠 |
| :--- | :--- | :--- | :--- |
| 見出し1 | `text-5xl` | `48px` | ページの主要なタイトル。視覚的なインパクトと階層の最上位を示す。 |
| 見出し2 | `text-4xl` | `36px` | セクションタイトル。情報の区切りを明確にし、読み進めやすくする。 |
| 見出し3 | `text-3xl` | `30px` | サブセクションタイトル。情報の整理と視認性を両立。 |
| 見出し4 | `text-2xl` | `24px` | カードタイトルや小見出し。情報ブロックの開始を示す。 |
| 本文（大） | `text-lg` | `18px` | 読みやすい本文。特に高齢のユーザーにも配慮したサイズ。 |
| 本文（中） | `text-base` | `16px` | 標準的な本文。情報密度と可読性のバランス。 |
| 本文（小） | `text-sm` | `14px` | 補助的な情報や詳細。情報量を確保しつつ、メインコンテンツを邪魔しない。 |
| キャプション | `text-xs` | `12px` | 著作権表示、注釈など。最小限の視認性を保ちつつ、目立たせない。 |

### font-feature-settings

日本語の約物（句読点など）のぶら下がり処理や、数字の等幅処理を適用し、より美しい組版を実現します。

```css
font-feature-settings: "palt" 1, "kern" 1, "tnum" 1;
```

## 4. スペーシング

Tailwind CSSのrem値をベースに、モバイルファーストの原則に基づき、タップしやすい適切な余白と情報密度を両立させます。食べログのような「詰め込みすぎず、ゆとりと確実性」を重視し、視覚的なノイズを減らします。

**採用するTailwind値（rem基準）**

-   `0` (`0px`) - 要素間の密着
-   `px` (`1px`) - 細い線、最小の区切り
-   `0.5` (`2px`) - アイコンとテキストの微調整
-   `1` (`4px`) - 小さな要素間の余白
-   `2` (`8px`) - ボタンのパディング、リストアイテムの垂直方向の余白
-   `3` (`12px`) - カード内の要素間隔
-   `4` (`16px`) - 標準的なパディング、セクション間の最小余白
-   `5` (`20px`) - 中程度のパディング、要素間の区切り
-   `6` (`24px`) - セクション間の標準余白、主要な要素のパディング
-   `8` (`32px`) - 大きなセクション間の余白、主要な見出し下の余白
-   `10` (`40px`) - ページセクション間の余白
-   `12` (`48px`) - ページセクション間の大きな余白
-   `16` (`64px`) - ページトップやフッターの余白

**禁止値**: 上記以外の値は原則として使用しません。特に`7`, `9`, `11`などの奇数や、`13`以上の大きな値は、デザインの一貫性を損なうため使用を禁止します。

## 5. Border Radius

AgListのような「ポップすぎる」印象を避けるため、控えめで洗練された角丸を採用します。SmartHRやfreeeのような信頼感のあるデザインを参考に、柔らかさを保ちつつも堅実な印象を与えます。

-   `rounded-none` (`0px`) - 角丸なし
-   `rounded-sm` (`2px`) - 微細な角丸（入力フィールド、小さなタグ）
-   `rounded` (`4px`) - 標準的な角丸（ボタン、カード）
-   `rounded-md` (`6px`) - やや大きめの角丸（モーダル、画像）
-   `rounded-lg` (`8px`) - 大きめの角丸（主要なコンテナ、ヒーローセクション）

**禁止値**: `rounded-xl`以上の大きな角丸は、カジュアルすぎる印象を与えるため使用を禁止します。

## 6. Shadow

要素の浮き出しや階層を示すために、控えめで自然なシャドウを採用します。Linearのような洗練された印象を参考に、視覚的なノイズを最小限に抑えつつ、インタラクションのヒントを提供します。

-   **使用段階**: 2段階まで
    1.  **sm**: ホバー時や選択時の微細な浮き出し（例: ボタン、カードのホバー）
    2.  **md**: 要素の階層を示すためのシャドウ（例: ドロップダウンメニュー、モーダル）

**禁止事項**: `lg`以上の強いシャドウや、複数のシャドウを重ねることは、デザインの複雑性を増し、視覚的なノイズとなるため禁止します。

## 7. コンポーネント方針

### shadcn/ui との付き合い方

shadcn/uiをベースとして、開発速度と品質の安定性を確保します。ただし、Farmilleのブランドガイドラインに沿って、以下の調整を行います。

-   **カラー**: 本デザインドックで定義されたカラーパレットを適用します。
-   **タイポグラフィ**: 本デザインドックで定義されたフォントとスケールを適用します。
-   **スペーシング・角丸・シャドウ**: 本デザインドックで定義された値を適用します。
-   **基本コンポーネント**: `Button`, `Input`, `Card`, `Dialog`, `DropdownMenu`など、基本的なUI要素はshadcn/uiのものを積極的に採用し、上記デザイン原則に沿ってカスタマイズします。

### 独自variant追加の可否

必要に応じて、shadcn/uiの既存コンポーネントにFarmille独自のvariantを追加することを許可します。ただし、以下の条件を満たす必要があります。

-   **明確な目的**: 既存のvariantでは表現できない、特定のユースケースや状態を解決するために必要であること。
-   **再利用性**: 複数の箇所で再利用可能であり、汎用性があること。
-   **ドキュメント化**: 追加したvariantは、デザインドックまたは別途コンポーネントドキュメントに明確に定義し、チーム内で共有すること。

## 8. アイコン

### ライブラリ

`Lucide React` を採用します。モダンで視認性が高く、カスタマイズ性に優れているため、Farmilleの洗練されたデザインに調和します。

### サイズルール

アイコンのサイズは、以下のルールに基づき、視認性と一貫性を保ちます。

-   `16px` (sm): インラインテキスト、小さなリストアイテム
-   `20px` (md): 標準的なボタン、ナビゲーションメニュー
-   `24px` (lg): 主要なアクションボタン、セクションタイトル横
-   `32px` (xl): ヒーローセクション、特徴的な機能アイコン

## 9. 禁止事項

Farmilleのデザインにおいて、以下の要素は「日本人の農家さんが信頼してもらえるようなもの」という目標に反するため、厳に禁止します。

1.  **高彩度な原色の多用**: AgListのような明るすぎる緑や黄色など、目に刺激が強く、安っぽく見える配色は使用しない。
2.  **過度な角丸**: `rounded-xl`以上の大きな角丸は、カジュアルすぎる印象を与えるため使用しない。
3.  **手書き風・ポップなイラスト**: 親しみやすさを超えて、子供っぽい印象を与えるイラストは使用しない。イラストを使用する場合は、シンプルで洗練されたフラットデザインを基調とする。
4.  **過剰なアニメーション・トランジション**: ページの読み込み速度を低下させ、ユーザーの集中を妨げるような派手な動きは使用しない。必要な場合は、控えめでスムーズなものに限定する。
5.  **読みにくいフォント**: 装飾性の高いフォントや、細すぎる・太すぎるフォントは使用しない。特に本文では、可読性を最優先する。
6.  **情報過多なレイアウト**: 1画面に情報を詰め込みすぎず、適切な余白とグルーピングにより、視覚的な整理を徹底する。食べログのような情報密度を目指す場合でも、視覚的な階層を明確にする。
7.  **コントラストの低い配色**: テキストと背景のコントラストが低い配色は、視認性を損なうため使用しない。特に高齢のユーザーに配慮する。
8.  **不統一なスペーシング**: 定義されたスペーシングルール以外の値は使用しない。要素間の余白に一貫性を持たせる。
9.  **安易なグラデーション**: 不必要なグラデーションは、デザインの品位を損なうため使用しない。使用する場合は、非常に控えめで自然なものに限定する。
10. **複雑なシャドウ**: `lg`以上の強いシャドウや、複数のシャドウを重ねることは、視覚的なノイズとなるため使用しない。

## 10. CSS変数定義 (shadcn/ui globals.css 形式)

```css
@layer base {
  :root {
    --background: 220 14.3% 95.9%; /* #F8F8F8 */
    --foreground: 220 8.9% 10.8%;  /* #333333 */

    --muted: 220 14.3% 97.9%;      /* #F0F0F0 */
    --muted-foreground: 220 8.9% 39.2%; /* #666666 */

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 47.4% 11.2%;

    --border: 220 14.3% 89.9%;     /* #DDDDDD */
    --input: 220 14.3% 89.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;

    --primary: 150 40% 36%;       /* #3A7F5C */
    --primary-foreground: 210 20% 98%; /* 白に近い色 */

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;

    --ring: 224.3 76.3% 48%;

    --radius: 0.5rem; /* 8px */

    /* Semantic Colors */
    --success: 120 39% 59%;       /* #4CAF50 */
    --warning: 45 100% 50%;       /* #FFC107 */
    --error: 0 84% 60%;           /* #F44336 */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 20% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --popover: 217.2 32.6% 17.5%;
    --popover-foreground: 210 20% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --card: 217.2 32.6% 17.5%;
    --card-foreground: 210 20% 98%;

    --primary: 150 40% 36%;       /* #3A7F5C */
    --primary-foreground: 210 20% 98%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 20% 98%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 20% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;

    --ring: 217.2 32.6% 17.5%;

    /* Semantic Colors (Dark Mode Adjustments) */
    --success: 120 39% 45%;       /* #388E3C */
    --warning: 45 100% 40%;       /* #FFA000 */
    --error: 0 84% 50%;           /* #D32F2F */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Noto Sans JP', 'Inter', sans-serif;
    font-feature-settings: "palt" 1, "kern" 1, "tnum" 1;
  }
}
```

## 11. 色見本HTML

以下のHTMLファイルをブラウザで開くことで、定義されたカラーパレットを視覚的に確認できます。CDNからTailwind CSSを読み込んでいるため、単一ファイルで動作します。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Farmille Color Palette Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style type="text/tailwindcss">
        @layer base {
            :root {
                --background: 220 14.3% 95.9%;
                --foreground: 220 8.9% 10.8%;
                --muted: 220 14.3% 97.9%;
                --muted-foreground: 220 8.9% 39.2%;
                --primary: 150 40% 36%;
                --primary-foreground: 210 20% 98%;
                --border: 220 14.3% 89.9%;
                --success: 120 39% 59%;
                --warning: 45 100% 50%;
                --error: 0 84% 60%;
            }
            body {
                @apply bg-background text-foreground;
                font-family: sans-serif;
            }
        }
    </style>
</head>
<body class="p-8">
    <h1 class="text-3xl font-bold mb-8">Farmille Color Palette Preview</h1>

    <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Base Colors</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="p-4 rounded shadow bg-background border border-border">
                <div class="w-full h-24 bg-background border border-border mb-2"></div>
                <p class="font-semibold">Background</p>
                <p class="text-sm text-muted-foreground">`--background` #F8F8F8</p>
            </div>
            <div class="p-4 rounded shadow bg-muted border border-border">
                <div class="w-full h-24 bg-muted border border-border mb-2"></div>
                <p class="font-semibold">Muted Background</p>
                <p class="text-sm text-muted-foreground">`--muted` #F0F0F0</p>
            </div>
            <div class="p-4 rounded shadow bg-white border border-border">
                <div class="w-full h-24 bg-white border border-border mb-2"></div>
                <p class="font-semibold">White (for contrast)</p>
                <p class="text-sm text-muted-foreground">`#FFFFFF`</p>
            </div>
            <div class="p-4 rounded shadow bg-background border border-border">
                <div class="w-full h-24 bg-foreground mb-2"></div>
                <p class="font-semibold">Foreground Text</p>
                <p class="text-sm text-muted-foreground">`--foreground` #333333</p>
            </div>
            <div class="p-4 rounded shadow bg-background border border-border">
                <div class="w-full h-24 bg-muted-foreground mb-2"></div>
                <p class="font-semibold">Muted Foreground Text</p>
                <p class="text-sm text-muted-foreground">`--muted-foreground` #666666</p>
            </div>
            <div class="p-4 rounded shadow bg-background border border-border">
                <div class="w-full h-24 bg-border mb-2"></div>
                <p class="font-semibold">Border</p>
                <p class="text-sm text-muted-foreground">`--border` #DDDDDD</p>
            </div>
        </div>
    </div>

    <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Primary Colors</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded shadow bg-primary text-primary-foreground">
                <div class="w-full h-24 bg-primary mb-2"></div>
                <p class="font-semibold">Primary</p>
                <p class="text-sm">`--primary` #3A7F5C</p>
            </div>
            <div class="p-4 rounded shadow bg-primary-foreground text-foreground border border-border">
                <div class="w-full h-24 bg-primary-foreground border border-border mb-2"></div>
                <p class="font-semibold">Primary Foreground</p>
                <p class="text-sm text-muted-foreground">`--primary-foreground` #F2F2F2 (approx)</p>
            </div>
        </div>
    </div>

    <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Semantic Colors</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded shadow bg-success text-white">
                <div class="w-full h-24 bg-success mb-2"></div>
                <p class="font-semibold">Success</p>
                <p class="text-sm">`--success` #4CAF50</p>
            </div>
            <div class="p-4 rounded shadow bg-warning text-foreground">
                <div class="w-full h-24 bg-warning mb-2"></div>
                <p class="font-semibold">Warning</p>
                <p class="text-sm text-muted-foreground">`--warning` #FFC107</p>
            </div>
            <div class="p-4 rounded shadow bg-error text-white">
                <div class="w-full h-24 bg-error mb-2"></div>
                <p class="font-semibold">Error</p>
                <p class="text-sm">`--error` #F44336</p>
            </div>
        </div>
    </div>
</body>
</html>
```
