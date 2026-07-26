import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { Badge } from "./badge";
import { ChevronIcon, ImagePlaceholderIcon, OfficialCheckIcon } from "./icons";

const rowRecipe = cva({
  base: {
    display: "flex",
    gap: "2.5",
    p: "2.5",
    alignItems: "center",
    bg: "surface.card",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    boxShadow: "shadow",
    textDecoration: "none",
    color: "inherit",
  },
});

const thumb = css({
  w: "70px",
  h: "52px",
  borderRadius: "button",
  bg: "green.soft2",
  flexShrink: "0",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  color: "brand.primary",
});

export type ArtMiniProps = {
  title: string;
  organization: string;
  typeLabel: string;
  href?: string;
  thumbSrc?: string;
  official?: boolean;
  className?: string;
};

/** 組織記事の簡易行（artMini）。 */
export function ArtMini({
  title,
  organization,
  typeLabel,
  href = "#",
  thumbSrc,
  official = true,
  className,
}: ArtMiniProps) {
  return (
    <Link href={href} className={cx(rowRecipe(), className)}>
      <div className={thumb}>
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            className={css({ w: "100%", h: "100%", objectFit: "cover" })}
          />
        ) : (
          <ImagePlaceholderIcon size={20} />
        )}
      </div>
      <div className={css({ flex: "1", minW: "0" })}>
        <div className={css({ fontSize: "sm", fontWeight: "700", lineHeight: "1.4" })}>{title}</div>
        <div
          className={css({
            fontSize: "2xs",
            color: "text.muted",
            mt: "1",
            display: "flex",
            alignItems: "center",
            gap: "1",
            flexWrap: "wrap",
          })}
        >
          {organization}
          {official ? (
            <OfficialCheckIcon size={11} className={css({ color: "accent.official" })} />
          ) : null}
          <Badge variant="type">{typeLabel}</Badge>
        </div>
      </div>
      <ChevronIcon className={css({ color: "text.subtle", flexShrink: "0" })} />
    </Link>
  );
}
