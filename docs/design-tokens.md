# Farmille デザインドック v2

> **改訂方針**: 公式コーポレートサイト [farmille.com](https://farmille.com/) の実装値に揃える。v1（SmartHR/freee 風の控えめ路線）から、**モダンで余白豊か・大きめタイポ・大きめ角丸・springy なインタラクション**の路線へ転換。

---

## 0. 適用範囲と移行方針

- 本 v2 は **Phase 17 以降の新規 UI** で全面採用。既存ページ（/products / /home / /onboarding 等）は globals.css の CSS 変数を更新することで自動的に色味が追従する
- 既存 UI の細部（角丸サイズ・hero タイポ・カード余白）まで揃える「リフレッシュ phase」は Phase 17–19 完了後に別 phase で検討
- v1 で禁止していた `rounded-xl` 以上は **本 v2 で解禁**（farmille.com が `--radius-lg: 20px` / `--radius-xl: 28px` を多用しているため）

## 1. デザイン原則

1. **信頼性と専門性** — 農業分野の専門家が安心して利用できる、堅実な情報設計
2. **普遍的な使いやすさ** — 20代〜60代以上の幅広い農家が直感的に操作できる
3. **モダンで余白豊かな体験** — 詰め込まず、写真・コピー・余白で「現代的なプロダクト」感を出す
4. **農業の一次情報を前面に** — 圃場写真・農家の顔写真・実データを主役にし、UI は引き立て役

## 2. カラーパレット

メインカラーは **深く落ち着いた緑**（`#2d7a4f`）。背景は純白基調、テキストは Tailwind gray スケールに整合。

| 用途 | Tailwind / CSS 変数 | Hex 値 | 使用箇所 |
| :--- | :--- | :--- | :--- |
| **緑系（ブランド）** | | | |
| プライマリ | `--green-primary` / `bg-primary` | `#2d7a4f` | CTA / アクティブ要素 / リンク |
| プライマリ（ライト） | `--green-light` | `#3a9963` | hover アクセント・ハイライト |
| プライマリ（ダーク） | `--green-dark` | `#1e5c3a` | アクティブ／押下状態 |
| プライマリ（サブトル） | `--green-subtle` | `#e8f5ee` | 緑タグ背景・選択中行 |
| プライマリ（グロー） | `--green-glow` | `rgba(45, 122, 79, 0.1)` | focus ring・hover shadow tint |
| **背景** | | | |
| ページ背景 | `--bg` / `bg-background` | `#ffffff` | body 背景 |
| カード背景 | `--card` | `#f8f9fa` | カード・パネル |
| カード hover | `--card-hover` | `#f0f2f5` | hover 時のカード |
| **ボーダー** | | | |
| 標準ボーダー | `--border` / `border` | `#e5e7eb` | 入力欄・カード境界 |
| ボーダー hover | `--border-hover` | `#d1d5db` | hover 時の強調 |
| **テキスト** | | | |
| プライマリ | `--text-primary` / `text-foreground` | `#111827` | 見出し・本文の主要部 |
| セカンダリ | `--text-secondary` / `text-muted-foreground` | `#4b5563` | 説明文・サブテキスト |
| ミュート | `--text-muted` | `#9ca3af` | キャプション・disabled |
| 緑の上の文字 | `--text-on-green` | `#ffffff` | primary ボタンのラベル |
| **セマンティック** | | | |
| 成功 | `bg-success` | `#16a34a` | 成功トースト・完了表示 |
| 警告 | `bg-warning` | `#f59e0b` | 注意喚起バッジ |
| エラー | `bg-error` | `#dc2626` | エラー表示・destructive ボタン |

> v1 → v2 の差分: primary が `#3A7F5C` → `#2d7a4f`（より深く青寄り）、背景が `#F8F8F8` → `#ffffff`（純白）、テキストが `#333333` → `#111827`（Tailwind gray-900）に。

## 3. タイポグラフィ

- **欧文**: `Inter` (Google Fonts)
- **日本語**: `Noto Sans JP` (Google Fonts)
- font-stack: `"Noto Sans JP", "Inter", sans-serif`

farmille.com は **hero タイトルが非常に大きく重い**（68px / 900）。本文は読みやすさ重視で 15–16px。

| 用途 | Tailwind 目安 | 実値 | weight | line-height | letter-spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Hero（ランディング h1） | `text-6xl` 相当 | 68px | 900 | 1.25 (≒85px) | -0.02em |
| 大見出し（h1） | `text-4xl` | 36px | 800 | 1.4 | -0.02em |
| セクション見出し（h2） | `text-3xl` | 30px | 800 | 1.4 | -0.01em |
| サブ見出し（h3） | `text-xl` | 20px | 700 | 1.7 | normal |
| 小見出し（h4） | `text-lg` | 18px | 700 | 1.6 | normal |
| 本文（標準） | `text-base` | 16px | 400 | 1.7 | normal |
| 本文（密度高） | `text-[15px]` | 15px | 400 | 2.0 (≒30px) | normal |
| 補助テキスト | `text-sm` | 14px | 400 | 1.6 | normal |
| キャプション | `text-xs` | 12px | 400 | 1.5 | normal |

### font-feature-settings

```css
font-feature-settings: "palt" 1, "kern" 1, "tnum" 1;
```

日本語の約物詰め（palt）、欧文のカーニング（kern）、等幅数字（tnum）。

## 4. スペーシング

Tailwind の標準スケールを採用。**farmille.com は余白を大きめに取る**ため、セクション間は `py-16` 〜 `py-24` をデフォルトに。

採用値（rem 基準）:

- `0` (0px)
- `0.5` (2px) — アイコン微調整
- `1` (4px)
- `2` (8px) — リスト垂直余白
- `3` (12px) — カード内要素間
- `4` (16px) — 標準パディング
- `5` (20px)
- `6` (24px) — セクション内ブロック間
- `8` (32px)
- `10` (40px)
- `12` (48px) — フッター内余白
- `16` (64px) — セクション間（モバイル）
- `20` (80px)
- `24` (96px) — セクション間（デスクトップ）

奇数値（7/9/11）と未定義の大きい値は使わない（一貫性維持）。

## 5. Border Radius

v1 で禁止していた `rounded-xl` 以上を **解禁**。farmille.com は丸みを柔らかさの表現として積極利用。

| 名前 | CSS 変数 | 値 | 用途 |
| :--- | :--- | :--- | :--- |
| sm | `--radius-sm` | 8px | 入力欄・小タグ・小ボタン |
| md | `--radius-md` | 12px | 標準ボタン・チップ・小カード |
| lg | `--radius-lg` | 20px | カード・モーダル・パネル |
| xl | `--radius-xl` | 28px | ヒーロー画像・大カード・コンテナ |
| full | `--radius-full` | 9999px | アバター・ピル型ボタン・タグ |

> v1 では「rounded-xl 以上禁止」だったが、farmille.com 公式が `28px` を使っているため**解禁**。ただし「無闇に最大値を使わない」原則は維持。サイズは要素の物理サイズに比例させる（小要素 = sm、大コンテナ = xl）。

## 6. Shadow

控えめだが、要素の階層を明確に。3 段階を許容。

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
```

- **sm**: ボタン hover、カード hover の微浮き
- **md**: ドロップダウン、ポップオーバー、トースト
- **lg**: モーダル、注目カード（hero など）

複数 shadow の重ねがけは禁止。`xl` 以上は使わない。

## 7. トランジション / アニメーション

farmille.com は「**spring 系の柔らかい動き**」を採用。3 段階を定義。

```css
--transition-fast:   0.2s cubic-bezier(0.4, 0, 0.2, 1);    /* hover, focus */
--transition-smooth: 0.4s cubic-bezier(0.4, 0, 0.2, 1);    /* modal, drawer */
--transition-spring: 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); /* CTA、注目要素 */
```

- 標準 hover: `transition: all var(--transition-fast)`
- モーダル開閉: `var(--transition-smooth)`
- 重要 CTA・成功フィードバック: `var(--transition-spring)`（少し弾む）

過剰なアニメーションは引き続き禁止。「派手」より「軽やか」。

## 8. アイコン

- **ライブラリ**: `lucide-react`（v1 から継続）
- **サイズ**: 16 / 20 / 24 / 32px
- **色**: 原則 `currentColor` でテキスト色に追従。プライマリ強調時のみ `text-primary`

## 9. コンポーネント方針（shadcn/ui）

shadcn/ui をベースにし、本ドックの値で**初期化**する:

- 色: `globals.css` の CSS 変数を本ドックの 16進値から HSL に変換して上書き
- 角丸: `--radius: 12px`（shadcn デフォルト）に揃える
- フォント: `tailwind.config` で `fontFamily.sans` を Noto Sans JP + Inter に
- ボタンの primary: `bg-primary text-white hover:bg-[var(--green-dark)] transition-[var(--transition-fast)]`

独自 variant の追加条件（v1 から継続）:
- 明確な目的 / 再利用性 / ドキュメント化

## 10. 禁止事項（v2 改訂版）

1. **高彩度な原色の多用** — 鮮やかすぎる緑/黄色/ピンク等で「子供っぽい/カジュアルすぎる」印象を作らない
2. **読みにくいフォント** — 装飾性の高いフォントは避ける。本文は必ず Noto Sans JP / Inter
3. **手書き風・ポップなイラスト** — シンプルなフラットイラストか、写真主体で
4. **過剰なアニメーション** — `var(--transition-spring)` でも 0.6s 以内に収める
5. **コントラストの低い配色** — テキスト/背景は WCAG AA 以上（4.5:1）を死守
6. **不統一なスペーシング** — §4 の採用値以外は使わない
7. **複雑なシャドウ** — `xl` 以上、複数 shadow の重ねがけは禁止
8. **情報過多なレイアウト** — 1 画面に詰め込まず、余白で呼吸させる
9. **`rounded-xl` 以上の根拠なき多用** — v2 で解禁したが「全要素で xl」は禁止。要素サイズに比例させる

## 11. CSS 変数定義（globals.css 雛形）

```css
@layer base {
  :root {
    /* === Brand === */
    --green-primary: #2d7a4f;
    --green-light:   #3a9963;
    --green-dark:    #1e5c3a;
    --green-subtle:  #e8f5ee;
    --green-glow:    rgba(45, 122, 79, 0.1);

    /* === Surface === */
    --bg:           #ffffff;
    --card:         #f8f9fa;
    --card-hover:   #f0f2f5;
    --border:       #e5e7eb;
    --border-hover: #d1d5db;

    /* === Text === */
    --text-primary:   #111827;
    --text-secondary: #4b5563;
    --text-muted:     #9ca3af;
    --text-on-green:  #ffffff;

    /* === Radius === */
    --radius-sm:   8px;
    --radius-md:  12px;
    --radius-lg:  20px;
    --radius-xl:  28px;
    --radius-full: 9999px;

    /* === Transition === */
    --transition-fast:   0.2s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-smooth: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-spring: 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

    /* === Shadow === */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
    --shadow-lg: 0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);

    /* === shadcn/ui ブリッジ（HSL 表記、shadcn パターンと互換） === */
    --background: 0 0% 100%;
    --foreground: 220 13% 9%;        /* #111827 */
    --muted: 210 14% 97%;            /* #f8f9fa */
    --muted-foreground: 220 9% 35%;  /* #4b5563 */
    --card-h: 0 0% 100%;
    --card-foreground: 220 13% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 13% 9%;
    --primary: 148 47% 33%;          /* #2d7a4f */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 14% 97%;
    --secondary-foreground: 220 13% 9%;
    --accent: 145 47% 93%;           /* #e8f5ee */
    --accent-foreground: 148 50% 24%;/* #1e5c3a */
    --destructive: 0 72% 51%;        /* #dc2626 */
    --destructive-foreground: 0 0% 100%;
    --ring: 148 47% 33%;
    --radius: 0.75rem;               /* 12px */
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: 'Noto Sans JP', 'Inter', sans-serif;
    font-feature-settings: "palt" 1, "kern" 1, "tnum" 1;
  }
}
```

## 12. 適用チェックリスト（Phase 17 以降の新規 UI）

実装時に通すチェック:

- [ ] 色: §2 の CSS 変数のみを使用（直書き hex 禁止）
- [ ] タイポ: §3 のスケールに合致するクラスを使用
- [ ] 余白: §4 の採用値のみ（奇数 / 未定義値禁止）
- [ ] 角丸: §5 の 5 段階のみ
- [ ] シャドウ: §6 の 3 段階のみ
- [ ] トランジション: §7 の 3 段階のみ
- [ ] フォント: Noto Sans JP / Inter（他フォント混入禁止）
- [ ] WCAG AA: 主要テキスト/背景のコントラスト 4.5:1 以上
- [ ] mobile-first: 小画面でも詰まらない、tap target 最低 44px

---

**改訂履歴**:
- v1 (2026-04-XX): SmartHR/freee 風、控えめ路線（廃止）
- v2 (2026-05-11): farmille.com 公式サイト準拠、モダン余白豊か路線（本版）
