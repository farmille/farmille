import type { Metadata } from "next";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import {
  DescriptionList,
  OptionalValue,
  Panel,
  adminInlineNoteStyle,
  type DescriptionItem,
} from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { UsageReportEditorialForm } from "@/app/admin/usage-reports/[id]/EditorialForm";
import { UsageReportArticle } from "@/components/UsageReportArticle";
import { DataTable, formatDateJa, type DataTableColumn } from "@/components";
import { isPrefectureCode, PREFECTURES } from "@/lib/prefectures";
import {
  EDITORIAL_REPORT_STATUS_LABELS,
  getUsageReportEditorialDetail,
  type UsageReportEditorialDetail,
} from "@/server/admin/usage-reports";
import { errorMessageJa } from "@/server/errors";
import { cultivationTypeDisplayLabel } from "@/server/usage-reports/application-detail";
import { mediaPlacementLabel } from "@/server/usage-reports/model";
import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "実証詳細レポート編集",
};

const linkStyle = css({
  color: "primary.700",
  fontWeight: "bold",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

const mediaGridStyle = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "3",
  tab: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
});

const mediaStyle = css({
  w: "100%",
  maxH: "360px",
  objectFit: "contain",
  bg: "surface.panel",
  borderRadius: "card",
});

const captionStyle = css({
  mt: "1.5",
  color: "text.subtle",
  fontSize: "sm",
  lineHeight: "relaxed",
});

type Metric = UsageReportEditorialDetail["metrics"][number];

const metricColumns: DataTableColumn<Metric>[] = [
  { key: "name", header: "指標", cell: (row) => row.metricName },
  {
    key: "treated",
    header: "処理区",
    cell: (row) => valueWithUnit(row.treatedValue, row.unit),
    align: "end",
  },
  {
    key: "untreated",
    header: "対照区",
    cell: (row) => valueWithUnit(row.untreatedValue, row.unit),
    align: "end",
  },
];

function valueWithUnit(value: number | null, unit: string | null): string {
  if (value === null) return "未設定";
  return unit === null ? String(value) : `${value} ${unit}`;
}

function prefectureName(code: number | null): string | null {
  if (code === null) return null;
  if (!isPrefectureCode(code)) throw new Error(`未対応の都道府県コードです：${code}`);
  return PREFECTURES[code - 1].name;
}

function purposeItems(report: UsageReportEditorialDetail): DescriptionItem[] {
  return [
    {
      term: "使用目的",
      value:
        report.purposeTags.length === 0 ? (
          <OptionalValue value={null} />
        ) : (
          report.purposeTags.join("・")
        ),
    },
    { term: "目的の補足", value: <OptionalValue value={report.purposeNote} /> },
  ];
}

function environmentItems(report: UsageReportEditorialDetail): DescriptionItem[] {
  return [
    { term: "都道府県", value: <OptionalValue value={prefectureName(report.prefectureCode)} /> },
    { term: "圃場名", value: <OptionalValue value={report.fieldName} /> },
    { term: "作物", value: report.crop.name },
    { term: "品種", value: <OptionalValue value={report.variety} /> },
    {
      term: "定植日",
      value:
        report.plantingDate === null ? (
          <OptionalValue value={null} />
        ) : (
          formatDateJa(report.plantingDate)
        ),
    },
    {
      term: "栽培形態",
      value: <OptionalValue value={cultivationTypeDisplayLabel(report.cultivationType)} />,
    },
    {
      term: "栽培タグ",
      value:
        report.cultivationTags.length === 0 ? (
          <OptionalValue value={null} />
        ) : (
          report.cultivationTags.join("・")
        ),
    },
    { term: "生育ステージ", value: <OptionalValue value={report.growthStage} /> },
    { term: "気候・使用前の状況", value: <OptionalValue value={report.climateNote} /> },
  ];
}

