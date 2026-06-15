import Image from "next/image";
import { PRODUCT_IMAGES_ENABLED } from "@/lib/flags";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type MyReview = {
  id: string;
  product_id: string;
  product_name: string | null;
  product_maker_name: string | null;
  product_image_url: string | null;
  rating: number;
  body: string;
  // レビュー承認フロー (2026-06-13): 自分のレビューの公開状態。
  status?: "pending" | "approved" | "rejected" | null;
  rejection_reason?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export function ReviewCard({ review }: { review: MyReview }) {
  return (
    <li className="rounded-md border border-border bg-card p-4 flex gap-4">
      {PRODUCT_IMAGES_ENABLED && review.product_image_url ? (
        <Image
          src={review.product_image_url}
          alt={review.product_name ?? ""}
          width={96}
          height={96}
          className="h-24 w-24 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-24 w-24 rounded bg-muted flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href={`/products/${review.product_id}`}
            className="text-base font-medium hover:text-primary truncate"
          >
            {review.product_name ?? "（製品情報なし）"}
          </Link>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {review.created_at?.slice(0, 10) ?? ""}
          </span>
        </div>
        {review.product_maker_name && (
          <p className="text-xs text-muted-foreground">
            {review.product_maker_name}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm">★ {review.rating}</span>
          <ReviewStatusBadge
            status={review.status}
            rejectionReason={review.rejection_reason}
          />
        </div>
        <p className="text-sm whitespace-pre-wrap line-clamp-3">
          {review.body}
        </p>
        <div className="pt-2 flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/products/${review.product_id}#review-${review.id}`}
            >
              編集へ
            </Link>
          </Button>
        </div>
      </div>
    </li>
  );
}

function ReviewStatusBadge({
  status,
  rejectionReason,
}: {
  status?: "pending" | "approved" | "rejected" | null;
  rejectionReason?: string | null;
}) {
  if (status === "pending") {
    return (
      <span
        className="inline-block rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700"
        title="運営の承認後に公開されます"
      >
        承認待ち
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span
        className="inline-block rounded border border-slate-500/30 bg-slate-500/15 px-2 py-0.5 text-xs text-slate-700"
        title={rejectionReason ?? "このレビューは公開されませんでした"}
      >
        非公開（却下）
      </span>
    );
  }
  // approved / 不明: バッジなし（公開中）
  return null;
}
