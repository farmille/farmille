import type { ReactNode } from "react";

import { Avatar } from "@/components/Avatar";
import { formatDateJa } from "@/components/format-date";

import { css } from "../../../../styled-system/css";
import { Chip } from "../../materials/[id]/_components/CardParts";
import { FeedCard } from "./FeedCard";

const shortDate = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

type FeedReportCardProps = {
  href: string;
  title: string;
  author: string;
  avatarSrc?: string | null;
  coverSrc?: string | null;
  publishedAt?: string;
  crop?: string | null;
  actions: ReactNode;
};

export function FeedReportCard({
  href,
  title,
  author,
  avatarSrc,
  coverSrc,
  publishedAt,
  crop,
  actions,
}: FeedReportCardProps) {
  return (
    <FeedCard href={href} title={title} coverSrc={coverSrc}>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "2",
          rowGap: "1",
          mt: "auto",
          pt: "2",
          fontSize: "sm",
          color: "text.subtle",
        })}
      >
        <Avatar name={author} src={avatarSrc} size="xs" />
        <b
          className={css({
            fontWeight: "normal",
            color: "text.muted",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minW: "0",
            maxW: "[calc(100% - token(sizes.9))]",
          })}
        >
          {author}
        </b>
        {crop ? <Chip>{crop}</Chip> : null}
        {publishedAt ? (
          <time
            className={css({ ml: "auto", flexShrink: "0", textStyle: "note" })}
            dateTime={publishedAt}
            title={formatDateJa(publishedAt)}
          >
            {shortDate.format(new Date(publishedAt))}
          </time>
        ) : null}
      </div>
      {actions}
    </FeedCard>
  );
}
