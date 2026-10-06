import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { MockAvatar } from "./MockParts";

type MockReportCardProps = {
  href: string;
  title: string;
  author: string;
  avatarSrc?: string | null;
  coverSrc?: string;
  /** 作物名（本番の ReportCard と同じく投稿者の横に出す）。 */
  crop?: string | null;
  /** 参考になった・保存・閲覧数（PostActionsLoader）。 */
  actions: ReactNode;
};

/**
 * 見本の reportCard（`.alist-card`）。
 * 一覧で見せるのは表紙・題名・投稿者・作物・反応（参考になった・保存・閲覧数）で、本文の抜粋は出さない（既存の資材ページと同じ範囲）。
 */
export function MockReportCard({
  href,
  title,
  author,
  avatarSrc,
  coverSrc,
  crop,
  actions,
}: MockReportCardProps) {
  return (
    <article className="alist-card">
      <Link href={href} className="cover" aria-label={title}>
        {coverSrc ? (
          <Image
            alt=""
            src={coverSrc}
            width={640}
            height={480}
            sizes="(min-width: 900px) 280px, 74vw"
          />
        ) : (
          <Icon name="image" size="lg" />
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
        </div>
        {actions}
      </div>
    </article>
  );
}
