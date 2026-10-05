import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

import { css } from "../../../styled-system/css";

// モックの .field / .input / .radio / .toggle / .warn-note / .badge 相当。
// 値はすべて Panda のトークン経由。

const fieldStyle = css({
  mt: "5",
  _first: { mt: "0" },
});

const labelRowStyle = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "700",
});

const badgeBaseStyle = {
  fontSize: "2xs",
  fontWeight: "700",
  px: "calc(var(--spacing-1\\.5) + var(--spacing-0\\.5) / 2)",
  py: "calc(var(--spacing-0\\.5) / 2)",
  rounded: "pill",
} as const;

const requiredBadgeStyle = css({
  ...badgeBaseStyle,
  bg: "amber.soft",
  color: "accent.warn",
});

const optionalBadgeStyle = css({
  ...badgeBaseStyle,
  bg: "surface.page",
  color: "text.subtle",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
});

const publicBadgeStyle = css({
  ...badgeBaseStyle,
  bg: "primary.200",
  color: "primary.700",
});

const guideStyle = css({
  fontSize: "sm",
  color: "text.muted",
  lineHeight: "1.55",
  mt: "1.5",
});

const errorTextStyle = css({
  fontSize: "sm",
  color: "accent.warn",
  fontWeight: "700",
  lineHeight: "1.55",
  mt: "1.5",
});

export const controlStyle = css({
  w: "100%",
  bg: "surface.card",
  color: "text.default",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  rounded: "input",
  px: "calc(var(--spacing-3) + var(--spacing-0\\.5) / 2)",
  py: "calc(var(--spacing-2\\.5) + var(--spacing-0\\.5) / 2)",
  fontSize: "md",
  fontFamily: "sans",
  _placeholder: { color: "text.subtle" },
  _focusVisible: {
    outlineWidth: "1px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    borderColor: "primary.600",
  },
});

export function Field({
  label,
  htmlFor,
  requirement,
  visibility,
  guide,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  requirement?: "required" | "optional";
  visibility?: "public" | "private";
  guide?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={fieldStyle}>
      <label className={labelRowStyle} htmlFor={htmlFor}>
        {label}
        {requirement === "required" ? <span className={requiredBadgeStyle}>必須</span> : null}
        {requirement === "optional" ? <span className={optionalBadgeStyle}>任意</span> : null}
        {visibility ? (
          <span className={visibility === "public" ? publicBadgeStyle : optionalBadgeStyle}>
            <Icon name={visibility === "public" ? "visibility" : "visibility_off"} size="xs" />{" "}
            {visibility === "public" ? "公開されます" : "公開されません"}
          </span>
        ) : null}
      </label>
      {children}
      {guide === undefined ? null : <p className={guideStyle}>{guide}</p>}
      {error === undefined ? null : (
        <p className={errorTextStyle} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const radioListStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

const radioCardStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  rounded: "input",
  px: "calc(var(--spacing-3) + var(--spacing-0\\.5) / 2)",
  py: "3",
  fontSize: "md",
  cursor: "pointer",
  // チェック状態は :has で表現し、クライアント状態を持たない
  "&:has(input:checked)": {
    borderColor: "primary.600",
    bg: "primary.100",
    fontWeight: "700",
  },
  "&:has(input:focus-visible)": {
    outlineWidth: "1px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
  },
});

const radioInputStyle = css({
  appearance: "none",
  w: "17px",
  h: "17px",
  m: "0",
  flex: "0 0 auto",
  rounded: "pill",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "border.strong",
  _checked: {
    borderColor: "primary.600",
    bg: "primary.600",
    boxShadow: "inset 0 0 0 3px white",
  },
});

export function RadioCards({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <div className={radioListStyle}>
      {options.map((option) => (
        <label className={radioCardStyle} key={option.value}>
          <input
            className={radioInputStyle}
            defaultChecked={option.value === defaultValue}
            name={name}
            type="radio"
            value={option.value}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

const noteStyle = css({
  display: "block",
  mt: "2",
  bg: "amber.soft",
  color: "accent.warn",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  rounded: "card",
  px: "3",
  py: "2.5",
  fontSize: "xs",
  lineHeight: "1.5",
});

export function NoteBox({ children }: { children: ReactNode }) {
  return <p className={noteStyle}>{children}</p>;
}

const hintStyle = css({
  mt: "2",
  bg: "surface.page",
  color: "text.muted",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  rounded: "card",
  px: "3",
  py: "2.5",
  fontSize: "xs",
  lineHeight: "1.5",
});

export function HintBox({ children }: { children: ReactNode }) {
  return <p className={hintStyle}>{children}</p>;
}

const messageBaseStyle = {
  rounded: "card",
  px: "3",
  py: "calc(var(--spacing-2\\.5) + var(--spacing-0\\.5) / 2)",
  fontSize: "sm",
  lineHeight: "1.6",
  borderWidth: "1px",
  borderStyle: "solid",
} as const;

const errorMessageStyle = css({
  ...messageBaseStyle,
  bg: "amber.soft",
  color: "accent.warn",
  borderColor: "border.default",
  fontWeight: "700",
});

const infoMessageStyle = css({
  ...messageBaseStyle,
  bg: "primary.200",
  color: "primary.700",
  borderColor: "border.default",
});

export function FormMessage({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <p className={tone === "error" ? errorMessageStyle : infoMessageStyle} role="alert">
      {children}
    </p>
  );
}

export const formActionsStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "6",
});

export const primaryButtonStyle = css({
  w: "100%",
  bg: "primary.700",
  color: "white",
  rounded: "button",
  py: "calc(var(--spacing-3) + var(--spacing-0\\.5) / 2)",
  fontSize: "md",
  fontWeight: "700",
  fontFamily: "sans",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "transparent",
  cursor: "pointer",
  _disabled: { opacity: "disabled", cursor: "progress" },
});

export const ghostButtonStyle = css({
  display: "block",
  w: "100%",
  bg: "surface.card",
  color: "primary.700",
  rounded: "button",
  py: "calc(var(--spacing-3) + var(--spacing-0\\.5) / 2)",
  fontSize: "md",
  fontWeight: "700",
  fontFamily: "sans",
  textAlign: "center",
  textDecoration: "none",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  cursor: "pointer",
});

export const textLinkStyle = css({
  display: "inline-block",
  color: "primary.700",
  fontSize: "sm",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

export const linkRowStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "5",
  textAlign: "center",
});
