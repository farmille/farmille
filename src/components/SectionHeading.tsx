import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";

const headingRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
  },
  variants: {
    variant: {
      standard: {
        justifyContent: "space-between",
        gap: "2.5",
        mt: "6",
        mb: "2.5",
        _first: { mt: "0" },
      },
      numbered: {
        gap: "2",
        mt: "7.5",
        pt: "5",
        borderTopWidth: "1px",
        borderTopStyle: "solid",
        borderTopColor: "border.default",
      },
    },
    first: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      variant: "numbered",
      first: true,
      css: { mt: "1.5", pt: "3.5", borderTopWidth: "0" },
    },
  ],
  defaultVariants: {
    variant: "standard",
    first: false,
  },
});

type SectionHeadingProps = {
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
  number?: string;
  sub?: React.ReactNode;
  first?: boolean;
};

/** 見出し＋「→」リンク（sec-h）。 */
export function SectionHeading({
  title,
  href,
  linkLabel = "すべて見る →",
  className,
  number,
  sub,
  first = false,
}: SectionHeadingProps) {
  const numbered = number !== undefined;

  return (
    <div
      className={cx(
        headingRecipe({ variant: numbered ? "numbered" : "standard", first }),
        className,
      )}
    >
      {numbered ? (
        <span
          className={css({
            w: "5.5",
            h: "5.5",
            borderRadius: "pill",
            bg: "brand.primary",
            color: "surface.card",
            display: "grid",
            placeItems: "center",
            flexShrink: "0",
            fontSize: "xs",
            fontWeight: "800",
          })}
        >
          {number}
        </span>
      ) : null}
      <h2 className={css({ fontSize: "lg", fontWeight: "700", m: "0" })}>{title}</h2>
      {numbered && sub ? (
        <span
          className={css({
            ml: "auto",
            fontSize: "xs",
            color: "text.subtle",
            textAlign: "right",
          })}
        >
          {sub}
        </span>
      ) : null}
      {!numbered && href ? (
        <Link
          href={href}
          className={css({
            fontSize: "sm",
            color: "brand.primary",
            textDecoration: "none",
            whiteSpace: "nowrap",
          })}
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
