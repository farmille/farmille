import type { ReactNode } from "react";

import { formatDateJa } from "@/components/format-date";

import { css } from "../../../../styled-system/css";
import { MockAvatar, MockChip } from "../../materials/[id]/_components/MockParts";
import { FeedCard } from "./FeedCard";

/** 投稿日（カードが狭いので「2026/9/6」の短い形）。 */
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
  /** 作物名（本番の ReportCard と同じく投稿者の横に出す）。 */
  crop?: string | null;
  /** 参考になった・保存・閲覧数（PostActionsLoader）。 */
  actions: ReactNode;
};

/**
 * 実証詳細レポートのカード。
 * 本文の抜粋・投稿者の立場・資材の小カードは一覧のデータに無いため出さない。
 */
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
      {/* 狭いカードで作物・投稿日が投稿者名を幅 0 まで縮めないよう、入りきらなければ次の行へ回す */}
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
        <MockAvatar name={author} src={avatarSrc} extraSmall />
        <b
          className={css({
            fontWeight: "normal",
            color: "text.muted",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minW: "0",
            maxW: "calc(100% - token(sizes.9))",
          })}
        >
          {author}
        </b>
        {crop ? <MockChip>{crop}</MockChip> : null}
        {publishedAt ? (
          <time
            className={css({ ml: "auto", flexShrink: "0", fontSize: "xs" })}
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
