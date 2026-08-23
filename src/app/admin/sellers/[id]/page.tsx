import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import {
  DescriptionList,
  OptionalValue,
  Panel,
  adminInlineNoteStyle,
  type DescriptionItem,
} from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { SellerReviewActions } from "@/app/admin/sellers/[id]/SellerReviewActions";
import { formatDateJa, sellerTypeLabel } from "@/components";
import {
  getSellerDetail,
  isSellerStatus,
  SELLER_STATUS_LABELS,
  type SellerDetail,
} from "@/server/admin/sellers";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "出品者の申請内容",
};

const linkStyle = css({
  color: "brand.primary",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

function statusLabel(status: string): string {
  return isSellerStatus(status) ? SELLER_STATUS_LABELS[status] : status;
}

function publicItems(seller: SellerDetail): DescriptionItem[] {
  return [
    { term: "正式名称", value: seller.official_name },
    { term: "種別", value: sellerTypeLabel(seller.seller_type) },
    { term: "ログインID", value: seller.login_id },
    { term: "本社・主な拠点", value: seller.location },
    { term: "主な地域", value: seller.region_scope },
    {
      term: "サイト",
      value:
        seller.website_url === null ? (
          <OptionalValue value={null} />
        ) : (
          <a className={linkStyle} href={seller.website_url} rel="noreferrer" target="_blank">
            {seller.website_url}
          </a>
        ),
    },
    { term: "紹介文", value: <OptionalValue value={seller.profile_text} /> },
  ];
}

function internalItems(seller: SellerDetail): DescriptionItem[] {
  return [
    { term: "担当者名", value: seller.contact_name },
    { term: "連絡先メール", value: seller.contact_email },
    { term: "招待コード", value: <OptionalValue value={seller.invite_code} /> },
    { term: "却下理由", value: <OptionalValue value={seller.rejected_reason} /> },
    { term: "状態", value: statusLabel(seller.status) },
    { term: "申請日時", value: formatDateJa(seller.created_at) },
    {
      term: "承認日時",
      value:
        seller.approved_at === null ? (
          <OptionalValue value={null} />
        ) : (
          formatDateJa(seller.approved_at)
        ),
    },
    {
      term: "共有ログイン",
      value: seller.auth_user_id === null ? "未発行" : `発行済み（${seller.auth_user_id}）`,
    },
    { term: "claim 済み資材", value: `${seller.materialCount} 件` },
  ];
}

export default async function AdminSellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireAdminPage(`/admin/sellers/${id}`);

  const seller = await getSellerDetail(id);

  if (!seller.ok) {
    if (seller.error === "not_found") notFound();
    throw new Error(errorMessageJa[seller.error]);
  }

  return (
    <AdminShell
      backHref="/admin/sellers"
      backLabel="← 出品者審査"
      description={`状態：${statusLabel(seller.data.status)}`}
      title={seller.data.official_name}
    >
      <Panel note="承認すると、申請したログインIDで共有ログインを発行します。" title="審査">
        <SellerReviewActions
          inviteCode={seller.data.invite_code}
          sellerId={seller.data.id}
          status={seller.data.status}
        />
      </Panel>

      <Panel note="出品者ページに出る情報" title="申請内容（公開）">
        <DescriptionList items={publicItems(seller.data)} />
      </Panel>

      <Panel note="連絡先・審査記録。公開ビューには出さない。" title="内部項目">
        <DescriptionList items={internalItems(seller.data)} />
      </Panel>

      {seller.data.status === "approved" || seller.data.status === "suspended" ? (
        <Panel title="関連">
          <p className={adminInlineNoteStyle}>
            <Link className={linkStyle} href={`/sellers/${seller.data.id}`}>
              公開中の出品者ページを見る
            </Link>
          </p>
          <p className={adminInlineNoteStyle}>
            <Link className={linkStyle} href="/admin/materials">
              資材の claim 紐づけへ
            </Link>
          </p>
        </Panel>
      ) : null}
    </AdminShell>
  );
}
