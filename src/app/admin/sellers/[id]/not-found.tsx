import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel, adminInlineNoteStyle } from "@/app/admin/_components/AdminUI";
import { css } from "../../../../../styled-system/css";

const linkStyle = css({
  color: "brand.primary",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

export default function AdminSellerNotFound() {
  return (
    <AdminShell backHref="/admin/sellers" backLabel="メーカー確認" title="メーカーが見つかりません">
      <Panel title="対象なし">
        <p className={adminInlineNoteStyle}>
          指定されたメーカーアカウントは存在しないか、削除された可能性があります。
        </p>
        <p>
          <Link className={linkStyle} href="/admin/sellers">
            一覧へ戻る
          </Link>
        </p>
      </Panel>
    </AdminShell>
  );
}
