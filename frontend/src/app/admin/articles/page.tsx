import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "記事管理",
};

// spec §6.4: B3 骨組み。記事執筆は Git PR + markdown 運用 (spec §1.3 / docs/specs/articles.md)。
export default function AdminArticlesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        記事管理 (B3)
      </h1>
      <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
        <p className="text-lg font-medium text-foreground">準備中</p>
        <p className="text-sm text-muted-foreground">
          v1 では記事は Git PR + markdown で管理しています。UI ベース編集は次フェーズで検討します。
        </p>
        <p className="text-xs text-muted-foreground">
          関連: docs/specs/articles.md / docs/specs/maker-approval-admin.md §1.3
        </p>
      </div>
    </div>
  );
}
