import type { breakpoints, tokens } from "./tokens";

type JoinPath<Prefix extends string, Key extends string> = Key extends "DEFAULT"
  ? Prefix
  : Prefix extends ""
    ? Key
    : `${Prefix}.${Key}`;

/** Panda と同じ DEFAULT 規則で、トークン定義の入れ子から参照名の union を作る。 */
type TokenPath<Branch, Prefix extends string = ""> = {
  [Key in keyof Branch & string]: Branch[Key] extends { value: string }
    ? JoinPath<Prefix, Key>
    : TokenPath<Branch[Key], JoinPath<Prefix, Key>>;
}[keyof Branch & string];

type Responsive<Value> =
  | Value
  | ({ base: Value } & { [Breakpoint in keyof typeof breakpoints]?: Value });

type TextRole = {
  description: string;
  value: {
    fontSize: Responsive<TokenPath<typeof tokens.fontSizes>>;
    lineHeight: TokenPath<typeof tokens.lineHeights>;
    fontWeight?: TokenPath<typeof tokens.fontWeights>;
    fontFamily?: TokenPath<typeof tokens.fonts>;
    letterSpacing?: `${number}em`;
  };
};

/** 文字の役割。色は持たず、呼び出し側で足す。 */
export const textStyles = {
  title: {
    description:
      "カード・ダイアログ・認証画面・節の見出し。h1〜h6 の書体と太さは globals.css が要素に当てるので、ここでは大きさと行高だけを決める。",
    value: { fontSize: "lg", lineHeight: "snug" },
  },
  body: {
    description:
      "画面の基本の文。状態の表示、一覧の行、1〜2文の説明に使う。段落が続く長文は prose、見出しや操作に添える文は supporting にする。",
    value: { fontSize: "md", lineHeight: "normal" },
  },
  prose: {
    description: "記事・レポート・資材の概要など、段落が続く長文の本文。",
    value: { fontSize: "md", lineHeight: "prose" },
  },
  supporting: {
    description:
      "見出し・操作・入力欄に添える副文。リード、カードやダイアログの説明、入力欄の補足、操作の下の注意書きに使う。色は text.muted か text.subtle を足す。図のキャプション（sm と normal）には使わない。",
    value: { fontSize: "sm", lineHeight: "relaxed" },
  },
  note: {
    description:
      "日付・件数・出典など、本文を補う短い注記と、注意書きの箱。チップやバッジのラベルには使わない。",
    value: { fontSize: "xs", lineHeight: "normal" },
  },
  welcome: {
    description: "初回ログインの案内の最初のシート（Farmilleへようこそ）の見出し専用。",
    value: { fontSize: "welcome", lineHeight: "snug" },
  },
  hero: {
    description:
      "ホームのヒーローの縦書きの一文専用。ゴシックMB101 L の細字で組み、画面幅に応じて hero、hero.md、hero.lg の順に大きくする。md と lg はサイズの段名で、breakpoint ではない。",
    value: {
      fontFamily: "gothicMb101",
      fontSize: { base: "hero", tab: "hero.md", pc: "hero.lg" },
      fontWeight: "light",
      lineHeight: "none",
      letterSpacing: "0.14em",
    },
  },
  headline: {
    description:
      "ホームの節の見出し。画面幅に応じて headline、headline.md、headline.lg の順に大きくする。",
    value: {
      fontSize: { base: "headline", tab: "headline.md", pc: "headline.lg" },
      lineHeight: "snug",
      letterSpacing: "0.08em",
    },
  },
  voice: {
    description:
      "ホームで生産者の問いかけを大きく見せる一文（コンセプトの問いかけ）。ゴシックMB101 L の細字で組み、大きさは headline と同じ段を使う。",
    value: {
      fontFamily: "gothicMb101",
      fontSize: { base: "headline", tab: "headline.md", pc: "headline.lg" },
      fontWeight: "light",
      lineHeight: "relaxed",
      letterSpacing: "0.06em",
    },
  },
  statement: {
    description:
      "ホームで本文より一段強く言い切る文（コンセプトの答えや締めの一文、二つの道の比較）。りょうゴシックで組む。",
    value: {
      fontFamily: "ryoGothic",
      fontSize: { base: "lg", tab: "xl" },
      fontWeight: "bold",
      lineHeight: "loose",
      letterSpacing: "0.06em",
    },
  },
  eyebrow: {
    description: "ホームの節の見出しに添える英字の小見出し。",
    value: { fontSize: "xs", lineHeight: "normal", fontWeight: "bold", letterSpacing: "0.24em" },
  },
  essay: {
    description: "ホームの理念や想いなど、行間を広く取って読ませる文。",
    value: { fontSize: { base: "md", tab: "lg" }, lineHeight: "loose", letterSpacing: "0.06em" },
  },
  letter: {
    description:
      "ホームの応援メッセージの本文。手書きの教科書体で組み、便箋の罫線と同じ行送りにする。",
    value: {
      fontFamily: "handwriting",
      fontSize: { base: "md", tab: "lg" },
      lineHeight: "loose",
      letterSpacing: "0.04em",
    },
  },
} satisfies Record<string, TextRole>;
