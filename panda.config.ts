import { defineConfig } from "@pandacss/dev";

import { semanticTokens, tokens } from "./src/theme/tokens";

// 値の正は docs/rebuild/02-screens.md §5（モック :root ライト側）。ダーク条件は置かない（D12）。
export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  theme: {
    // sp（767px 以下）は base。tab 以上は PC 寄りの UI にし、pc は 768px 幅で成立しない密度だけを持つ。
    breakpoints: { tab: "768px", pc: "1024px" },
    tokens,
    semanticTokens,
    extend: {
      keyframes: { "skeleton-pulse": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } } },
    },
  },
  outdir: "styled-system",
});
