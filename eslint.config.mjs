import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import oxlint from "eslint-plugin-oxlint";
import stateManagement from "./scripts/eslint/state-management.mjs";

import { tokens } from "./src/theme/tokens.ts";

const iconLibraryImports = {
  group: [
    "material-icons",
    "material-icons/*",
    "react-icons",
    "react-icons/*",
    "lucide",
    "lucide/*",
    "lucide-react",
    "lucide-react/*",
    "@mui/icons-material",
    "@mui/icons-material/*",
  ],
  message: "アイコンは src/components/Icon.tsx（Tabler Icons）に追加して使う。",
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

// strictTokens の角括弧（"[50%]"）を、色の生値の抜け道にしない。
const colorProperty =
  "/^(color|bg|background|fill|stroke|gradientFrom|gradientTo|gradientVia)$|Color$/";
const rawColor = "/#[0-9a-fA-F]{3,8}\\b|\\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\(/";
const colorReference = "/token\\(colors\\.|\\{colors\\./";
const colorValueRules = [
  {
    selector: `Property[key.name=${colorProperty}] Literal[value=/^\\[(?!(inherit|none)\\]$)/]:not([value=${colorReference}])`,
    message:
      "色は角括弧で生値を書かず、トークンを使う。角括弧はキーワード（[inherit]・[none]）と、token(colors.…) を混ぜた式（color-mix など）にだけ使う。",
  },
  {
    selector: `Property[key.name=${colorProperty}] > TemplateLiteral:not(:has(TemplateElement[value.raw=${colorReference}])) > TemplateElement[value.raw=/^\\[/]`,
    message:
      "色は角括弧で生値を書かず、トークンを使う。角括弧はキーワード（[inherit]・[none]）と、token(colors.…) を混ぜた式（color-mix など）にだけ使う。",
  },
  {
    selector: `Property[key.name=${colorProperty}] :matches(Literal[value=${rawColor}], TemplateElement[value.raw=${rawColor}])`,
    message: "色の生値（#fff・rgb() など）を書かない。トークンを使う。",
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
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    plugins: { farmille: stateManagement },
    rules: { "farmille/state-management": "error" },
    // useMountEffect の中から useEffectEvent を呼べるように、Effect として扱わせる
    settings: { "react-hooks": { additionalEffectHooks: "^useMountEffect$" } },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.*", "**/*.stories.*", "src/components/form/**"],
    rules: { "farmille/controlled-form-input": "error" },
  },
  {
    // アイコンは共通 Icon 経由で使う。
    rules: {
      "no-restricted-imports": ["error", { patterns: [iconLibraryImports] }],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    ignores: ["src/components/Icon.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            iconLibraryImports,
            {
              group: ["@tabler/icons-react", "@tabler/icons-react/*"],
              message: "共通 Icon を使う。",
            },
          ],
        },
      ],
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
              group: ["@tabler/icons-react", "@tabler/icons-react/*"],
              message: "共通 Icon を使う。",
            },
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
        colorValueRules,
        styleAttributeRules,
        supabaseQueryRules,
        secretKeyRules,
      ),
    },
  },
  {
    files: ["src/server/**"],
    rules: {
      "no-restricted-syntax": restrictedSyntax(
        textColorRules,
        colorValueRules,
        styleAttributeRules,
      ),
    },
  },
  {
    files: ["src/env.ts"],
    rules: {
      "no-restricted-syntax": restrictedSyntax(
        textColorRules,
        colorValueRules,
        styleAttributeRules,
        supabaseQueryRules,
      ),
    },
  },
  {
    // トークンの定義そのものは色の生値を持つ。
    files: ["src/theme/**"],
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
    // next/og の画像生成は className を読めず、style で組むしかない。
    files: ["src/app/**/opengraph-image.tsx"],
    rules: {
      "no-restricted-syntax": restrictedSyntax(textColorRules, supabaseQueryRules, secretKeyRules),
    },
  },
]);

export default eslintConfig;
