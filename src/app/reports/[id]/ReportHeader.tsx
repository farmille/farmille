import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { formatDateJa } from "@/components/format-date";
import { MaterialCard } from "@/components/MaterialCard";
import type { PublishedUsageReportDetail } from "@/server/queries/usage-reports";

import { css } from "../../../../styled-system/css";
import { articleTitle, byline } from "../../articles/_components/Reading";

type ReportHeaderProps = {
  report: Pick<
    PublishedUsageReportDetail,
    "title" | "author" | "publishedAt" | "purposeTags" | "material"
  >;
  cropLabel: string;
  standpointLabel: string | undefined;
  materialPath: string;
};

const tagStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  px: "2.5",
  py: "1",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "primary.700/30",
  borderRadius: "pill",
  bg: "primary.100",
  color: "text.brandOnSoft",
  fontSize: "sm",
  fontWeight: "semibold",
});

function Tag({ category, label }: { category: string; label: string }) {
  return (
    <span className={tagStyle}>
      <span className={css({ fontSize: "2xs", fontWeight: "bold", opacity: "label" })}>
        {category}
      </span>
      {label}
    </span>
  );
}

export function ReportHeader({
  report,
  cropLabel,
  standpointLabel,
  materialPath,
}: ReportHeaderProps) {
  return (
    <>
      <h1 className={articleTitle}>{report.title}</h1>
      <div className={byline.row}>
        <Link href={`/users/${report.author.userId}`} className={byline.link}>
          <Avatar name={report.author.handle} src={report.author.avatarUrl} size="sm" />
          <span className={byline.name}>{report.author.handle}</span>
        </Link>
        <time className={byline.sub} dateTime={report.publishedAt}>
          {formatDateJa(report.publishedAt)}
        </time>
        {standpointLabel ? <span className={byline.sub}>{standpointLabel}</span> : null}
      </div>
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5", mt: "3" })}>
        <Tag category="作物" label={cropLabel} />
        {report.purposeTags.map((tag) => (
          <Tag key={tag} category="効果" label={tag} />
        ))}
      </div>
      <div className={css({ mt: "3.5" })}>
        <div className={css({ mb: "1.5", textStyle: "note", color: "text.subtle" })}>対象資材</div>
        <MaterialCard
          variant="list"
          href={materialPath}
          name={report.material.name}
          maker={report.material.manufacturerName}
          rating={report.material.avgRating}
          imageSrc={report.material.imageUrl ?? undefined}
        />
      </div>
    </>
  );
}
