import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { Badge } from "./Badge";
import { Icon } from "@/components/Icon";

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
  aspectRatio: "image.landscape",
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
  className,
}: ArtMiniProps) {
  return (
    <Link href={href} className={cx(rowRecipe(), className)}>
      <div className={thumb}>
        {thumbSrc ? (
          <Image
            alt=""
            className={css({
              display: "block",
              w: "100%",
              h: "100%",
              objectFit: "cover",
            })}
            height={52}
            sizes="70px"
            src={thumbSrc}
            width={70}
          />
        ) : (
          <Icon name="image" size="md" />
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

          <Badge variant="type">{typeLabel}</Badge>
        </div>
      </div>
      <Icon
        name="chevron_right"
        size="sm"
        className={css({ color: "text.subtle", flexShrink: "0" })}
      />
    </Link>
  );
}
