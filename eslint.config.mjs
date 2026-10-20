import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import oxlint from "eslint-plugin-oxlint";

import { tokens } from "./src/theme/tokens.ts";

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

// no-restricted-syntax は設定ごとに上書きされるので、ファイルの範囲ごとに必要な組を並べ直す。
const palette = ["primary", ...Object.keys(tokens.colors)].join("|");
const paletteValue = `/^(${palette})([./]|$)|colors\\.(${palette})\\b/`;
const textColorRules = [
  {
    selector: `Property[key.name=/^(color|caretColor|textDecorationColor)$/] :matches(Literal[value=${paletteValue}], TemplateElement[value.raw=${paletteValue}])`,
    message:
      "文字色にパレットの段（primary.700・ink2 など）を書かない。置く面に合わせた役割トークン（text.brand・text.brandOnSoft など）を使う。",
  },
];

const styleAttributeRules = [
  {
    selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > :not(ObjectExpression)",
    message:
      'style には CSS 変数だけを書いたオブジェクトをその場で渡す（style={{ "--bar-width": … }}）。',
  },
  {
    selector:
      "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression > :not(Property[key.value=/^--/])",
    message:
      "style に CSS のプロパティを書かない。実行時に決まる値は CSS 変数で渡し、css() の側で var() を使って受ける。",
  },
];

const supabaseQueryRules = [
  {
    selector:
      "CallExpression[callee.property.name=/^(from|rpc)$/]:not([callee.object.property.name='storage']):not([callee.object.name=/^(Array|Buffer)$/])",
    message:
      "Supabase のテーブルと RPC は src/server の関数からだけ呼ぶ。画面と Server Actions からは src/server の関数を使う（auth.* と storage.* は可）。",
  },
];

const secretKeyPattern = "/SUPABASE_SECRET_KEY|SERVICE_KEY|JWT_SECRET/";
const secretKeyRules = [
  {
    selector: `:matches(Identifier[name=${secretKeyPattern}], Literal[value=${secretKeyPattern}], TemplateElement[value.raw=${secretKeyPattern}])`,
    message: "サーバー専用の鍵は src/env.ts と src/server からだけ参照する。",
  },
];

const restrictedSyntax = (...groups) => ["error", ...groups.flat()];

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
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": restrictedSyntax(
        textColorRules,
        styleAttributeRules,
        supabaseQueryRules,
        secretKeyRules,
      ),
    },
  },
  {
    files: ["src/server/**"],
    rules: {
      "no-restricted-syntax": restrictedSyntax(textColorRules, styleAttributeRules),
    },
  },
  {
    files: ["src/env.ts"],
    rules: {
      "no-restricted-syntax": restrictedSyntax(
        textColorRules,
        styleAttributeRules,
        supabaseQueryRules,
      ),
    },
  },
  {
    // next/og の画像生成は className を読めず、style で組むしかない。
    files: ["src/app/**/opengraph-image.tsx"],
    rules: {
      "no-restricted-syntax": restrictedSyntax(textColorRules, supabaseQueryRules, secretKeyRules),
    },
  },
]);

export default eslintConfig;
