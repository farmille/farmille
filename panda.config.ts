import { defineConfig } from "@pandacss/dev";

import { semanticTokens, tokens } from "./src/theme/tokens";

// 値の正は docs/rebuild/02-screens.md §5（モック :root ライト側）。ダーク条件は置かない（D12）。
export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  // _invalid は :invalid も拾い、未入力の必須欄を表示直後から赤くするので使わない。
  conditions: {
    extend: {
      startingStyle: "&[data-starting-style]",
      endingStyle: "&[data-ending-style]",
      panelOpen: "&[data-panel-open]",
      fieldInvalid: "&:is([data-invalid], [aria-invalid=true])",
      touch: "@media (hover: none) and (pointer: coarse)",
    },
  },
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
  outdir: "styled-system",
});
