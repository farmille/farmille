import type { SemanticTokens, Tokens } from "@pandacss/dev";

/**
 * Farmille のプリミティブトークン。
 * Panda の設定とトークンカタログが同じ元本を参照する。
 */
export const tokens = {
  blurs: { reportGate: { value: "4px" } },
  colors: {
    green: {
      100: { value: "#D8F3DC" },
      200: { value: "#B7E4C7" },
      300: { value: "#95D5B2" },
      400: { value: "#74C69D" },
      500: { value: "#52B788" },
      600: { value: "#40916C" },
      700: { value: "#2D6A4F" },
      800: { value: "#1B4332" },
      900: { value: "#081C15" },
    },
    blue: { value: "#1976D2" },
    star: { value: "#F5A623" },
    amber: {
      DEFAULT: { value: "#B26A00" },
      soft: { value: "#FFF4E0" },
    },
    bg: { value: "#FCFCFB" },
    panel: { value: "#FDFDFC" },
    card: { value: "#FFFFFF" },
    // ink 3段（本文 / 副文 / 補助）
    ink: { value: "#1E231F" },
    ink2: { value: "#4C534D" },
    ink3: { value: "#7C837D" },
    // line 2段
    line: {
      DEFAULT: { value: "#E7E5DE" },
      strong: { value: "#D8D6CD" },
    },
    // タグ分類色（モック TAG_CATS）と危険操作色（T-22）
    tag: {
      concern: { value: "#D97A2B" },
      effect: { value: "#1F9E95" },
      type: { value: "#8B7BC0" },
      name: { value: "#C0705F" },
    },
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
    input: { value: "11px" },
    // 実証データの横棒グラフ
    bar: { value: "5px" },
    // 組織の頭文字など、文字を1字載せる小さな標章
    mark: { value: "6px" },
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
    "2xs": { value: "9.5px" },
    xs: { value: "11px" },
    sm: { value: "12px" },
    md: { value: "14px" },
    lg: { value: "16px" },
    xl: { value: "18px" },
    "2xl": { value: "20px" },
    "3xl": { value: "21px" },
    display: { value: "38px" },
    // ホームのヒーロー見出し専用（ゴシックMB101 L）。通常UIの8段とは別枠で持つ
    hero: {
      DEFAULT: { value: "28px" },
      md: { value: "44px" },
      lg: { value: "64px" },
    },
  },
  // 公式npmパッケージをlayoutで読み込む（フォールバックは02 §5のスタック）
  fonts: {
    // Adobe Fonts の DNP秀英角ゴシック金 Std B（weight 600）
    shueiGothicKin: {
      value: '"dnp-shuei-gothic-kin-std", var(--fonts-sans)',
    },
    // Adobe Fonts の Farmille Web プロジェクトで配信するゴシックMB101 L（weight 300）
    gothicMb101: {
      value: '"a-otf-gothic-mb101-pr6n", var(--fonts-sans)',
    },
    sans: {
      value:
        '"Gen Interface JP", -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif',
    },
  },
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
    dialog: { value: "24rem" },
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
    light: { value: "300" },
    normal: { value: "400" },
    medium: { value: "500" },
    semibold: { value: "600" },
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
  animations: { skeletonPulse: { value: "skeleton-pulse 1.6s ease-in-out infinite" } },
  durations: {
    fast: { value: "160ms" },
    dialog: { value: "250ms" },
    toast: { value: "400ms" },
  },
  lineHeights: {
    none: { value: "1" },
    tight: { value: "1.25" },
    snug: { value: "1.375" },
    normal: { value: "1.5" },
    relaxed: { value: "1.625" },
    loose: { value: "2" },
  },
} satisfies Tokens;

/** UI ではプリミティブよりこちらを優先して参照する。 */
export const semanticTokens = {
  colors: {
    primary: {
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
    },
    surface: {
      page: { value: "{colors.bg}" },
      panel: { value: "{colors.panel}" },
      card: { value: "{colors.card}" },
    },
    border: {
      default: { value: "{colors.line}" },
      strong: { value: "{colors.line.strong}" },
    },
    accent: {
      official: { value: "{colors.blue}" },
      star: { value: "{colors.star}" },
      warn: { value: "{colors.amber}" },
      danger: { value: "{colors.danger}" },
      dangerSoft: { value: "{colors.danger.soft}" },
    },
  },
} satisfies SemanticTokens;
