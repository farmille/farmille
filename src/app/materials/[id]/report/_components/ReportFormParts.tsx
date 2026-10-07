import type { ReactNode } from "react";

import { css, cva } from "../../../../../../styled-system/css";

export const reportFrame = css({ minH: "100dvh", fontSize: "md", lineHeight: "prose" });

export const field = css({ mt: "4" });

export const fieldLabel = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "extrabold",
});

export const guide = css({ mb: "1.5", fontSize: "sm", color: "text.muted" });

export const subLabel = css({
  mt: "2",
  mb: "1",
  fontSize: "sm",
  fontWeight: "bold",
  color: "text.subtle",
});

export const chips = css({ display: "flex", flexWrap: "wrap", gap: "2" });

export const chipRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "pill",
    bg: "surface.card",
    color: "text.default",
    px: "3.5",
    py: "1.5",
    fontSize: "md",
    cursor: "pointer",
    userSelect: "none",
  },
  variants: {
    state: {
      idle: {},
      on: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        fontWeight: "bold",
        _before: { content: '"✓ "', fontSize: "xs" },
      },
      selected: {
        bg: "primary.100",
        borderColor: "primary.700",
        color: "primary.800",
        fontWeight: "extrabold",
        pr: "2",
        cursor: "default",
      },
    },
    size: {
      md: {},
      sm: { px: "3", fontSize: "sm" },
      xs: { px: "2.5", py: "1", fontSize: "sm" },
    },
  },
  defaultVariants: { state: "idle", size: "md" },
});

export const pillButtonRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "pill",
    bg: "surface.card",
    color: "text.default",
    whiteSpace: "nowrap",
    cursor: "pointer",
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    tone: {
      plain: { _hover: { borderColor: "primary.700", color: "primary.800" } },
      quiet: {
        color: "text.muted",
        _hover: { borderColor: "primary.700", color: "primary.800" },
      },
      dashed: {
        borderStyle: "dashed",
        color: "text.muted",
        _hover: { borderColor: "primary.700", color: "primary.800" },
      },
      primary: { bg: "primary.700", borderColor: "primary.700", color: "text.inverse" },
      soft: { bg: "primary.soft", borderColor: "primary.700", color: "primary.800" },
    },
    size: {
      xs: { px: "2.5", py: "0.5", fontSize: "sm" },
      sm: { px: "3", py: "1.5", fontSize: "sm" },
      md: { px: "4.5", py: "2.5", fontSize: "md" },
    },
    strong: { true: { fontWeight: "bold" }, false: {} },
  },
  defaultVariants: { tone: "plain", size: "sm", strong: false },
});

export const checkRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.card",
  px: "3",
  py: "2.5",
  fontSize: "md",
  fontWeight: "bold",
  cursor: "pointer",
});

/** 補足（checkNote）を持つ行。狭い画面では補足を次の行に送る */
export const checkRowWithNote = css({ flexWrap: "wrap", tab: { flexWrap: "nowrap" } });

export const checkNote = css({
  flex: "1 1 100%",
  fontSize: "xs",
  fontWeight: "normal",
  color: "text.subtle",
  tab: { flex: "0 1 auto", ml: "auto" },
});

const badgeRecipe = cva({
  base: { borderRadius: "pill", px: "1.5", py: "0.5", fontSize: "xs", fontWeight: "extrabold" },
  variants: {
    required: {
      true: { bg: "accent.dangerSoft", color: "accent.danger" },
      false: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        bg: "surface.panel",
        color: "text.subtle",
      },
    },
  },
});

export function Badge({ required = false }: { required?: boolean }) {
  return <span className={badgeRecipe({ required })}>{required ? "必須" : "任意"}</span>;
}

const needRecipe = cva({
  base: { ml: "2", fontSize: "sm", fontWeight: "bold", color: "accent.danger" },
  variants: { block: { true: { display: "block", ml: "0", mt: "1.5" }, false: {} } },
});

/** 未入力の項目の見出しの横に出す赤い注意書き */
export function Need({ message, block = false }: { message?: string; block?: boolean }) {
  return message ? (
    <span className={needRecipe({ block })} role="alert">
      {message}
    </span>
  ) : null;
}

const exampleRecipe = cva({
  base: {
    mt: "2",
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: "primary.700",
    borderRightRadius: "input",
    bg: "primary.soft",
    px: "3",
    py: "2",
    fontSize: "sm",
    color: "text.muted",
  },
  variants: {
    compact: { true: { mt: "1.5", px: "2.5", py: "1.5", fontSize: "xs" }, false: {} },
  },
});

const exampleLabel = css({ display: "block", fontSize: "xs", color: "text.subtle" });

export function Example({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className={exampleRecipe({ compact })}>
      <b className={exampleLabel}>記入例</b>
      {children}
    </div>
  );
}

const groupHeading = css({
  display: "flex",
  alignItems: "baseline",
  gap: "2",
  fontSize: "md",
  fontWeight: "extrabold",
  lineHeight: "prose",
});

const groupNote = css({ fontSize: "sm", fontWeight: "medium", color: "text.subtle" });

export function GroupHeading({ title, note }: { title: string; note: string }) {
  return (
    <h3 className={groupHeading}>
      {title}
      <small className={groupNote}>{note}</small>
    </h3>
  );
}

export const toast = css({
  position: "fixed",
  bottom: "20",
  left: "50%",
  zIndex: "40",
  display: "flex",
  alignItems: "center",
  gap: "3",
  w: "max-content",
  maxW: "calc(100vw - {spacing.6})",
  transform: "translateX(-50%)",
  borderRadius: "pill",
  bg: "text.default",
  color: "text.inverse",
  px: "4",
  py: "2",
  fontSize: "sm",
  lineHeight: "normal",
});
