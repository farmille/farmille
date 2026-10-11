import { Toaster } from "@/components/Toaster";

import { css, cva } from "../../../../../../styled-system/css";

export const reportFrame = css({ minH: "100dvh", fontSize: "md", lineHeight: "prose" });

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

export const reportToasterId = "report-wizard";

export function ReportToaster() {
  return <Toaster id={reportToasterId} label="レポートの通知" placement="bottom" />;
}
