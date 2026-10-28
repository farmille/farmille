import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { formatDateJa } from "@/components/format-date";
import { MaterialCard } from "@/components/MaterialCard";
import { ReportFacts } from "@/components/ReportFacts";
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
      </div>
      <ReportFacts
        crop={cropLabel}
        effects={report.purposeTags}
        standpoint={standpointLabel}
        className={css({ mt: "3" })}
      />
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
