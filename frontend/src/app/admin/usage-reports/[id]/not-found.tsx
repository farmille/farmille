import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/admin-shell";
import { Panel } from "@/app/admin/_components/admin-ui";
import { css } from "../../../../../styled-system/css";

const linkStyle = css({
  color: "brand.primary",
  fontWeight: "700",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

export default function AdminUsageReportNotFound() {
  return (
    <AdminShell
      backHref="/admin/usage-reports"
      backLabel="← 使用レポート編集局"
      title="使用レポートが見つかりません"
    >
      <Panel title="確認">
        <p>対象が存在しないか、編集局へ提出されていない下書きです。</p>
        <Link className={linkStyle} href="/admin/usage-reports">
          確認待ち一覧へ戻る
        </Link>
      </Panel>
    </AdminShell>
  );
}
