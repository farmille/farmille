import type { ReactNode } from "react";

import { SuccessMark, completionStepRecipe } from "@/components/SuccessMark";

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
  const step = (n: 1 | 2 | 3) => (check ? completionStepRecipe({ step: n }) : undefined);
  return (
    <section role={role} className={cx(doneRecipe({ spacing }), className)}>
      {check ? <SuccessMark entrance className={css({ mb: "4.5" })} /> : null}
      <Heading className={cx(css({ fontSize: "2xl" }), step(1))}>{title}</Heading>
      {children === undefined ? null : <div className={step(2)}>{children}</div>}
      {actions === undefined ? null : (
        <div className={cx(doneActionsStyle, step(3))}>{actions}</div>
      )}
    </section>
  );
}
