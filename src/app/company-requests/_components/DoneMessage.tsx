import type { ReactNode } from "react";

import { cva, css, cx } from "../../../../styled-system/css";

const doneRecipe = cva({
  base: {
    textAlign: "center",
    px: "6",
    "& p": { mt: "2", fontSize: "md", lineHeight: "prose", color: "text.muted" },
  },
  variants: {
    spacing: {
      page: { pt: "16", pb: "10", pc: { pt: "28" } },
      section: { pt: "10", pb: "10" },
      compact: { pt: "6", pb: "2" },
    },
  },
  defaultVariants: { spacing: "page" },
});

export const doneActionsStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "6.5",
});

export function DoneMessage({
  title,
  as: Heading = "h2",
  spacing,
  role,
  check = true,
  className,
  children,
  actions,
}: {
  title: string;
  as?: "h1" | "h2";
  spacing?: "page" | "section" | "compact";
  role?: "status";
  check?: boolean;
  className?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section role={role} className={cx(doneRecipe({ spacing }), className)}>
      {check ? (
        <div
          aria-hidden="true"
          className={css({
            display: "grid",
            placeItems: "center",
            w: "20",
            h: "20",
            mx: "auto",
            mb: "4.5",
            borderRadius: "pill",
            bg: "primary.100",
            color: "primary.700",
          })}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path d="M5 12l5 5 9-11" />
          </svg>
        </div>
      ) : null}
      <Heading className={css({ fontSize: "2xl" })}>{title}</Heading>
      {children}
      {actions === undefined ? null : <div className={doneActionsStyle}>{actions}</div>}
    </section>
  );
}
