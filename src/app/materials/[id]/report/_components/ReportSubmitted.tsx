import Link from "next/link";

import { css } from "../../../../../../styled-system/css";
import { Icon } from "@/components/Icon";
import type { SubmittedUsageReport } from "@/server/queries/usage-report-form";

const shell = css({
  w: "100%",
  maxW: "content.form",
  mx: "auto",
  px: "4",
  py: "10",
  textAlign: "center",
});

const icon = css({
  w: "76px",
  h: "76px",
  mx: "auto",
  display: "grid",
  placeItems: "center",
  borderRadius: "pill",
  bg: "primary.700",
  color: "surface.card",
});

const title = css({ mt: "4", fontSize: "2xl", fontWeight: "800" });

const description = css({
  mt: "3",
  color: "text.muted",
  fontSize: "md",
  lineHeight: "1.7",
});

const reportList = css({
  mt: "5",
  display: "flex",
  flexDirection: "column",
  gap: "2",
  textAlign: "left",
});

const reportRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  bg: "surface.card",
  px: "3",
  py: "3",
  fontSize: "sm",
});

const status = css({
  flexShrink: "0",
  borderRadius: "pill",
  bg: "primary.200",
  color: "primary.700",
  px: "2.5",
  py: "1",
  fontSize: "xs",
  fontWeight: "700",
});

const link = css({
  mt: "6",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minH: "44px",
  borderRadius: "button",
  bg: "primary.700",
  color: "surface.card",
  px: "5",
  fontSize: "md",
  fontWeight: "700",
  textDecoration: "none",
});

export function ReportSubmitted({
  materialId,
  reports,
}: {
  materialId: string;
  reports: SubmittedUsageReport[];
}) {
  return (
    <main className={shell}>
      <div className={icon}>
        <Icon name="check" size="2xl" />
      </div>
      <h1 className={title}>レポートは提出済みです</h1>
      <p className={description}>
        運営で確認後に公開されます。
        <br />
        提出後のレポートは、確認が終わるまで編集できません。
      </p>
      {reports.length > 0 ? (
        <div className={reportList}>
          {reports.map((report) => (
            <div key={report.id} className={reportRow}>
              <span>{report.cropName}</span>
              <span className={status}>運営で確認中</span>
            </div>
          ))}
        </div>
      ) : null}
      <Link href={`/materials/${materialId}`} className={link}>
        資材ページへ戻る
      </Link>
    </main>
  );
}
