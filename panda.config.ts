import { defineConfig } from "@pandacss/dev";

import { layerStyles } from "./src/theme/layerStyles";
import { textStyles } from "./src/theme/textStyles";
import { breakpoints, semanticTokens, tokens } from "./src/theme/tokens";

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
      // ホームのスクロールで現れる要素。隠すのは JS が動く環境だけにし、現れた要素を revealed、その子孫を revealedWithin で戻す
      scripted: "@media (scripting: enabled)",
      revealed: "&[data-revealed]",
      revealedWithin: "[data-revealed] &",
      // スクロールに連動するアニメーションは対応ブラウザだけで動かし、ほかは静止させる
      scrollTimeline: "@supports (animation-timeline: view())",
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
    layerStyles,
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
        "hero-zoom": { from: { transform: "scale(1.08)" }, to: { transform: "scale(1)" } },
        // 縦書きの帯の地を上から下へ伸ばし、文字はあとから浮かべる
        "band-unroll": { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "hero-badge": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "ring-spin": { to: { transform: "rotate(1turn)" } },
        // ヒーローの写真を、画面から出ていくあいだ本文より遅れて動かす
        "hero-drift": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(16%)" },
        },
        // スクロールに連動させる視差。枠より大きく描いた写真を、枠の中で上下にずらす
        "parallax-drift": {
          from: { transform: "translateY(-6%)" },
          to: { transform: "translateY(6%)" },
        },
        // 丘に立つ双葉を、根元を軸にゆっくり揺らす
        "sprout-sway": { from: { transform: "rotate(-6deg)" }, to: { transform: "rotate(6deg)" } },
        // 丘の奥の層を手前より遅らせて持ち上げる
        "hill-rise": { from: { transform: "translateY(18%)" }, to: { transform: "translateY(0)" } },
      },
    },
  },
  outdir: "styled-system",
});
