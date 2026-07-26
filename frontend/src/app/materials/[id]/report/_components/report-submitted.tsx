import Link from "next/link";

import { css } from "../../../../../../styled-system/css";
import { CheckIcon } from "@/components/icons";
import type { SubmittedUsageReport } from "@/server/queries/usage-report-form";

const shell = css({
  px: "4",
  py: "10",
  textAlign: "center",
});

const icon = css({
  w: "14",
  h: "14",
  mx: "auto",
  display: "grid",
  placeItems: "center",
  borderRadius: "pill",
  bg: "brand.primary",
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
  bg: "brand.soft",
  color: "brand.primaryDeep",
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
  minH: "11",
  borderRadius: "button",
  bg: "brand.primary",
  color: "surface.card",
  px: "5",
  fontSize: "md",
  fontWeight: "700",
  textDecoration: "none",
});

export function ReportSubmitted({
  materialId,
  reports,
  justSubmitted = false,
}: {
  materialId: string;
  reports: SubmittedUsageReport[];
  justSubmitted?: boolean;
}) {
  return (
    <main className={shell}>
      <div className={icon}>
        <CheckIcon size={28} />
      </div>
      <h1 className={title}>
        {justSubmitted ? "レポートを提出しました" : "レポートは提出済みです"}
      </h1>
      <p className={description}>
        編集部で確認後に公開されます。
        <br />
        提出後のレポートは、確認が終わるまで編集できません。
      </p>
      {reports.length > 0 ? (
        <div className={reportList}>
          {reports.map((report) => (
            <div key={report.id} className={reportRow}>
              <span>{report.cropName}</span>
              <span className={status}>編集部で確認中</span>
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
