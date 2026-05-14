import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ユーザー管理",
};

// spec §6.4: B6 骨組み。詳細は Sprint 4 以降 / v1.5+。
// admin role guard は layout.tsx 側で通過済。
export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        ユーザー管理 (B6)
      </h1>
      <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
        <p className="text-lg font-medium text-foreground">準備中</p>
        <p className="text-sm text-muted-foreground">
          v1 ではロール昇格 / 凍結は SQL 直対応 + /v1/admin/users/&#123;id&#125;/role API
          で運用しています。UI は次フェーズで実装します。
        </p>
        <p className="text-xs text-muted-foreground">
          関連: docs/decisions/0009-maker-approval-flow-and-admin-panel.md / docs/specs/maker-approval-admin.md §5.5
        </p>
      </div>
    </div>
  );
}
