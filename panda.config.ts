import { defineConfig } from "@pandacss/dev";

import { semanticTokens, tokens } from "./src/theme/tokens";

// 値の正は docs/rebuild/02-screens.md §5（モック :root ライト側）。ダーク条件は置かない（D12）。
export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  // 完成見本の画面の外枠（MockPageShell）の中だけ、緑・地色のトークンを見本の値に切り替える
  conditions: { extend: { fm: ".fm &" } },
  theme: {
    // sp（767px 以下）は base。tab 以上は PC 寄りの UI にし、pc は 768px 幅で成立しない密度だけを持つ。
    breakpoints: { tab: "768px", pc: "1024px" },
    tokens: {
      ...tokens,
      // Panda は sizes に無い数値を px のまま出力する（w: "8" → 8px）。寸法でも余白と同じ数値スケールと full を使えるようにする。
      sizes: { ...tokens.spacing, full: { value: "100%" }, ...tokens.sizes },
    },
    semanticTokens,
    extend: {
      keyframes: { "skeleton-pulse": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } } },
    },
  },
  globalCss: {
    // 完成見本の画面の外枠（MockPageShell など）。本文書体と要素の既定の余白をそろえる
    ".fm": {
      color: "text.default",
      fontFamily: "noto",
      WebkitFontSmoothing: "antialiased",
      "& *": { boxSizing: "border-box" },
      "& :is(h1, h2, h3, h4)": { m: "0", lineHeight: "snug" },
      "& :is(h1, h2)": { fontFamily: "inherit", fontWeight: "bold" },
      "& p": { m: "0" },
      "& button": { fontFamily: "inherit", cursor: "pointer" },
    },
  },
  outdir: "styled-system",
});
