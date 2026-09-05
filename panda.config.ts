import { defineConfig } from "@pandacss/dev";

import { semanticTokens, tokens } from "./src/theme/tokens";

// 値の正は docs/rebuild/02-screens.md §5（モック :root ライト側）。ダーク条件は置かない（D12）。
export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  theme: {
    tokens,
    semanticTokens,
  },
  outdir: "styled-system",
});
