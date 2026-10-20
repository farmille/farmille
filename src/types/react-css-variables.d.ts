import "react";

// style には CSS 変数だけを渡す（eslint.config.mjs の styleAttributeRules）。
declare module "react" {
  interface CSSProperties {
    [variable: `--${string}`]: string;
  }
}
