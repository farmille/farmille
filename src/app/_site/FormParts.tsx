import type { ReactNode } from "react";

import { Badge, badgeRecipe } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { inputRecipe } from "@/components/Input";
import { textareaRecipe } from "@/components/Textarea";
import { css, cva } from "../../../styled-system/css";

export const formFieldStyle = css({ mt: "5", minW: "0", _first: { mt: "0" } });

export const formLabelStyle = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  w: "full",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "bold",
});

export const formGuideRecipe = cva({
  base: { color: "text.muted", fontSize: "sm", lineHeight: "normal" },
  variants: {
    placement: { above: { mb: "2" }, below: { mt: "1.5" } },
  },
  defaultVariants: { placement: "above" },
});

const invalidControl = { "&[aria-invalid=true]": { borderColor: "accent.danger" } } as const;

export const formInputStyle = css(inputRecipe.raw(), invalidControl);

export const formTextareaStyle = css(textareaRecipe.raw(), invalidControl);

export const formTextLinkStyle = css({
  color: "primary.800",
  fontWeight: "semibold",
  textDecoration: "none",
});

export const formSecondaryLinkStyle = css({
  display: "block",
  p: "1",
  color: "text.subtle",
  fontSize: "sm",
  textAlign: "center",
  textDecoration: "none",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
});

const requiredBadge = css(badgeRecipe.raw({ variant: "required" }), {
  bg: "accent.dangerSoft",
  color: "accent.danger",
});

const visibilityTag = cva({
  base: { display: "inline-flex", alignItems: "center", gap: "1", fontWeight: "bold" },
  variants: {
    visibility: {
      public: { color: "primary.800" },
      private: { color: "text.subtle" },
    },
  },
});

const srOnly = css({ srOnly: true });

const fieldError = css({
  mt: "1.5",
  color: "accent.danger",
  fontSize: "sm",
  fontWeight: "bold",
  lineHeight: "normal",
});

const formNotice = cva({
  base: {
    mb: "3.5",
    px: "3",
    py: "3",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "input",
    fontSize: "sm",
    lineHeight: "relaxed",
  },
  variants: {
    tone: {
      error: {
        bg: "accent.dangerSoft",
        color: "accent.danger",
        borderColor: "accent.danger/25",
        fontWeight: "bold",
      },
      info: { bg: "primary.soft", color: "primary.800", borderColor: "primary.700/22" },
    },
  },
});

export function RequiredBadge({ children = "必須" }: { children?: ReactNode }) {
  return <span className={requiredBadge}>{children}</span>;
}

export function OptionalBadge({ children = "任意" }: { children?: ReactNode }) {
  return <Badge variant="optional">{children}</Badge>;
}

export function VisibilityTag({ visibility }: { visibility: "public" | "private" }) {
  return visibility === "public" ? (
    <span className={visibilityTag({ visibility: "public" })}>
      <Icon name="public" size="2xs" />
      公開<span className={srOnly}>されます</span>
    </span>
  ) : (
    <span className={visibilityTag({ visibility: "private" })}>
      <Icon name="lock" size="2xs" />
      <span aria-hidden="true">非公開</span>
      <span className={srOnly}>公開されません</span>
    </span>
  );
}

const imagePlaceholderStyle = css({ color: "primary.700" });

export function ImagePlaceholderIcon() {
  return <Icon name="image" size="lg" className={imagePlaceholderStyle} />;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (message === undefined) return null;
  return (
    <p id={id} className={fieldError} role="alert">
      {message}
    </p>
  );
}

export function FormNotice({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <p className={formNotice({ tone })} role="alert">
      {children}
    </p>
  );
}

export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const joined: string[] = [];
  for (const id of ids) {
    if (id) joined.push(id);
  }
  return joined.length > 0 ? joined.join(" ") : undefined;
}
