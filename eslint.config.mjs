import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import oxlint from "eslint-plugin-oxlint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".claude/**",
    ".codex/**",
    ".cursor/**",
    ".github/**",
    ".ok/**",
    ".pi/**",
    ".planning/**",
    ".playwright-mcp/**",
    "docs/**",
    "output/**",
    "supabase/**",
    "styled-system/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "storybook-static/**",
    "tools/**",
    "next-env.d.ts",
  ]),
  // oxlintで検査するルールはESLintで重ねて検査しない。ESLintには React Compiler 系のルールなど、oxlintに無いものだけが残る。
  ...oxlint.configs["flat/recommended"],
  ...oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"),
  {
    // useMountEffect の中から useEffectEvent を呼べるように、Effect として扱わせる
    settings: { "react-hooks": { additionalEffectHooks: "^useMountEffect$" } },
  },
]);

export default eslintConfig;
