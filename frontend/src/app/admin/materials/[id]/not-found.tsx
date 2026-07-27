import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/admin-shell";
import { Panel, adminInlineNoteStyle } from "@/app/admin/_components/admin-ui";
import { css } from "../../../../../styled-system/css";

const linkStyle = css({
  color: "brand.primary",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

export default function AdminMaterialNotFound() {
  return (
    <AdminShell backHref="/admin/materials" backLabel="← 資材の管理" title="資材が見つかりません">
      <Panel title="対象なし">
        <p className={adminInlineNoteStyle}>
          指定された資材は存在しないか、削除された可能性があります。
        </p>
        <p>
          <Link className={linkStyle} href="/admin/materials">
            一覧へ戻る
          </Link>
        </p>
      </Panel>
    </AdminShell>
  );
}
