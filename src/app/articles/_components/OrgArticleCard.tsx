import { Badge } from "@/components/Badge";
import { helpfulPillRecipe } from "@/components/helpful-pill";

import { css } from "../../../../styled-system/css";
import { FeedCard } from "./FeedCard";
import { ThumbIcon, ViewCount } from "./ArticleIcons";

type OrgArticleCardProps = {
  href: string;
  title: string;
  organization: string;
  typeLabel: string;
  coverSrc?: string | null;
  helpfulCount: number;
  viewCount: number;
};

export function OrgArticleCard({
  href,
  title,
  organization,
  typeLabel,
  coverSrc,
  helpfulCount,
  viewCount,
}: OrgArticleCardProps) {
  return (
    <FeedCard href={href} title={title} coverSrc={coverSrc}>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5",
          mt: "1.5",
          fontSize: "xs",
          color: "text.muted",
        })}
      >
        <span
          className={css({
            w: "4.5",
            h: "4.5",
            borderRadius: "mark",
            bg: "primary.100",
            display: "grid",
            placeItems: "center",
            flexShrink: "0",
            fontSize: "2xs",
            fontWeight: "extrabold",
            color: "primary.800",
          })}
          aria-hidden="true"
        >
          {organization.charAt(0)}
        </span>
        {organization}
        <Badge variant="type">{typeLabel}</Badge>
      </div>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: "1.5",
        })}
      >
        <span
          className={css(helpfulPillRecipe.raw({ layout: "card" }), {
            "& svg": { display: "block" },
          })}
          aria-label={`参考になった ${helpfulCount}件`}
        >
          <ThumbIcon />
          <span>参考になった</span>
          {helpfulCount}
        </span>
        <ViewCount count={viewCount} size="sm" />
      </div>
    </FeedCard>
  );
}
