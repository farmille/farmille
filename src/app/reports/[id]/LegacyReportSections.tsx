import { formatDateJa } from "@/components/format-date";
import type { PublishedUsageReportDetail } from "@/server/queries/usage-reports";

import { prefectureName } from "./prefecture-name";
import { ReportBars } from "./ReportBars";
import { ReportFigures, type ReportFigureMedia } from "./ReportFigures";

function Prose({ text }: { text: string }) {
  return (
    <div className="a-body">
      <p>{text}</p>
    </div>
  );
}

function formatMetricValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * 旧形式（form_version 1）の実証詳細レポートの続き（会員だけに出す部分）。
 * 節の並びと見出しは本番のまま、見た目を見本 S.reportArticle の `.a-h3`／`.a-body`／`.figure`／`.hgraph` にそろえる。
 */
export function LegacyReportSections({
  report,
  coverId,
}: {
  report: PublishedUsageReportDetail;
  coverId: string | null;
}) {
  const methodMedia: ReportFigureMedia[] = report.media.filter(
    (m) => m.placement === "method" || (m.mediaType === "video" && m.id !== coverId),
  );
  const observationPhotos = report.media.filter(
    (m) =>
      m.mediaType === "photo" &&
      m.id !== coverId &&
      (m.placement === "observation" || m.placement === "treated" || m.placement === "untreated"),
  );
  const summaryMedia = report.media.filter((m) => m.placement === "summary");

  const envLines = [
    report.prefectureCode !== null ? `地域：${prefectureName(report.prefectureCode)}` : null,
    report.fieldName !== null && report.fieldName.length > 0 ? `圃場名：${report.fieldName}` : null,
    `使用作物：${report.crop.name}${report.variety ? `（品種：${report.variety}）` : ""}`,
    report.plantingDate !== null ? `定植時期：${formatDateJa(report.plantingDate)}ごろ` : null,
    [
      report.cultivationType,
      report.cultivationTags.length > 0 ? report.cultivationTags.join("・") : null,
    ]
      .filter((part): part is string => part !== null && part.length > 0)
      .join("｜") || null,
    report.growthStage !== null && report.growthStage.length > 0
      ? `生育ステージ：${report.growthStage}`
      : null,
  ].filter((line): line is string => line !== null);

  const applicationLines = report.applications.flatMap((app) => {
    const lines: string[] = [];
    if (app.method !== null && app.method.length > 0) {
      lines.push(`使用方法：${app.method}`);
    }
    if (app.detail !== null && app.detail.length > 0) {
      lines.push(app.detail);
    }
    if (app.appliedOn !== null) {
      lines.push(`処理日：${formatDateJa(app.appliedOn)}`);
    }
    return lines;
  });

  const purposeText = [
    report.purposeTags.length > 0 ? report.purposeTags.join("、") : null,
    report.purposeNote,
  ]
    .filter((part): part is string => part !== null && part.length > 0)
    .join("\n");

  return (
    <>
      <h2 className="a-h3">使用目的</h2>
      {purposeText ? <Prose text={purposeText} /> : null}

      <h2 className="a-h3">環境</h2>
      <Prose text={envLines.join("\n")} />

      <h2 className="a-h3">使用方法・頻度</h2>
      <Prose
        text={
          applicationLines.length > 0
            ? applicationLines.join("\n")
            : "使用方法の詳細は記録されていません。"
        }
      />
      {methodMedia.map((media) => (
        <ReportFigures key={media.id} media={[media]} />
      ))}

      {report.climateNote ? (
        <>
          <h2 className="a-h3">当時の気候・圃場の状況</h2>
          <Prose text={report.climateNote} />
        </>
      ) : null}

      <ReportFigures media={observationPhotos} grid />

      <h2 className="a-h3">マイナス・良くなかった点（薬害など）</h2>
      <Prose
        text={
          report.negativeNote !== null && report.negativeNote.length > 0
            ? report.negativeNote
            : "特に記載はありません。"
        }
      />

      {report.metrics.length > 0 ? (
        <>
          <h2 className="a-h3">収穫調査</h2>
          {report.metrics.map((metric) => (
            <ReportBars
              key={metric.id}
              title={metric.metricName}
              unit={metric.unit ?? ""}
              rows={[
                metric.untreatedValue === null
                  ? null
                  : {
                      id: `${metric.id}-untreated`,
                      label: "対照区",
                      valueText: formatMetricValue(metric.untreatedValue),
                      value: metric.untreatedValue,
                      error: null,
                      colorIndex: 0,
                    },
                metric.treatedValue === null
                  ? null
                  : {
                      id: `${metric.id}-treated`,
                      label: "処理区",
                      valueText: formatMetricValue(metric.treatedValue),
                      value: metric.treatedValue,
                      error: null,
                      colorIndex: 1,
                    },
              ].filter((row) => row !== null)}
            />
          ))}
          <div className="graph-cap">グラフは Farmille編集部が作成しています</div>
        </>
      ) : null}

      <h2 className="a-h3">まとめ・感想</h2>
      <Prose text={report.summary} />
      <ReportFigures media={summaryMedia} />
    </>
  );
}
