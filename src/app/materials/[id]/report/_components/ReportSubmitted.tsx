import Link from "next/link";

import { css } from "../../../../../../styled-system/css";
import { SuccessMark } from "@/components/SuccessMark";
import type { SubmittedUsageReport } from "@/server/queries/usage-report-form";

const shell = css({
  w: "100%",
  maxW: "content.form",
  mx: "auto",
  px: "4",
  py: "10",
  textAlign: "center",
});

const title = css({ mt: "4", fontSize: "2xl" });

const description = css({
  mt: "3",
  color: "text.muted",
  textStyle: "supporting",
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
  borderRadius: "card",
  bg: "surface.card",
  px: "3",
  py: "3",
  textStyle: "body",
});

const status = css({
  flexShrink: "0",
  borderRadius: "pill",
  bg: "primary.soft",
  color: "primary.700",
  px: "2.5",
  py: "1",
  fontSize: "xs",
  fontWeight: "bold",
});

const link = css({
  mt: "6",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minH: "11",
  borderRadius: "button",
  bg: "primary.700",
  color: "text.inverse",
  px: "5",
  fontSize: "md",
  fontWeight: "bold",
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
      <SuccessMark tone="solid" />
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
