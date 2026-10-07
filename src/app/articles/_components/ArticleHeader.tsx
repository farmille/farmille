import Link from "next/link";

import { Badge } from "@/components/Badge";
import { formatDateJa } from "@/components/format-date";
import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { css, cx } from "../../../../styled-system/css";
import { articleTitle, byline, figureFrameRecipe } from "./Reading";

type ArticleHeaderProps = {
  title: string;
  sellerName: string;
  sellerPath: string;
  logoUrl: string | null;
  publishedAt: string;
  heroImageUrl: string | null;
};

/** 記事の冒頭：題名・メーカー名と投稿日・見出し画像。 */
export function ArticleHeader({
  title,
  sellerName,
  sellerPath,
  logoUrl,
  publishedAt,
  heroImageUrl,
}: ArticleHeaderProps) {
  return (
    <>
      <h1 className={articleTitle}>{title}</h1>
      <div className={byline.row}>
        <Link href={sellerPath} className={byline.link}>
          <span
            className={css({
              w: "8",
              h: "8",
              borderRadius: "input",
              bg: "primary.100",
              display: "grid",
              placeItems: "center",
              flexShrink: "0",
              overflow: "hidden",
              fontSize: "sm",
              fontWeight: "extrabold",
              color: "primary.800",
              "& img": { w: "full", h: "full", objectFit: "cover", display: "block" },
            })}
            aria-hidden="true"
          >
            {logoUrl ? (
              <Image alt="" height={32} sizes="32px" src={logoUrl} width={32} />
            ) : (
              sellerName.charAt(0)
            )}
          </span>
          <span className={byline.name}>{sellerName}</span>
        </Link>
        <Badge variant="type">メーカー</Badge>
        <time className={byline.sub} dateTime={publishedAt}>
          {formatDateJa(publishedAt)}
        </time>
      </div>

      {heroImageUrl ? (
        <div className={cx(figureFrameRecipe({ ratio: "wide" }), css({ mt: "3.5" }))}>
          <Image
            alt=""
            height={400}
            preload
            sizes="(max-width: 800px) 100vw, 768px"
            src={heroImageUrl}
            width={640}
          />
        </div>
      ) : null}
    </>
  );
}
