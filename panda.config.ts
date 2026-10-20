import { defineConfig } from "@pandacss/dev";

import { textStyles } from "./src/theme/textStyles";
import { breakpoints, semanticTokens, tokens } from "./src/theme/tokens";

// ダーク条件は置かない。
export default defineConfig({
  preflight: true,
  // トークンに無い値を型エラーにする。トークンにしない1回きりの値は "[50%]" のように角括弧で書く。
  strictTokens: true,
  strictPropertyValues: true,
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
      // CSS のキーワードに当たる値。パレットではないので tokens.ts とトークンカタログには載せない。
      colors: {
        ...tokens.colors,
        transparent: { value: "transparent" },
        currentColor: { value: "currentColor" },
      },
      // Panda は sizes に無い数値を px のまま出力する（w: "8" → 8px）。寸法でも余白と同じ数値スケールと full を使えるようにする。
      sizes: {
        ...tokens.spacing,
        full: { value: "100%" },
        none: { value: "none" },
        ...tokens.sizes,
      },
      animations: { none: { value: "none" }, ...tokens.animations },
      opacity: { 0: { value: "0" }, 1: { value: "1" }, ...tokens.opacity },
    },
    semanticTokens,
    // extend にすると preset-panda の xs〜9xl（rem 指定）が残り、fontSizes と同じ名前で別の大きさになる。
    textStyles,
    extend: {
      keyframes: {
        "skeleton-pulse": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        "tour-nudge": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(4px)" },
        },
        "tour-ring": {
          "0%": { transform: "scale(1)", opacity: "0.9" },
          "100%": { transform: "scale(1.12, 1.35)", opacity: "0" },
        },
      },
    },
  },
  outdir: "styled-system",
});
