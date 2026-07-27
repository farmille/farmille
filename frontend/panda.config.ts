import { defineConfig } from "@pandacss/dev";

// 値の正は docs/rebuild/02-screens.md §5（モック :root ライト側）。ダーク条件は置かない（D12）。
export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  theme: {
    tokens: {
      colors: {
        // プライマリ緑とその階調（deep / soft / soft2）
        green: {
          DEFAULT: { value: "#2E7D32" },
          deep: { value: "#1B5E20" },
          soft: { value: "#E8F5E9" },
          soft2: { value: "#F1F8F2" },
        },
        blue: { value: "#1976D2" },
        star: { value: "#F5A623" },
        amber: {
          DEFAULT: { value: "#B26A00" },
          soft: { value: "#FFF4E0" },
        },
        bg: { value: "#F5F4EF" },
        panel: { value: "#FAFAF7" },
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
        // boxShadow: "shadow" / "shadow.lift"
        shadow: {
          DEFAULT: {
            value: "0 1px 2px rgba(30,35,31,.05), 0 4px 14px rgba(30,35,31,.06)",
          },
          lift: { value: "0 8px 30px rgba(30,35,31,.16)" },
        },
      },
      radii: {
        pill: { value: "999px" },
        card: { value: "14px" },
        button: { value: "12px" },
        input: { value: "11px" },
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
      },
      // next/font が layout で渡す CSS 変数へ接続（フォールバックは 02 §5 のスタック）
      fonts: {
        sans: {
          value:
            'var(--font-noto-sans-jp), -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif',
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
        7: { value: "1.75rem" },
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
      lineHeights: {
        none: { value: "1" },
        tight: { value: "1.25" },
        snug: { value: "1.375" },
        normal: { value: "1.5" },
        relaxed: { value: "1.625" },
        loose: { value: "2" },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          primary: { value: "{colors.green}" },
          primaryDeep: { value: "{colors.green.deep}" },
          soft: { value: "{colors.green.soft}" },
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
    },
  },
  outdir: "styled-system",
});
