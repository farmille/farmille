import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";

const headingRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2.5",
    mt: "6",
    mb: "2.5",
    _first: { mt: "0" },
  },
});

type SectionHeadingProps = {
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
};

/** 見出し＋「→」リンク（sec-h）。 */
export function SectionHeading({
  title,
  href,
  linkLabel = "すべて見る →",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cx(headingRecipe(), className)}>
      <h2 className={css({ fontSize: "lg", fontWeight: "700", m: "0" })}>{title}</h2>
      {href ? (
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
