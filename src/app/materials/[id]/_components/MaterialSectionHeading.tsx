import type { ReactNode } from "react";

import { css, cva } from "../../../../../styled-system/css";

import { MoreLink } from "./MoreLink";

const headingRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2.5",
    mb: "2.5",
    pc: { mb: "5" },
  },
  variants: {
    spacing: {
      section: { mt: "6.5" },
      list: { mt: "4.5" },
      standalone: { mt: "6", pc: { mt: "14" } },
    },
  },
  defaultVariants: { spacing: "standalone" },
});

const titleStyle = css({
  textStyle: "title",
  pc: { letterSpacing: "0.01em" },
});

const countStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  fontVariantNumeric: "tabular-nums",
});

type MaterialSectionHeadingProps = {
  id?: string;
  headingId?: string;
  title: ReactNode;
  count?: number;
  more?: { href: string; label: ReactNode };
  spacing?: "section" | "list" | "standalone";
};

export function MaterialSectionHeading({
  id,
  headingId,
  title,
  count,
  more,
  spacing,
}: MaterialSectionHeadingProps) {
  return (
    <div className={headingRecipe({ spacing })} id={id}>
      <h2 className={titleStyle} id={headingId}>
        {title}
        {count === undefined ? null : (
          <>
            {" "}
            <span className={countStyle}>{count}件</span>
          </>
        )}
      </h2>
      {more === undefined ? null : <MoreLink href={more.href}>{more.label}</MoreLink>}
    </div>
  );
}
