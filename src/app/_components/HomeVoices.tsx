import Link from "next/link";

import { formatDateJa } from "@/components/format-date";
import { Icon } from "@/components/Icon";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { PostActionsLoader } from "@/components/PostActionsLoader";
import { publicProfileLabel } from "@/lib/public-profile-label";
import { MockAvatar, MockStars } from "@/app/materials/[id]/_components/MockParts";
import { getCatalogSearch, type CatalogSearch } from "@/server/queries/catalog-search";
import { listRecentReviews, type RecentReviewItem } from "@/server/queries/reviews";
import { listRecentUsageReports, type RecentUsageReportItem } from "@/server/queries/usage-reports";

/** 見本の生産者の声は実証詳細レポート3件・感想口コミ4件。 */
const REPORT_LIMIT = 3;
const REVIEW_LIMIT = 4;

type MaterialSummary = { id: string; name: string; maker: string; imageUrl: string | null };

function materialSummary(
  catalog: CatalogSearch,
  id: string,
  fallbackName: string,
): MaterialSummary {
  const material = catalog.materials.find((row) => row.id === id);
  return {
    id,
    name: material?.name ?? fallbackName,
    maker: material?.manufacturer_name ?? "",
    imageUrl:
      material?.material_images
        .filter((image) => image.is_current)
        .toSorted((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
  };
}

/** 見本の prodRow（`.vc-prod`）。資材ページの該当欄へ移る。 */
function VoiceMaterialRow({ material, anchor }: { material: MaterialSummary; anchor: string }) {
  return (
    <Link className="vc-prod" href={`/materials/${material.id}#${anchor}`}>
      <span className="thumb" aria-hidden="true">
        {material.imageUrl ? (
          <Image alt="" src={material.imageUrl} width={34} height={34} sizes="34px" />
        ) : (
          "NO IMAGE"
        )}
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="vp-name">{material.name}</div>
        {material.maker ? (
          <div
            className="muted"
            style={{
              fontSize: 10,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {material.maker}
          </div>
        ) : null}
      </div>
      <span className="arr" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function VoiceReportCard({
  report,
  material,
}: {
  report: RecentUsageReportItem;
  material: MaterialSummary;
}) {
  const href = `/reports/${report.id}`;
  return (
    <article className="alist-card">
      <Link href={href} className="cover" aria-label={report.title}>
        {report.coverUrl ? (
          <Image
            alt=""
            src={report.coverUrl}
            width={640}
            height={480}
            sizes="(min-width: 900px) 360px, 74vw"
          />
        ) : (
          <Icon name="image" size="lg" />
        )}
      </Link>
      <div className="abody">
        <Link href={href} className="t">
          {report.title}｜{report.cropName}
        </Link>
        {report.summary ? <div className="rp-ex">{report.summary}</div> : null}
        <div className="rp-by">
          <MockAvatar name={report.authorHandle} extraSmall />
          <b>{report.authorHandle}</b>
          <span className="rp-time">{formatDateJa(report.publishedAt)}</span>
        </div>
        <PostActionsLoader
          target="usage_report"
          id={report.id}
          currentPath="/"
          helpfulCount={report.helpfulCount}
        />
        <VoiceMaterialRow material={material} anchor="anchorReports" />
      </div>
    </article>
  );
}

function VoiceReviewCard({
  review,
  material,
}: {
  review: RecentReviewItem;
  material: MaterialSummary;
}) {
  const handle = review.author?.handle ?? "退会したユーザー";
  const role = publicProfileLabel(review.author);
  const crops = review.crops.map((crop) => crop.name).join("・");
  return (
    <article className="card voice-card">
      <div className="vc-head">
        <MockAvatar name={handle} src={review.author?.avatar_url} extraSmall />
        <div>
          <b>{handle}</b> {role ? <span className="chip">{role}</span> : null}
          <div className="muted" style={{ fontSize: 10.5, marginTop: 1 }}>
            {crops ? `${crops}で使用 ・ ` : ""}
            {formatDateJa(review.created_at)}
          </div>
        </div>
      </div>
      <div className="stars">
        <MockStars value={review.rating} />
      </div>
      <div className="vc-text">{review.body}</div>
      <PostActionsLoader
        target="review"
        id={review.id}
        currentPath="/"
        helpfulCount={review.helpfulCount}
      />
      <VoiceMaterialRow material={material} anchor="anchorReviews" />
    </article>
  );
}

/** 見本 S.home の「生産者の声」。新着の実証詳細レポートと感想口コミ（公開中のみ）。 */
export async function HomeVoices() {
  const [reportsResult, reviewsResult, catalog] = await Promise.all([
    listRecentUsageReports({ limit: REPORT_LIMIT }),
    listRecentReviews({ limit: REVIEW_LIMIT }),
    getCatalogSearch(),
  ]);
  if (!reportsResult.ok) throw new Error("新着の実証詳細レポートを取得できませんでした。");
  if (!reviewsResult.ok) throw new Error("新着の感想口コミを取得できませんでした。");
  const reports = reportsResult.data;
  const reviews = reviewsResult.data;

  return (
    <section aria-labelledby="home-voices-heading">
      <div className="sec-h" style={{ marginTop: 34 }}>
        <h2 id="home-voices-heading">生産者の声</h2>
      </div>
      <h3 className="voice-sub">実証詳細レポート</h3>
      {reports.length > 0 ? (
        <div className="report-scroll voice-reps">
          {reports.map((report) => (
            <VoiceReportCard
              key={report.id}
              report={report}
              material={materialSummary(catalog, report.materialId, report.materialName)}
            />
          ))}
        </div>
      ) : (
        <div className="card pad">
          <p className="muted" style={{ fontSize: 12.5 }}>
            公開中の実証詳細レポートはまだありません。
          </p>
        </div>
      )}
      <h3 className="voice-sub">感想口コミ</h3>
      {reviews.length > 0 ? (
        <div className="voice-scroll">
          {reviews.map((review) => (
            <VoiceReviewCard
              key={review.id}
              review={review}
              material={materialSummary(catalog, review.material_id, review.materialName)}
            />
          ))}
        </div>
      ) : (
        <div className="card pad">
          <p className="muted" style={{ fontSize: 12.5 }}>
            公開中の感想口コミはまだありません。
          </p>
        </div>
      )}
    </section>
  );
}
