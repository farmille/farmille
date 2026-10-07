import type { ReactNode } from "react";

import { Badge, badgeRecipe } from "@/components/Badge";
import { inputRecipe } from "@/components/Input";
import { textareaRecipe } from "@/components/Textarea";
import { css, cva } from "../../../styled-system/css";

/** 入力欄1つ分の区切り。2つ目以降の欄の上に間をあける。 */
export const formFieldStyle = css({ mt: "5", minW: "0", _first: { mt: "0" } });

/** 欄の名前（label や、複数の部品をまとめる見出し）。 */
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

/** 欄の補足。入力欄の上に置くか、下に置くかで間のとり方が変わる。 */
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

/** 送信ボタンの下に置く控えめなリンク（キャンセル・下書き保存など）。 */
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

/** 「必須」などの赤い小バッジ。 */
export function RequiredBadge({ children = "必須" }: { children?: ReactNode }) {
  return <span className={requiredBadge}>{children}</span>;
}

/** 「任意」などの灰色の小バッジ。 */
export function OptionalBadge({ children = "任意" }: { children?: ReactNode }) {
  return <Badge variant="optional">{children}</Badge>;
}

/** 公開の印（地球儀）。 */
function PublicIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z" />
    </svg>
  );
}

/** 非公開の印（鍵）。 */
function PrivateIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

/**
 * 画面には「公開」「非公開」と出し、
 * 読み上げでは「公開されます」「公開されません」と文で伝える。
 */
export function VisibilityTag({ visibility }: { visibility: "public" | "private" }) {
  return visibility === "public" ? (
    <span className={visibilityTag({ visibility: "public" })}>
      <PublicIcon />
      公開<span className={srOnly}>されます</span>
    </span>
  ) : (
    <span className={visibilityTag({ visibility: "private" })}>
      <PrivateIcon />
      <span aria-hidden="true">非公開</span>
      <span className={srOnly}>公開されません</span>
    </span>
  );
}

/** 検索欄の虫眼鏡。 */
export function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

/** 写真の置き場の印。 */
export function ImagePlaceholderIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
      className={css({ color: "primary.700" })}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M21 16l-5-5-7 7" />
    </svg>
  );
}

/** 入力欄の下に出すエラー。入力欄の aria-describedby から id で参照する。 */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (message === undefined) return null;
  return (
    <p id={id} className={fieldError} role="alert">
      {message}
    </p>
  );
}

/** 画面上部に出すフォーム全体の通知（エラー・お知らせ）。 */
export function FormNotice({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <p className={formNotice({ tone })} role="alert">
      {children}
    </p>
  );
}

/** aria-describedby に渡す id を、存在するものだけ空白区切りでつなぐ。 */
export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const joined: string[] = [];
  for (const id of ids) {
    if (id) joined.push(id);
  }
  return joined.length > 0 ? joined.join(" ") : undefined;
}
