import { createElement, type ReactNode } from "react";

import { css } from "../../../../styled-system/css";
import { readingArticle } from "./Reading";

const pageBody = css({ px: "4", pt: "4", pb: "10", pc: { px: "8", pt: "6.5", pb: "0" } });

export function readingFrame(story: ReactNode) {
  return createElement(
    "div",
    { className: pageBody },
    createElement("div", { className: readingArticle }, story),
  );
}
