import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "注目の資材",
};

// spec §6.4: B7 骨組み。注目の資材は v1 では SQL 運用 (spec §1.3)。
export default function AdminFeaturedProductsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        注目の資材 (B7)
      </h1>
      <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
        <p className="text-lg font-medium text-foreground">準備中</p>
        <p className="text-sm text-muted-foreground">
          v1 では featured_products テーブルへの SQL 直挿入で運用しています。UI 編集は次フェーズで検討します。
        </p>
        <p className="text-xs text-muted-foreground">
          関連: docs/specs/home.md / docs/specs/maker-approval-admin.md §1.3
        </p>
      </div>
    </div>
  );
}
