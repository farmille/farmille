import { css } from "../../styled-system/css";

/**
 * native `<dialog>.showModal()` のパネル見た目。
 * Panda preflight が UA の `margin: auto` を消すため、未指定だと上端に張り付く。
 * `inset:0` + `m:auto` + `h:fit-content` で画面中央へ置く。
 *
 * 入退場は `@starting-style` と `transition-behavior: allow-discrete` で補間する。
 * パネルと `::backdrop` の不透明度を揃え、ひとつの面として現れて同じ経路で戻る。
 * トリガーに紐づかないモーダルなので `transform-origin` は中央のまま。
 */
export const dialogPanel = css({
  position: "fixed",
  inset: "0",
  m: "auto",
  h: "fit-content",
  w: "calc(100% - {spacing.8})",
  maxW: "dialog",
  maxH: "calc(100dvh - {spacing.8})",
  overflow: "auto",
  p: "4",
  bg: "surface.card",
  color: "text.default",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow.lift",
  opacity: "1",
  transform: "scale(1)",
  transitionProperty: "opacity, transform, overlay, display",
  transitionDuration: "dialog",
  transitionTimingFunction: "out",
  transitionBehavior: "allow-discrete",
  "&:not([open])": {
    opacity: "0",
    transform: "scale(0.96)",
    "@media (prefers-reduced-motion: reduce)": { transform: "none" },
  },
  "@starting-style": {
    "&[open]": {
      opacity: "0",
      transform: "scale(0.96)",
      "@media (prefers-reduced-motion: reduce)": { transform: "none" },
    },
    "&[open]::backdrop": { opacity: "0" },
  },
  "&::backdrop": {
    bg: "ink/45",
    opacity: "1",
    transitionProperty: "opacity, overlay, display",
    transitionDuration: "dialog",
    transitionTimingFunction: "out",
    transitionBehavior: "allow-discrete",
  },
  "&:not([open])::backdrop": { opacity: "0" },
});
