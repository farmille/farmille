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
  {
    // アイコンは Google Material Icons（material-icons パッケージのフォント）を共通 Icon 経由で使う。
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react-icons",
                "react-icons/*",
                "lucide",
                "lucide/*",
                "lucide-react",
                "lucide-react/*",
                "@mui/icons-material",
                "@mui/icons-material/*",
              ],
              message:
                "SVG アイコンライブラリは使わない。src/components/Icon.tsx（Material Icons フォント）に glyph を足して使う。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
