import type { ReactNode } from "react";
import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { Radio } from "@/components/Radio";

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
  fontWeight: "bold",
});

const guideStyle = css({
  fontSize: "sm",
  color: "text.muted",
  lineHeight: "normal",
  mt: "1.5",
});

const errorTextStyle = css({
  fontSize: "sm",
  color: "accent.warn",
  fontWeight: "normal",
  lineHeight: "normal",
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
  labelId,
  requirement,
  visibility,
  guide,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  /** ラベルを `aria-labelledby` から参照するときの id（ラジオ一覧など、単一の入力に結べない子向け）。 */
  labelId?: string;
  requirement?: "required" | "optional";
  visibility?: "public" | "private";
  guide?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={fieldStyle}>
      <label className={labelRowStyle} htmlFor={htmlFor} id={labelId}>
        {label}
        {requirement === "required" ? <Badge variant="required">必須</Badge> : null}
        {requirement === "optional" ? <Badge variant="optional">任意</Badge> : null}
        {visibility ? (
          <Badge variant={visibility === "public" ? "published" : "optional"}>
            <Icon name={visibility === "public" ? "visibility" : "visibility_off"} size="xs" />
            {visibility === "public" ? "公開されます" : "公開されません"}
          </Badge>
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
    fontWeight: "bold",
  },
  "&:has(input:focus-visible)": {
    outlineWidth: "1px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
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
          <Radio defaultChecked={option.value === defaultValue} name={name} value={option.value} />
          {option.label}
        </label>
      ))}
    </div>
  );
}

const noteStyle = css({
  display: "block",
  mt: "2",
  bg: "accent.warnSoft",
  color: "accent.warn",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  rounded: "card",
  px: "3",
  py: "2.5",
  fontSize: "xs",
  lineHeight: "normal",
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
  lineHeight: "normal",
});

export function HintBox({ children }: { children: ReactNode }) {
  return <p className={hintStyle}>{children}</p>;
}

const messageBaseStyle = {
  rounded: "card",
  px: "3",
  py: "calc(var(--spacing-2\\.5) + var(--spacing-0\\.5) / 2)",
  fontSize: "sm",
  lineHeight: "relaxed",
  borderWidth: "1px",
  borderStyle: "solid",
} as const;

const errorMessageStyle = css({
  ...messageBaseStyle,
  bg: "accent.warnSoft",
  color: "accent.warn",
  borderColor: "border.default",
  fontWeight: "bold",
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
