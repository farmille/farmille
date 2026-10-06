import Link from "next/link";

import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { MockImagePlaceholderIcon, MockThumbIcon, MockViewCount } from "./MockIcons";

type OrgArticleCardProps = {
  href: string;
  title: string;
  organization: string;
  /** 見本の type-label（メーカー・JA・専門家）。本番の記事はメーカーだけ。 */
  typeLabel: string;
  coverSrc?: string | null;
  helpfulCount: number;
  viewCount: number;
};

/**
 * 見本の orgArticleCard（`.alist-card[data-kind="other"]`）。
 * 参考になったの件数は表示だけ（押すのは記事ページ）。
 */
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
    <article className="alist-card" data-kind="other">
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
        <div className="by">
          <span className="org-mini" aria-hidden="true">
            {organization.charAt(0)}
          </span>
          {organization}
          <span className="type-label" style={{ fontSize: 9.5 }}>
            {typeLabel}
          </span>
        </div>
        <div className="foot">
          <span className="helpful-btn" aria-label={`参考になった ${helpfulCount}件`}>
            <MockThumbIcon />
            <span className="hb-label">参考になった</span>
            {helpfulCount}
          </span>
          <MockViewCount count={viewCount} />
        </div>
      </div>
    </article>
  );
}
