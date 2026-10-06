import Link from "next/link";
import type { ReactNode } from "react";

import { formatDateJa } from "@/components/format-date";
import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { MockAvatar } from "../../materials/[id]/_components/MockParts";
import { MockImagePlaceholderIcon } from "./MockIcons";

/** 見本の rpTime の位置に出す投稿日（カードが狭いので「2026/9/6」の短い形）。 */
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
  /** 参考になった・保存・閲覧数（PostActionsLoader）。見本の .rp-foot にあたる。 */
  actions: ReactNode;
};

/**
 * 見本の reportCard（`.alist-card[data-kind="report"]`）。
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
    <article className="alist-card" data-kind="report">
      <Link href={href} className="cover" aria-label={title}>
        {coverSrc ? (
          <Image
            alt=""
            src={coverSrc}
            width={640}
            height={480}
            sizes="(min-width: 900px) 420px, 50vw"
          />
        ) : (
          <MockImagePlaceholderIcon />
        )}
      </Link>
      <div className="abody">
        <Link href={href} className="t">
          {title}
        </Link>
        <div className="rp-by">
          <MockAvatar name={author} src={avatarSrc} extraSmall />
          <b>{author}</b>
          {crop ? (
            <span className="chip" style={{ flex: "0 0 auto" }}>
              {crop}
            </span>
          ) : null}
          {publishedAt ? (
            <time className="rp-time" dateTime={publishedAt} title={formatDateJa(publishedAt)}>
              {shortDate.format(new Date(publishedAt))}
            </time>
          ) : null}
        </div>
        {actions}
      </div>
    </article>
  );
}
