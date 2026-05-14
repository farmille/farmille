import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "通報管理",
};

// spec §6.4: B2 骨組み。通報キュー処理は v1.5+ (spec §1.3)。
export default function AdminReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        通報管理 (B2)
      </h1>
      <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
        <p className="text-lg font-medium text-foreground">準備中</p>
        <p className="text-sm text-muted-foreground">
          通報キュー処理 UI は v1.5+ で実装予定です。v1 では運営に直接ご連絡ください。
        </p>
        <p className="text-xs text-muted-foreground">
          関連: docs/specs/maker-approval-admin.md §1.3
        </p>
      </div>
    </div>
  );
}
