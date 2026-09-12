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
    href: "/me",
    label: "個人のマイページ",
    description: "自分のプロフィール・投稿・検討リストを管理する。",
  },
  {
    href: "/account/passkeys",
    label: "パスキーを管理",
    description: "ログインに使うパスキーの登録・削除。",
  },
  {
    href: "/account/password",
    label: "パスワードを変更",
    description: "現在のパスワードを確認し、新しいパスワードに変更する。",
  },
  {
    href: "/admin/sellers",
    label: "メーカー審査",
    description: "申請の確認・承認（共有ログイン発行）・却下・凍結・招待コード発行。",
  },
  {
    href: "/admin/materials",
    label: "資材の登録・編集・claim",
    description: "分類・検索層の種まき登録、全カラムの編集、claim の紐づけ・解除。",
  },
  {
    href: "/admin/materials/requests",
    label: "資材変更申請",
    description: "メーカーから届いた新規登録・情報変更・掲載終了申請を確認する。",
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
          <StatCard label="審査中のメーカー" value={summary.data.appliedSellerCount} />
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
          <Link
            aria-label="承認待ちの資材変更申請を見る"
            className={statLinkStyle}
            href="/admin/materials/requests"
          >
            <StatCard label="承認待ちの資材変更" value={summary.data.pendingMaterialChangeCount} />
          </Link>
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
