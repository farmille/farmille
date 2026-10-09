import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import oxlint from "eslint-plugin-oxlint";

const iconLibraryImports = {
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
};

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
      "no-restricted-imports": ["error", { patterns: [iconLibraryImports] }],
    },
  },
  {
    // 部品の土台は共通部品の中に閉じ、画面は src/components の部品を使う（見た目と挙動をそろえるため）
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            iconLibraryImports,
            {
              group: ["@base-ui/react", "@base-ui/react/*", "sonner"],
              message:
                "Base UI と Sonner は src/components の共通部品の中だけで使う。画面からは @/components/form などの部品を使う。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
