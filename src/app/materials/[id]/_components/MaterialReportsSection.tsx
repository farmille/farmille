import Link from "next/link";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import { listPublishedArticlesByMaterial } from "@/server/queries/material-content";
import type { MaterialDetail } from "@/server/queries/materials";

import { loadMaterialReports } from "../material-reports";
import { unwrapQueryResult } from "../query-result";
import { MockReportCard } from "./MockReportCard";

const secHeadStyle = { marginTop: 26 } as const;

/** 見本 S.material の実証詳細レポート見出し（`.sec-h`）。読み込み中の表示でも使う。 */
export function ReportsHeading({ count }: { count?: number }) {
  return (
    <div className="sec-h" id="anchorReports" style={secHeadStyle}>
      <h2 id="usage-reports-heading">
        実証詳細レポート{" "}
        {count === undefined ? null : (
          <span className="muted tnum" style={{ fontSize: 12 }}>
            {count}件
          </span>
        )}
      </h2>
    </div>
  );
}

/** 資材カードの「実証詳細レポート N件」。件数がある時は見本どおり強調する。 */
export async function HeroReportCount({ materialId }: { materialId: string }) {
  const reports = unwrapQueryResult(await loadMaterialReports(materialId));
  return (
    <b
      className="tnum"
      style={{
        color: reports.total > 0 ? "var(--amber)" : "var(--ink)",
        fontSize: reports.total > 0 ? "1.15em" : "1em",
      }}
    >
      {reports.total}件
    </b>
  );
}

/** 見本 S.material の boxReports。会員登録の案内は未ログインのときだけ出す。 */
export async function MaterialReportsSection({
  material,
  signedIn,
}: {
  material: MaterialDetail;
  signedIn: boolean;
}) {
  const [reportsResult, articlesResult] = await Promise.all([
    loadMaterialReports(material.id),
    listPublishedArticlesByMaterial(material.id),
  ]);
  const reports = unwrapQueryResult(reportsResult);
  const articles = unwrapQueryResult(articlesResult);
  const materialPath = `/materials/${material.id}`;
  const next = encodeURIComponent(materialPath);

  return (
    <section aria-labelledby="usage-reports-heading">
      <div className="sec-h" id="anchorReports" style={secHeadStyle}>
        <h2 id="usage-reports-heading">
          実証詳細レポート{" "}
          <span className="muted tnum" style={{ fontSize: 12 }}>
            {reports.total}件
          </span>
        </h2>
        <Link className="link-more" href={`${materialPath}/articles`}>
          すべて見る →
        </Link>
      </div>
      {reports.items.length > 0 ? (
        <div className="report-scroll">
          {reports.items.map((report) => (
            <MockReportCard
              key={report.id}
              href={`/reports/${report.id}`}
              title={report.title ?? `${material.name} 実証詳細レポート`}
              author={report.author?.handle ?? "退会したユーザー"}
              avatarSrc={report.author?.avatar_url}
              coverSrc={report.coverImage?.url}
              crop={report.crop?.name}
              actions={
                <PostActionsLoader
                  target="usage_report"
                  id={report.id}
                  currentPath={`/reports/${report.id}`}
                  helpfulCount={report.helpfulCount}
                />
              }
            />
          ))}
        </div>
      ) : (
        <div className="card pad">
          <p style={{ fontSize: 13, fontWeight: 700 }}>公開中の実証詳細レポートはまだありません</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            投稿された実証詳細レポートは、編集部の確認後に公開されます。
          </p>
        </div>
      )}
      {!signedIn && reports.items.length > 0 ? (
        <div className="card pad" style={{ marginTop: 10, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            実証詳細レポートの続きを読むには、会員登録が必要です
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 9,
              flexWrap: "wrap",
            }}
          >
            <Link
              className="btn btn-primary btn-sm"
              href={`/signup/general?next=${next}`}
              style={{ textDecoration: "none" }}
            >
              無料会員登録して読む（1分）
            </Link>
            <Link className="link-more" href={`/login?next=${next}`} style={{ fontSize: 12 }}>
              ログインはこちら →
            </Link>
          </div>
        </div>
      ) : null}
      {articles.total > 0 ? (
        <div style={{ marginTop: 12 }}>
          <Link className="link-more" href={`${materialPath}/articles`}>
            メーカーの記事 {articles.total}件 →
          </Link>
        </div>
      ) : null}
    </section>
  );
}
