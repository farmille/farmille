"use client";

import { useId } from "react";
import { useReviewBody } from "@/lib/hooks/use-review-body";

import { Icon } from "@/components/Icon";

import { css, cva } from "../../../../../styled-system/css";

const bodyRecipe = cva({
  base: {
    textStyle: "body",
    color: "text.muted",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  variants: {
    clamped: { true: { lineClamp: "8" }, false: {} },
  },
});

const toggleStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  mt: "1.5",
  p: "0",
  bg: "transparent",
  borderWidth: "0",
  fontFamily: "sans",
  textStyle: "supporting",
  fontWeight: "semibold",
  color: "text.brand",
  cursor: "pointer",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "0.5",
  },
});

const toggleIconStyle = css({ transform: "rotate(180deg)" });

/** 感想口コミの本文。長い本文は8行で切り、あふれたときだけ「続きを読む」で全文を開けるようにする。 */
export function ReviewBody({ children }: { children: string }) {
  const bodyId = useId();
  const { bodyRef, expanded, toggleExpanded, overflowing } = useReviewBody(children);

  return (
    <>
      <div id={bodyId} ref={bodyRef} className={bodyRecipe({ clamped: !expanded })}>
        {children}
      </div>
      {overflowing ? (
        <button
          type="button"
          aria-controls={bodyId}
          aria-expanded={expanded}
          className={toggleStyle}
          onClick={toggleExpanded}
        >
          {expanded ? "閉じる" : "続きを読む"}
          <Icon name="expand_more" size="xs" className={expanded ? toggleIconStyle : undefined} />
        </button>
      ) : null}
    </>
  );
}
