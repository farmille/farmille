import { tokens } from "../../../src/theme/tokens.ts";

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

const groups = {
  textColor: textColorRules,
  colorValue: colorValueRules,
  styleAttribute: styleAttributeRules,
  supabaseQuery: supabaseQueryRules,
  secretKey: secretKeyRules,
};

/** ファイルの範囲ごとに、禁止する構文の組を選んで検査する。 */
export const restrictedSyntax = {
  meta: {
    type: "problem",
    schema: [
      {
        type: "object",
        properties: {
          groups: { type: "array", items: { enum: Object.keys(groups) }, uniqueItems: true },
        },
        required: ["groups"],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const visitor = {};
    for (const name of context.options[0].groups) {
      for (const { selector, message } of groups[name]) {
        const previous = visitor[selector];
        visitor[selector] = (node) => {
          previous?.(node);
          context.report({ node, message });
        };
      }
    }
    return visitor;
  },
};
