import { defineConfig } from "@pandacss/dev";

import { textStyles } from "./src/theme/textStyles";
import { breakpoints, semanticTokens, tokens } from "./src/theme/tokens";

// ダーク条件は置かない。
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
  // トークンカタログは全 textStyle を実行時の名前で描くので、どこにも使われていない役割も出力する。
  staticCss: { css: [{ properties: { textStyle: ["*"] } }] },
  theme: {
    breakpoints,
    tokens: {
      ...tokens,
      // Panda は sizes に無い数値を px のまま出力する（w: "8" → 8px）。寸法でも余白と同じ数値スケールと full を使えるようにする。
      sizes: { ...tokens.spacing, full: { value: "100%" }, ...tokens.sizes },
    },
    semanticTokens,
    // extend にすると preset-panda の xs〜9xl（rem 指定）が残り、fontSizes と同じ名前で別の大きさになる。
    textStyles,
    extend: {
      keyframes: { "skeleton-pulse": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } } },
    },
  },
  outdir: "styled-system",
});
