import type { SemanticTokens, Tokens } from "@pandacss/dev";

type DescribedToken = { value: string; description: string };
type DescribedTokens = { [name: string]: DescribedToken | DescribedTokens };

/** sp（767px 以下）は base。tab 以上は PC 寄りの UI にし、pc は 768px 幅で成立しない密度だけを持つ。 */
export const breakpoints = { tab: "768px", pc: "1024px" };

/**
 * Farmille のプリミティブトークン。
 * Panda の設定とトークンカタログが同じ元本を参照する。
 */
export const tokens = {
  blurs: {
    reportGate: { value: "4px" },
    // 画面の上下に固定する半透明の帯（アプリバー・下部ナビ・操作の帯）
    bar: { value: "10px" },
  },
  colors: {
    green: {
      50: { value: "#EBFAF1" },
      100: { value: "#D1F7E1" },
      200: { value: "#B2EBCB" },
      300: { value: "#91DFB5" },
      400: { value: "#6FD3A0" },
      500: { value: "#48C78D" },
      600: { value: "#41A476" },
      700: { value: "#238359" },
      800: { value: "#125035" },
      900: { value: "#031D11" },
    },
    blue: { value: "#1976D2" },
    teal: { value: "#1F9E95" },
    violet: { value: "#8B7BC0" },
    orange: { value: "#D97A2B" },
    terracotta: { value: "#C0705F" },
    star: { value: "#F5A623" },
    amber: {
      DEFAULT: { value: "#B26A00" },
      soft: { value: "#FFF4E0" },
    },
    bg: { value: "#FCFCFB" },
    panel: { value: "#FDFDFC" },
    card: { value: "#FFFFFF" },
    // ページ背景よりわずかに沈む灰色。影の代わりにカードの縁へ細く引く
    mist: { value: "#F7F7F5" },
    // ink 3段（本文 / 副文 / 補助）
    ink: { value: "#1E231F" },
    ink2: { value: "#4C534D" },
    ink3: { value: "#7C837D" },
    // line 2段
    line: {
      DEFAULT: { value: "#E7E5DE" },
      strong: { value: "#D8D6CD" },
    },
    // 危険操作色（T-22）
    danger: {
      DEFAULT: { value: "#C0392B" },
      soft: { value: "#FDECEC" },
    },
  },
  shadows: {
    overlay: { value: "0 0 1px rgba(0,0,0,.08), 0 8px 16px -2px rgba(0,0,0,.12)" },
    shadow: {
      DEFAULT: {
        value: "0 1px 2px rgba(30,35,31,.05), 0 4px 14px rgba(30,35,31,.06)",
      },
      lift: { value: "0 8px 30px rgba(30,35,31,.16)" },
      // 初回ログインの案内で光らせる枠。枠の外を暗くし、枠のふちを白く縁取る
      spotlight: { value: "0 0 0 9999px rgba(30,35,31,.45), 0 0 0 3px #FFFFFF" },
      // 写真の上に置く半透明の面。上辺の内側ハイライトでガラスの厚みを出す
      glass: {
        value: "inset 0 1px 0 rgba(255,255,255,.65), 0 10px 32px rgba(30,35,31,.18)",
      },
    },
  },
  radii: {
    banner: { value: "16px" },
    pill: { value: "999px" },
    card: { value: "14px" },
    button: { value: "12px" },
    // 画像枠。ボタンと同じ12pxだが、操作部品の角丸とは別の役割で持つ
    media: { value: "12px" },
    input: { value: "11px" },
    // 実証データの横棒グラフ
    bar: { value: "5px" },
    // 組織の頭文字など、文字を1字載せる小さな標章
    mark: { value: "6px" },
  },
  // 無効化した操作部品は形を保ったまま薄くする
  opacity: {
    disabled: { value: "0.6" },
    // チップや見出しに添える小さな分類のラベル
    label: { value: "0.65" },
  },
  // 画像枠は用途ごとに比率を固定し、画面幅や取得画像の寸法で高さを変えない。
  aspectRatios: {
    image: {
      square: { value: "1 / 1" },
      landscape: { value: "4 / 3" },
      wide: { value: "16 / 9" },
      portrait: { value: "3 / 4" },
    },
  },
  // 02 §5 の8段（9.5 / 11 / 12 / 14 / 16 / 18 / 20 / 21）に xs〜3xl 相当の名前を付与
  fontSizes: {
    "2xs": {
      value: "9.5px",
      description: "バッジ・カードの小さなラベル・グラフの目盛り。文には使わない。",
    },
    xs: { value: "11px", description: "日付・件数・出典などの注記と、注意書きの箱。" },
    sm: { value: "12px", description: "見出しや操作に添える副文。小さいボタンとチップのラベル。" },
    md: { value: "14px", description: "画面の本文と長文。ボタンと入力欄の文字。" },
    lg: { value: "16px", description: "カード・ダイアログ・節の見出し。" },
    xl: { value: "18px", description: "アプリバーの題名と、ページ内の大きめの小見出し。" },
    "2xl": { value: "20px", description: "記事・レポートの見出しと、統計の数値。" },
    "3xl": {
      value: "21px",
      description: "ページの題名（プロフィール名・規約・企業向けガイドの SP）。",
    },
    welcome: {
      value: "26px",
      description: "初回ログインの案内の最初のシート（Farmilleへようこそ）の見出し専用。",
    },
    display: {
      value: "38px",
      description:
        "評価平均の数値と、企業向けガイドの PC の題名。用途ごとに組み合わせが違うため役割にしない。",
    },
    // 通常UIの8段とは別枠で持つ
    hero: {
      DEFAULT: { value: "28px", description: "ホームのヒーロー見出し専用。SP の大きさ。" },
      md: {
        value: "44px",
        description:
          "ホームのヒーロー見出し専用。tab 以上の大きさ。この md はサイズの段名で、breakpoint ではない。",
      },
      lg: {
        value: "64px",
        description:
          "ホームのヒーロー見出し専用。pc 以上の大きさ。この lg はサイズの段名で、breakpoint ではない。",
      },
    },
  } satisfies DescribedTokens,
  // 公式npmパッケージをlayoutで読み込む（フォールバックは02 §5のスタック）
  fonts: {
    // Adobe Fonts のりょうゴシック PlusN B（weight 700）
    ryoGothic: {
      value: '"Gen Interface JP Latin", "ryo-gothic-plusn", var(--fonts-sans)',
    },
    // Adobe Fonts の Farmille Web プロジェクトで配信するゴシックMB101 L（weight 300）
    gothicMb101: {
      value: '"a-otf-gothic-mb101-pr6n", var(--fonts-sans)',
    },
    // material-icons パッケージの icon font。ligature で glyph を描く（共通 Icon が使う）
    materialIcons: { value: '"Material Icons"' },
    materialIconsOutlined: { value: '"Material Icons Outlined"' },
    sans: {
      value:
        '"Gen Interface JP", -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif',
    },
  },
  letterSpacings: { body: { value: "0.04em" } },
  // preset-panda の数値 spacing を明示し、既定色を復活させず余白スケールだけを維持する
  spacing: {
    0: { value: "0rem" },
    0.5: { value: "0.125rem" },
    1: { value: "0.25rem" },
    1.5: { value: "0.375rem" },
    2: { value: "0.5rem" },
    2.5: { value: "0.625rem" },
    3: { value: "0.75rem" },
    3.5: { value: "0.875rem" },
    4: { value: "1rem" },
    4.5: { value: "1.125rem" },
    5: { value: "1.25rem" },
    5.5: { value: "1.375rem" },
    6: { value: "1.5rem" },
    6.5: { value: "1.625rem" },
    7: { value: "1.75rem" },
    7.5: { value: "1.875rem" },
    8: { value: "2rem" },
    9: { value: "2.25rem" },
    10: { value: "2.5rem" },
    11: { value: "2.75rem" },
    12: { value: "3rem" },
    14: { value: "3.5rem" },
    16: { value: "4rem" },
    20: { value: "5rem" },
    24: { value: "6rem" },
    28: { value: "7rem" },
    32: { value: "8rem" },
    36: { value: "9rem" },
    40: { value: "10rem" },
    44: { value: "11rem" },
    48: { value: "12rem" },
    52: { value: "13rem" },
    56: { value: "14rem" },
    60: { value: "15rem" },
    64: { value: "16rem" },
    72: { value: "18rem" },
    80: { value: "20rem" },
    96: { value: "24rem" },
  },
  // コンテンツ用途ごとの上限幅。breakpoint 名を width 値へ流用しない。
  sizes: {
    reportGraph: {
      vertical: { value: "12rem" },
      horizontal: { value: "2.5rem" },
      plot: { value: "6rem" },
    },
    imagePreview: { value: "10rem" },
    // 短いラベルでも操作対象として横幅を確保する。
    button: {
      sm: { value: "96px" },
      md: { value: "120px" },
    },
    skeleton: {
      materialHero: { value: "118px" },
      text: { value: "16px" },
      short: { value: "12px" },
      title: { value: "24px" },
      avatar: { value: "32px" },
      thumbnail: { value: "62px" },
      control: { value: "44px" },
      count: { value: "96px" },
    },
    // 共通 Icon の寸法。画面では size variant から指定する。
    icon: {
      "2xs": { value: "12px" },
      xs: { value: "14px" },
      sm: { value: "16px" },
      md: { value: "20px" },
      lg: { value: "24px" },
      xl: { value: "28px" },
      "2xl": { value: "32px" },
    },
    card: {
      materialMobile: { value: "9.375rem" },
      material: { value: "15rem" },
    },
    // SP の確認幅。Story と開発用の見本を SP の幅で囲む
    phone: { value: "375px" },
    // 見つからない画面で、案内を画面の中ほどに置く高さ
    notFound: { value: "60dvh" },
    dialog: { value: "24rem" },
    // 初回ログインの案内（シート・吹き出し・帯）。PCでは文が1〜2行に収まる幅まで広げる
    guide: { value: "34rem" },
    auth: { value: "26.875rem" },
    content: {
      form: { value: "44rem" },
      reading: { value: "48rem" },
      medium: { value: "56rem" },
      workspace: { value: "60rem" },
      wide: { value: "75rem" },
    },
  },
  fontWeights: {
    thin: { value: "100" },
    extralight: { value: "200" },
    light: {
      value: "300",
      description: "ゴシックMB101 L が持つ唯一の太さ。ヒーロー見出しに使う。",
    },
    normal: { value: "400" },
    medium: { value: "500" },
    semibold: {
      value: "600",
      description: "DNP秀英角ゴシック金 Std B が持つ唯一の太さ。",
    },
    bold: { value: "700" },
    extrabold: { value: "800" },
    black: { value: "900" },
  },
  // モーション。UIの標準カーブと、要素ごとの継続時間を1か所に持つ
  easings: {
    out: { value: "cubic-bezier(0.23, 1, 0.32, 1)" },
    // トーストだけUI標準より柔らかいカーブにする
    soft: { value: "ease" },
  },
  animations: {
    skeletonPulse: { value: "skeleton-pulse 1.6s ease-in-out infinite" },
    // 初回ログインの案内で、下へスクロールできることを示す矢印
    tourNudge: { value: "tour-nudge 1.4s {easings.out} infinite" },
    // 押してほしいボタンの周りに広がる輪
    tourRing: { value: "tour-ring 1.6s {easings.out} infinite" },
  },
  durations: {
    fast: { value: "160ms" },
    dialog: { value: "250ms" },
    toast: { value: "400ms" },
    stagger: { value: "50ms" },
  },
  // 重なり順。local は1つの囲みの中だけの順で、2 は 1 の上に重ねるときに使う
  zIndex: {
    local: { 1: { value: 1 }, 2: { value: 2 } },
    // 入力画面の上下に貼り付く見出しと操作の帯
    formBar: { value: 5 },
    // SP のアプリバー
    appBar: { value: 10 },
    // 画面の下に固定する操作の帯と、入力のパネル
    fixedBar: { value: 20 },
    bottomNav: { value: 25 },
    // tab 以上のヘッダー
    header: { value: 30 },
    // 初回ログインの案内。ヘッダー・下部ナビ・固定の帯より上、ダイアログと候補一覧より下
    guide: { value: 40 },
    dialog: { value: 50 },
    toast: { value: 60 },
  },
  lineHeights: {
    none: { value: "1", description: "1行で収める数値・アイコン。" },
    tight: { value: "1.25", description: "ボタンなど、詰めて組む操作部品の文字。" },
    snug: { value: "1.375", description: "見出し。" },
    normal: { value: "1.5", description: "本文と注記。html の既定値と同じ。" },
    relaxed: { value: "1.625", description: "見出しや操作に添える副文と、ヒーロー見出し。" },
    prose: { value: "1.75", description: "記事・レポートなど、段落が続く長文の本文。" },
    loose: { value: "2", description: "規約や編集欄など、行間を大きく取る文。" },
  } satisfies DescribedTokens,
} satisfies Tokens;

