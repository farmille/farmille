import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "バナー",
};

// spec §6.4: バナー骨組み。v1 では運営側 SQL / 画像差し替えで運用。
export default function AdminBannersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        バナー
      </h1>
      <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
        <p className="text-lg font-medium text-foreground">準備中</p>
        <p className="text-sm text-muted-foreground">
          v1 ではトップバナーの差し替えは運営側で SQL / 画像 URL 直編集で対応します。UI は次フェーズで検討します。
        </p>
        <p className="text-xs text-muted-foreground">
          関連: docs/specs/maker-approval-admin.md §1.3
        </p>
      </div>
    </div>
  );
}
