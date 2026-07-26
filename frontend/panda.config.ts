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
      // spacing は Panda 既定（1.5=6px / 2=8px / 2.5=10px / 3=12px / 4=16px）で足りるため補完しない
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
        },
      },
    },
  },
  outdir: "styled-system",
});