/** UI ではプリミティブよりこちらを優先して参照する。 */
export const semanticTokens = {
  colors: {
    primary: {
      soft: { value: "{colors.green.50}" },
      100: { value: "{colors.green.100}" },
      200: { value: "{colors.green.200}" },
      300: { value: "{colors.green.300}" },
      400: { value: "{colors.green.400}" },
      500: { value: "{colors.green.500}" },
      600: { value: "{colors.green.600}" },
      700: { value: "{colors.green.700}" },
      800: { value: "{colors.green.800}" },
      900: { value: "{colors.green.900}" },
    },
    text: {
      default: { value: "{colors.ink}" },
      muted: { value: "{colors.ink2}" },
      subtle: { value: "{colors.ink3}" },
      // 濃色の面や写真の上に置く文字
      inverse: { value: "{colors.card}" },
      // 白い面とページ地に置く緑の文字
      brand: { value: "{colors.green.700}" },
      // primary.soft・100・200 の淡い緑の面に置く緑の文字。brand のままでは AA に届かない
      brandOnSoft: { value: "{colors.green.800}" },
    },
    surface: {
      page: { value: "{colors.bg}" },
      panel: { value: "{colors.panel}" },
      card: { value: "{colors.card}" },
    },
    border: {
      subtle: { value: "{colors.mist}" },
      default: { value: "{colors.line}" },
      strong: { value: "{colors.line.strong}" },
    },
    accent: {
      official: { value: "{colors.blue}" },
      star: { value: "{colors.star}" },
      warn: { value: "{colors.amber}" },
      warnSoft: { value: "{colors.amber.soft}" },
      danger: { value: "{colors.danger}" },
      dangerSoft: { value: "{colors.danger.soft}" },
      manufacturer: { value: "{colors.teal}" },
    },
    // モーダルの背面や写真の上に敷く半透明の幕。不透明度は使う側で指定する
    scrim: { value: "{colors.ink}" },
    // タグ分類色（モック TAG_CATS）。分類チップの文字・枠・淡い面に使う
    tag: {
      concern: { value: "{colors.orange}" },
      effect: { value: "{colors.teal}" },
      type: { value: "{colors.violet}" },
      name: { value: "{colors.terracotta}" },
      cond: { value: "{colors.blue}" },
    },
    // 実証データのグラフで区ごとに割り当てる系列色
    chart: {
      1: { value: "{colors.ink3}" },
      2: { value: "{colors.green.600}" },
      3: { value: "{colors.teal}" },
      4: { value: "{colors.violet}" },
      5: { value: "{colors.orange}" },
    },
  },
} satisfies SemanticTokens;
