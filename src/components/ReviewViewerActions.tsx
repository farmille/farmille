import { ReportDialog } from "@/components/ReportDialog";
import { ReviewOwnerActions } from "@/components/ReviewOwnerActions";
import { createReportAction } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";

type ReviewViewerActionsProps = {
  reviewId: string;
  materialId: string;
  /** 閲覧者が投稿者本人のとき true。本人には編集・削除、それ以外には通報を出す。 */
  canManage: boolean;
  /** 通報の後に戻る画面のパス。 */
  reportReturnPath: string;
};

/** 感想口コミカードの右下に置く操作。資材ページとプロフィールで同じ出し分けにする。 */
export function ReviewViewerActions({
  reviewId,
  materialId,
  canManage,
  reportReturnPath,
}: ReviewViewerActionsProps) {
  if (canManage) return <ReviewOwnerActions reviewId={reviewId} materialId={materialId} />;
  return (
    <ReportDialog
      action={createReportAction.bind(null, "review", reviewId, reportReturnPath)}
      reasonOptions={REPORT_REASON_OPTIONS}
      title="この感想口コミを通報する"
    />
  );
}
