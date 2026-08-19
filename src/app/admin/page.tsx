import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel, adminInlineNoteStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { StatCard } from "@/components";
import { getAdminSummary } from "@/server/admin/summary";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../styled-system/css";

export const metadata: Metadata = {
  title: "運営管理",
};

const statGridStyle = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "3",
  md: { gridTemplateColumns: "repeat(4, 1fr)" },
});

const menuListStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
  listStyle: "none",
  m: "0",
  p: "0",
});

const menuLinkStyle = css({
  fontSize: "lg",
  fontWeight: "700",
  color: "brand.primary",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

const statLinkStyle = css({
  display: "block",
  color: "inherit",
  textDecoration: "none",
  borderRadius: "button",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
  },
});

const MENU_ITEMS = [
  {
    href: "/admin/sellers",
    label: "出品者審査",
    description: "申請の確認・承認（共有ログイン発行）・却下・凍結・招待コード発行。",
  },
  {
    href: "/admin/materials",
    label: "資材の登録・編集・claim",
    description: "分類・検索層の種まき登録、全カラムの編集、claim の紐づけ・解除。",
  },
  {
    href: "/admin/materials/requests",
    label: "分類変更申請",
    description: "出品者から届いた分類・検索層の変更依頼を処理する。",
  },
  {
    href: "/admin/tags",
    label: "タグ・作物マスタ",
    description: "検索タグと作物マスタの追加・改名・削除（使用中は削除しない）。",
  },
] as const;

export default async function AdminHomePage() {
  await requireAdminPage("/admin");

  const summary = await getAdminSummary();

  if (!summary.ok) {
    throw new Error(errorMessageJa[summary.error]);
  }

  return (
    <AdminShell description="運営が扱う審査・登録・分類管理の入口。" title="運営管理">
      <Panel note="対応待ちの件数" title="いま見るべきもの">
        <div className={statGridStyle}>
          <StatCard label="審査中の出品者" value={summary.data.appliedSellerCount} />
          <Link aria-label="未処理の通報を見る" className={statLinkStyle} href="/admin/reports">
            <StatCard label="未処理の通報" value={summary.data.openReportCount} />
          </Link>
          <Link
            aria-label="確認待ちの使用レポートを見る"
            className={statLinkStyle}
            href="/admin/usage-reports"
          >
            <StatCard label="確認待ちの使用レポート" value={summary.data.pendingUsageReportCount} />
          </Link>
          <StatCard label="未処理の分類変更申請" value={summary.data.openEditRequestCount} />
        </div>
      </Panel>

      <Panel title="機能">
        <ul className={menuListStyle}>
          {MENU_ITEMS.map((item) => (
            <li key={item.href}>
              <Link className={menuLinkStyle} href={item.href}>
                {item.label}
              </Link>
              <p className={adminInlineNoteStyle}>{item.description}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </AdminShell>
  );
}
