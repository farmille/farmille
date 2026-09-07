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
  ...oxlint.configs["flat/recommended"],
]);

export default eslintConfig;