function applicationItems(report: UsageReportEditorialDetail): DescriptionItem[] {
  return report.applications.map((application, index) => ({
    term: `${index + 1}回目`,
    value: [
      application.appliedOn === null ? null : `処理日：${formatDateJa(application.appliedOn)}`,
      application.method === null ? null : `方法：${application.method}`,
      application.detail,
    ]
      .filter((line): line is string => line !== null && line.length > 0)
      .join("\n"),
  }));
}

export default async function AdminUsageReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/admin/usage-reports/${id}`);

  const report = await getUsageReportEditorialDetail(id);

  if (!report.ok) {
    if (report.error === "not_found") notFound();
    throw new Error(errorMessageJa[report.error]);
  }

  const data = report.data;

  return (
    <AdminShell
      backHref="/admin/usage-reports"
      backLabel="実証詳細レポート編集局"
      description={`状態：${EDITORIAL_REPORT_STATUS_LABELS[data.status]}`}
      title={data.title}
    >
      <Panel note="投稿者・対象・処理状態" title="基本情報">
        <DescriptionList
          items={[
            {
              term: "投稿者",
              value: (
                <Link className={linkStyle} href={`/users/${data.author.userId}`}>
                  {data.author.handle}
                </Link>
              ),
            },
            {
              term: "資材",
              value: (
                <Link className={linkStyle} href={`/admin/materials/${data.material.id}`}>
                  {data.material.name}
                </Link>
              ),
            },
            { term: "提出日", value: formatDateJa(data.createdAt) },
            {
              term: "公開日",
              value:
                data.publishedAt === null ? (
                  <OptionalValue value={null} />
                ) : (
                  formatDateJa(data.publishedAt)
                ),
            },
          ]}
        />
        {data.status === "published" ? (
          <p className={adminInlineNoteStyle}>
            <Link className={linkStyle} href={`/reports/${data.id}`}>
              公開中の実証詳細レポートを見る
            </Link>
          </p>
        ) : null}
      </Panel>

      {data.structured !== null ? (
        <Panel title="記事の内容">
          <UsageReportArticle input={data.structured} documentUrls={data.documentUrls} />
        </Panel>
      ) : (
        <>
          <Panel title="使用目的">
            <DescriptionList items={purposeItems(data)} />
          </Panel>

          <Panel title="栽培環境">
            <DescriptionList items={environmentItems(data)} />
          </Panel>

          <Panel note={`${data.applications.length} 件`} title="処理日・使用方法">
            {data.applications.length === 0 ? (
              <p className={adminInlineNoteStyle}>登録なし</p>
            ) : (
              <DescriptionList items={applicationItems(data)} />
            )}
          </Panel>

          <Panel note={`${data.media.length} 件`} title="写真・動画">
            {data.media.length === 0 ? (
              <p className={adminInlineNoteStyle}>登録なし</p>
            ) : (
              <div className={mediaGridStyle}>
                {data.media.map((media) => (
                  <figure className={css({ m: "0" })} key={media.id}>
                    {media.mediaType === "photo" ? (
                      <Image
                        alt={media.caption ?? ""}
                        className={mediaStyle}
                        height={480}
                        sizes="(min-width: 768px) 50vw, 100vw"
                        src={media.url}
                        width={640}
                      />
                    ) : (
                      <video className={mediaStyle} controls src={media.url} />
                    )}
                    <figcaption className={captionStyle}>
                      {media.placement === null
                        ? "配置未設定"
                        : `配置：${mediaPlacementLabel(media.placement)}`}
                      {media.caption === null ? "" : `／${media.caption}`}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </Panel>

          <Panel note={`${data.metrics.length} 件`} title="収穫調査">
            <DataTable
              columns={metricColumns}
              emptyMessage="収穫調査は登録されていません。"
              rowKey={(row) => row.id}
              rows={data.metrics}
            />
          </Panel>
        </>
      )}

      <Panel note="公開内容と内部メモ" title="編集局調整">
        <UsageReportEditorialForm report={data} />
      </Panel>
    </AdminShell>
  );
}
