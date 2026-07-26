import type { ReactNode } from "react";

import { css } from "../../../styled-system/css";

// モックの .field / .input / .radio / .toggle / .warn-note / .badge 相当。
// 値はすべて Panda のトークン経由（余白は T-03 の判断で px 直書き）。

const fieldStyle = css({
  mt: "20px",
  _first: { mt: "0" },
});

const labelRowStyle = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
  mb: "6px",
  fontSize: "md",
  fontWeight: "700",
});

const badgeBaseStyle = {
  fontSize: "2xs",
  fontWeight: "700",
  px: "7px",
  py: "1px",
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

const guideStyle = css({
  fontSize: "sm",
  color: "text.muted",
  lineHeight: "1.55",
  mt: "6px",
});

const errorTextStyle = css({
  fontSize: "sm",
  color: "accent.warn",
  fontWeight: "700",
  lineHeight: "1.55",
  mt: "6px",
});

export const controlStyle = css({
  w: "100%",
  bg: "surface.card",
  color: "text.default",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  rounded: "input",
  px: "13px",
  py: "11px",
  fontSize: "md",
  fontFamily: "sans",
  _placeholder: { color: "text.subtle" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
    borderColor: "brand.primary",
  },
});

export function Field({
  label,
  htmlFor,
  requirement,
  guide,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  requirement?: "required" | "optional";
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
  gap: "8px",
});

const radioCardStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  rounded: "input",
  px: "13px",
  py: "12px",
  fontSize: "md",
  cursor: "pointer",
  // チェック状態は :has で表現し、クライアント状態を持たない
  "&:has(input:checked)": {
    borderColor: "brand.primary",
    bg: "green.soft2",
    fontWeight: "700",
  },
  "&:has(input:focus-visible)": {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
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
    borderColor: "brand.primary",
    bg: "brand.primary",
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

const toggleStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  mt: "8px",
  fontSize: "sm",
  color: "text.muted",
  cursor: "pointer",
});

const switchStyle = css({
  appearance: "none",
  position: "relative",
  w: "34px",
  h: "20px",
  m: "0",
  flex: "0 0 auto",
  rounded: "pill",
  bg: "border.strong",
  cursor: "pointer",
  _after: {
    content: '""',
    position: "absolute",
    top: "2px",
    left: "2px",
    w: "16px",
    h: "16px",
    rounded: "pill",
    bg: "surface.card",
    transition: "left 120ms ease",
  },
  _checked: {
    bg: "brand.primary",
    _after: { left: "16px" },
  },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
  },
});

export function SwitchToggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className={toggleStyle}>
      <input className={switchStyle} defaultChecked={defaultChecked} name={name} type="checkbox" />
      {label}
    </label>
  );
}

const noteStyle = css({
  display: "flex",
  gap: "8px",
  mt: "8px",
  bg: "amber.soft",
  color: "accent.warn",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  rounded: "card",
  px: "12px",
  py: "10px",
  fontSize: "xs",
  lineHeight: "1.5",
});

export function NoteBox({ children }: { children: ReactNode }) {
  return <p className={noteStyle}>{children}</p>;
}

const hintStyle = css({
  mt: "8px",
  bg: "surface.page",
  color: "text.muted",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  rounded: "card",
  px: "12px",
  py: "10px",
  fontSize: "xs",
  lineHeight: "1.5",
});

export function HintBox({ children }: { children: ReactNode }) {
  return <p className={hintStyle}>{children}</p>;
}

const messageBaseStyle = {
  rounded: "card",
  px: "12px",
  py: "11px",
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
  bg: "brand.soft",
  color: "brand.primaryDeep",
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
  gap: "10px",
  mt: "24px",
});

export const primaryButtonStyle = css({
  w: "100%",
  bg: "brand.primary",
  color: "white",
  rounded: "button",
  py: "13px",
  fontSize: "md",
  fontWeight: "700",
  fontFamily: "sans",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "transparent",
  cursor: "pointer",
  _disabled: { opacity: "0.6", cursor: "progress" },
});

export const ghostButtonStyle = css({
  display: "block",
  w: "100%",
  bg: "surface.card",
  color: "brand.primary",
  rounded: "button",
  py: "13px",
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
  color: "brand.primary",
  fontSize: "sm",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

export const linkRowStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  mt: "20px",
  textAlign: "center",
});
