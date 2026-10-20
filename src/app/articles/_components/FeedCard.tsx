import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css, cx } from "../../../../styled-system/css";

export function ArticleGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        css({ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "2.5" }),
        className,
      )}
    >
      {children}
    </div>
  );
}

const coverStyle = css({
  display: "grid",
  placeItems: "center",
  aspectRatio: "image.landscape",
  bg: "primary.soft",
  overflow: "hidden",
  "& img": { w: "full", h: "full", objectFit: "cover", display: "block" },
});

const placeholderIconStyle = css({ color: "text.brandOnSoft" });

const titleStyle = css({
  display: "block",
  textStyle: "body",
  fontWeight: "bold",
  color: "[inherit]",
  textDecoration: "none",
});

export function FeedCard({
  href,
  title,
  coverSrc,
  children,
}: {
  href: string;
  title: string;
  coverSrc?: string | null;
  children: ReactNode;
}) {
  return (
    <article
      className={cx(
        surfaceCardRecipe({ padding: "flush" }),
        css({ display: "flex", flexDirection: "column", overflow: "hidden" }),
      )}
    >
      <Link href={href} className={coverStyle} aria-label={title}>
        {coverSrc ? (
          <Image
            alt=""
            src={coverSrc}
            width={640}
            height={480}
            sizes="(min-width: 900px) 420px, 50vw"
          />
        ) : (
          <Icon className={placeholderIconStyle} name="image" size="lg" />
        )}
      </Link>
      <div className={css({ display: "flex", flexDirection: "column", flex: "1", p: "2.5" })}>
        <Link href={href} className={titleStyle}>
          {title}
        </Link>
        {children}
      </div>
    </article>
  );
}
