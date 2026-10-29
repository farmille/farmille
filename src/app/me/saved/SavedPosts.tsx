import { ReportCard } from "@/components/ReportCard";
import { ReviewCard } from "@/components/ReviewCard";
import { PostActionsLoader } from "@/components/PostActionsLoader";
import { listSavedPosts } from "@/server/queries/post-actions";
import { listRecentReviews } from "@/server/queries/reviews";
import { listRecentUsageReports } from "@/server/queries/usage-reports";
import { css } from "../../../../styled-system/css";

/** 保存した投稿にも、公開一覧と同じカードと操作を使う。 */
export async function SavedPosts({ userId }: { userId: string }) {
  const saved = await listSavedPosts(userId);
  const visible = saved.filter(
    (post) => post.review?.status === "published" || post.report?.status === "published",
  );
  const [reviews, reports] = await Promise.all([
    listRecentReviews({
      ids: visible.flatMap((post) => (post.review_id === null ? [] : [post.review_id])),
      limit: Math.max(1, visible.length),
      viewerUserId: userId,
    }),
    listRecentUsageReports({
      ids: visible.flatMap((post) => (post.usage_report_id === null ? [] : [post.usage_report_id])),
      limit: Math.max(1, visible.length),
    }),
  ]);
  if (!reviews.ok || !reports.ok) throw new Error("保存した投稿の内容を取得できませんでした。");
  const reviewById = new Map(reviews.data.map((review) => [review.id, review]));
  const reportById = new Map(reports.data.map((report) => [report.id, report]));
  return (
    <section className={css({ mt: "6" })} aria-labelledby="saved-posts-heading">
      <h2 id="saved-posts-heading" className={css({ textStyle: "title", mb: "3" })}>
        保存した投稿
      </h2>
      <div className={css({ display: "grid", gap: "3" })}>
        {visible.map((post) => {
          if (post.review_id !== null) {
            const review = reviewById.get(post.review_id);
            if (review === undefined) throw new Error("保存した感想口コミの内容が欠落しています。");
            return (
              <ReviewCard
                key={post.id}
                reviewId={review.id}
                materialId={review.material_id}
                currentPath="/me/saved"
                canManage={review.author_user_id === userId}
                handle={review.author.name}
                crop={review.crops.map((crop) => crop.name).join("・")}
                rating={review.rating}
                helpfulCount={review.helpfulCount}
                body={review.body}
                materialName={review.materialName}
                actions={
                  <PostActionsLoader
                    target="review"
                    id={review.id}
                    currentPath="/me/saved"
                    helpfulCount={review.helpfulCount}
                  />
                }
              />
            );
          }
          if (post.usage_report_id === null)
            throw new Error("保存した投稿の参照先が欠落しています。");
          const report = reportById.get(post.usage_report_id);
          if (report === undefined)
            throw new Error("保存した実証詳細レポートの内容が欠落しています。");
          return (
            <ReportCard
              key={post.id}
              reportId={report.id}
              currentPath="/me/saved"
              title={report.title}
              author={report.author.name}
              crop={report.cropName}
              helpfulCount={report.helpfulCount}
              summary={report.summary}
              coverSrc={report.coverUrl ?? undefined}
              href={`/reports/${report.id}`}
              materialName={report.materialName}
              materialHref={`/materials/${report.materialId}`}
              actions={
                <PostActionsLoader
                  target="usage_report"
                  id={report.id}
                  currentPath="/me/saved"
                  helpfulCount={report.helpfulCount}
                />
              }
            />
          );
        })}
        {visible.length === 0 ? (
          <p className={css({ textStyle: "supporting", color: "text.muted" })}>
            まだ保存した投稿がありません。
          </p>
        ) : null}
      </div>
    </section>
  );
}
