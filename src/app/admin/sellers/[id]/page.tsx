import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import {
  DescriptionList,
  OptionalValue,
  Panel,
  adminBodyStyle,
  adminInlineNoteStyle,
  type DescriptionItem,
} from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { SellerReviewActions } from "@/app/admin/sellers/[id]/SellerReviewActions";
import { formatDateJa } from "@/components";
import {
  getSellerDetail,
  listManufacturerNames,
  listSellerMaterialCandidates,
  isSellerStatus,
  SELLER_STATUS_LABELS,
  type SellerDetail,
} from "@/server/admin/sellers";
import { errorMessageJa } from "@/server/errors";
import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "メーカーの申請内容",
};

const linkStyle = css({
  color: "text.brand",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

function statusLabel(status: string): string {
  return isSellerStatus(status) ? SELLER_STATUS_LABELS[status] : status;
}

function publicItems(seller: SellerDetail): DescriptionItem[] {
  return [
    { term: "メーカー名", value: seller.official_name },
    { term: "Farmille企業会員ID", value: seller.login_id },
    { term: "本社・主な拠点", value: seller.location },
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
    { term: "法人番号", value: <OptionalValue value={seller.corporate_number} /> },
    { term: "担当者電話番号", value: <OptionalValue value={seller.contact_phone} /> },
    {
      term: "掲載・編集を希望する資材",
      value: <OptionalValue value={seller.material_request_notes} />,
    },
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
    { term: "資材オーナー権限を付与した資材", value: `${seller.materialCount} 件` },
    { term: "資材マスタのメーカー", value: <OptionalValue value={seller.manufacturer_name} /> },
  ];
}

export default async function AdminSellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireAdminPage(`/admin/sellers/${id}`);

  const [seller, manufacturers] = await Promise.all([getSellerDetail(id), listManufacturerNames()]);

  if (!manufacturers.ok) throw new Error(errorMessageJa[manufacturers.error]);

  if (!seller.ok) {
    if (seller.error === "not_found") notFound();
    throw new Error(errorMessageJa[seller.error]);
  }

  const candidates = await listSellerMaterialCandidates(seller.data.manufacturer_name);

  if (!candidates.ok) throw new Error("掲載ページの候補を取得できませんでした。");

  return (
    <AdminShell
      backHref="/admin/sellers"
      backLabel="メーカー確認"
      description={`状態：${statusLabel(seller.data.status)}`}
      title={seller.data.official_name}
    >
      <Panel
        note="会社と担当者を確認し、運営発行のFarmille企業会員IDとパスワード設定用の案内を送付します。資材オーナー権限は申請と確認資料の審査後に付与します。"
        title="申請内容の確認とご案内"
      >
        <SellerReviewActions
          manufacturerNames={manufacturers.data}
          inviteCode={seller.data.invite_code}
          sellerId={seller.data.id}
          status={seller.data.status}
        />
      </Panel>

      <Panel
        title="掲載ページの候補一覧"
        note="会社名から抽出した候補です。所有権の確認結果ではありません。メーカーへ候補の正誤確認と、追加掲載を希望する資材の記入を依頼してください。"
      >
        {candidates.data.length === 0 ? (
          <p className={adminInlineNoteStyle}>
            候補はありません。会社名の紐づけ、または新しい資材ページの用意を確認してください。
          </p>
        ) : (
          candidates.data.map((material) => (
            <p className={adminBodyStyle} key={material.id}>
              <Link className={linkStyle} href={`/materials/${material.id}`}>
                {material.name}
              </Link>
              {" ／ "}
              <Link className={linkStyle} href={`/admin/materials/${material.id}`}>
                申請と確認資料を確認して資材オーナー権限を設定
              </Link>
            </p>
          ))
        )}
        <p className={adminBodyStyle}>
          <Link className={linkStyle} href="/admin/company-applications">
            企業からの申請一覧
          </Link>
          で、メーカーが提出した申請と確認資料を審査してください。各資材の資材オーナー権限の設定で、確認資料の保管先または受付番号を記録します。
        </p>
      </Panel>

      <Panel note="メーカーページに出る情報" title="申請内容（公開）">
        <DescriptionList items={publicItems(seller.data)} />
      </Panel>

      <Panel note="連絡先・確認記録。公開ビューには出さない。" title="内部項目">
        <DescriptionList items={internalItems(seller.data)} />
      </Panel>

      {seller.data.status === "approved" || seller.data.status === "suspended" ? (
        <Panel title="関連">
          <p className={adminInlineNoteStyle}>
            <Link className={linkStyle} href={`/sellers/${seller.data.id}`}>
              公開中のメーカーページを見る
            </Link>
          </p>
          <p className={adminInlineNoteStyle}>
            <Link className={linkStyle} href="/admin/materials">
              資材ごとの資材オーナー権限の設定へ
            </Link>
          </p>
        </Panel>
      ) : null}
    </AdminShell>
  );
}
