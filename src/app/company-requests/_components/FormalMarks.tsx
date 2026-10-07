import type { ReactNode } from "react";

import { css } from "../../../../styled-system/css";

export function RequiredMark() {
  return (
    <span
      className={css({
        color: "accent.danger",
        fontSize: "lg",
        fontWeight: "bold",
        lineHeight: "none",
      })}
    >
      <span aria-hidden="true">*</span>
      <span className={css({ srOnly: true })}>必須</span>
    </span>
  );
}

const parenthesizedStyle = css({ fontSize: "sm", fontWeight: "normal", color: "formal.subtle" });

export function OptionalMark() {
  return <span className={parenthesizedStyle}>（任意）</span>;
}

export function ConditionMark({ children }: { children: ReactNode }) {
  return (
    <span className={css({ fontSize: "sm", fontWeight: "normal", color: "accent.warn" })}>
      （{children}）
    </span>
  );
}

/** 「公開されません」「単一選択」など、見出しの横に添える小さな注記。 */
export function LabelNote({ children }: { children: ReactNode }) {
  return (
    <span
      className={css({ ml: "1", fontSize: "xs", fontWeight: "normal", color: "formal.subtle" })}
    >
      {children}
    </span>
  );
}

export function PrivateNote() {
  return <LabelNote>公開されません</LabelNote>;
}
