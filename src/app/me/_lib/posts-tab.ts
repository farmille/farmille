export type PostsTab = "reports" | "reviews";

/**
 * 「これまでの投稿」で開くタブ。URL で選ばれていないときは、投稿のある側を開く。
 * 両方0件と両方あるときは、実証詳細レポートを開く。
 */
export function initialPostsTab(
  requested: string | undefined,
  counts: { reports: number; reviews: number },
): PostsTab {
  if (requested === "reports" || requested === "reviews") return requested;

  return counts.reports === 0 && counts.reviews > 0 ? "reviews" : "reports";
}
