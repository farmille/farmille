import { Icon } from "@/components/Icon";
import Link from "next/link";
import type { ReactNode } from "react";

import { FormPageShell } from "@/components/FormPageShell";
import { buttonRecipe, formatDateJa, surfaceCardRecipe } from "@/components";
import type { SellerDashboardData } from "@/server/queries/seller-dashboard";

import { css, cva, cx } from "../../../../styled-system/css";
import {
  cardList,
  pillButtonRecipe,
  readingColumn,
  sectionHeading,
  visuallyHidden,
} from "./dashboard-styles";
import { DashboardTabs } from "./DashboardTabs";
import { ProcedureRow } from "./ProcedureRow";

function checkedExternalUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("メーカーの公式サイトURLはHTTPまたはHTTPSで指定してください。");
  }

  return url.toString();
}

const infoRow = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  gap: "3",
  py: "3",
  px: "4",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  _last: { borderBottomWidth: "0" },
  tab: { flexWrap: "nowrap" },
});

const infoLabel = css({
  flex: "[1 0 100%]",
  fontSize: "sm",
  color: "text.muted",
  fontWeight: "bold",
  pt: "0.5",
  tab: { flex: "none", w: "36" },
});

const infoValueRecipe = cva({
  base: {
    flex: "1",
    minW: "0",
    fontSize: "sm",
    lineHeight: "relaxed",
    overflowWrap: "anywhere",
    "& a": { color: "text.brand", textDecoration: "underline" },
  },
  variants: {
    empty: {
      true: { color: "text.subtle" },
      false: { color: "text.muted" },
    },
  },
});

const infoAction = css({ flex: "none", display: "flex", gap: "1.5", alignItems: "center" });

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={infoRow}>
      <div className={infoLabel}>{label}</div>
      <div className={infoValueRecipe({ empty })}>{empty ? "−" : value}</div>
    </div>
  );
}

const checkItemRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2.5",
    py: "2",
    fontSize: "sm",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
    _first: { borderTopWidth: "0" },
  },
  variants: {
    done: {
      true: { color: "text.subtle" },
      false: {},
    },
  },
});

const checkMarkRecipe = cva({
  base: {
    w: "4.5",
    h: "4.5",
    borderRadius: "pill",
    borderWidth: "1.5px",
    borderStyle: "solid",
    flex: "none",
    display: "grid",
    placeItems: "center",
    fontSize: "xs",
    color: "text.inverse",
  },
  variants: {
    done: {
      true: { bg: "primary.700", borderColor: "primary.700" },
      false: { borderColor: "border.strong" },
    },
  },
});

function CheckItem({
  done,
  children,
  href,
  actionLabel,
}: {
  done: boolean;
  children: ReactNode;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <li className={checkItemRecipe({ done })}>
      <span className={checkMarkRecipe({ done })} aria-hidden="true">
        {done ? <Icon name="check" size="xs" /> : null}
      </span>
      <span>
        {children}
        <span className={visuallyHidden}>{done ? "（済み）" : "（未完了）"}</span>
      </span>
      {!done && href && actionLabel ? (
        <Link className={cx(pillButtonRecipe(), css({ ml: "auto" }))} href={href}>
          {actionLabel}
        </Link>
      ) : null}
    </li>
  );
}

const statusRow = css({ display: "flex", alignItems: "center", gap: "2.5", flexWrap: "wrap" });

const orgMark = css({
  w: "9",
  h: "9",
  borderRadius: "input",
  overflow: "hidden",
  bg: "primary.100",
  display: "grid",
  placeItems: "center",
  fontSize: "md",
  fontWeight: "extrabold",
  color: "text.brandOnSoft",
  flex: "none",
});

const orgName = css({ display: "inline", textStyle: "title", fontWeight: "bold" });

const memberBadge = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  ml: "1.5",
  fontSize: "xs",
  fontWeight: "semibold",
  color: "accent.official",
  bg: "accent.official/12",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "accent.official/25",
  borderRadius: "pill",
  py: "0.5",
  px: "2",
});

const contactLine = css({ textStyle: "note", mt: "0.5", color: "text.subtle" });

const kpiGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "2.5",
  mt: "3.5",
});

const kpi = css({
  bg: "surface.page",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  p: "3",
  textAlign: "center",
});

const kpiValue = css({
  fontSize: "3xl",
  fontWeight: "extrabold",
  color: "text.brand",
  fontVariantNumeric: "tabular-nums",
});

const kpiLabel = css({ fontSize: "xs", color: "text.muted", mt: "0.5" });

const checklist = css({
  mt: "4",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  pt: "1",
  px: "3.5",
  pb: "2.5",
});

const checklistHeading = css({ textStyle: "title", pt: "2.5", pb: "1" });

const plainList = css({ listStyle: "none", m: "0", p: "0" });

const menuStack = css({ display: "flex", flexDirection: "column", gap: "3" });

const materialStatusRecipe = cva({
  base: {
    flex: "none",
    fontSize: "xs",
    fontWeight: "bold",
    borderRadius: "pill",
    py: "0.5",
    px: "2",
    whiteSpace: "nowrap",
  },
  variants: {
    verified: {
      true: { bg: "primary.100", color: "text.brandOnSoft" },
      false: { bg: "accent.dangerSoft", color: "accent.danger" },
    },
  },
});

const materialMaker = css({ fontSize: "xs", color: "text.subtle" });

const emptyTitle = css({ fontSize: "sm", fontWeight: "bold" });

const emptyText = css({ textStyle: "supporting", color: "text.subtle", mt: "1" });

const accountActions = css({ display: "flex", flexWrap: "wrap", gap: "2", py: "3", px: "4" });

const accountButton = css(buttonRecipe.raw({ variant: "ghost" }), {
  w: "auto",
  minW: "auto",
  py: "2",
  px: "4",
});

export function DashboardContent({ seller, materials }: SellerDashboardData) {
  const verifiedCount = materials.filter(
    (material) => material.manufacturer_verified_at !== null,
  ).length;
  const firstUnentered = materials.find((material) => material.manufacturer_verified_at === null);
  const hasProfileText = (seller.profile_text ?? "").trim().length > 0;

  return (
    <FormPageShell chrome="seller" backHref="/" title="企業会員ダッシュボード">
      <div className={readingColumn}>
        <DashboardTabs active="dash" />

        <div className={surfaceCardRecipe()}>
          <div className={statusRow}>
            <span className={orgMark} aria-hidden="true">
              {seller.official_name.slice(0, 1)}
            </span>
            <div className={css({ flex: "1", minW: "0" })}>
              <h1 className={orgName}>{seller.official_name}</h1>
              <span className={memberBadge}>企業会員</span>
              <div className={contactLine}>ご担当者：{seller.contact_name}様</div>
            </div>
          </div>
          <div className={kpiGrid}>
            <div className={kpi}>
              <div className={kpiValue}>{materials.length}</div>
              <div className={kpiLabel}>掲載資材</div>
            </div>
            <div className={kpi}>
              <div className={kpiValue}>{verifiedCount}</div>
              <div className={kpiLabel}>情報入力済み</div>
            </div>
          </div>
          <div className={checklist}>
            <h2 className={checklistHeading}>はじめに済ませておきたいこと</h2>
            <ul className={plainList}>
              <CheckItem done>企業会員の登録</CheckItem>
              <CheckItem done={hasProfileText} href="/dashboard/profile" actionLabel="入力する">
                企業紹介の入力
              </CheckItem>
              <CheckItem
                done={seller.logo_url !== null}
                href="/dashboard/profile"
                actionLabel="設定する"
              >
                企業ロゴのアップロード
              </CheckItem>
              {firstUnentered ? (
                <CheckItem
                  done={false}
                  href={`/dashboard/materials/${firstUnentered.id}`}
                  actionLabel="入力する"
                >
                  「{firstUnentered.name}」の製品情報の入力
                </CheckItem>
              ) : null}
            </ul>
          </div>
        </div>

        <h2 className={sectionHeading}>登録情報</h2>
        <div className={surfaceCardRecipe({ padding: "flush" })}>
          <InfoRow
            label="会社紹介"
            value={seller.profile_text ?? "会社情報は公開メーカーページにも表示されます。"}
          />
          <InfoRow label="資材マスタのメーカー" value={seller.manufacturer_name} />
          <InfoRow label="所在地" value={seller.location} />
          <InfoRow
            label="公式サイト"
            value={
              seller.website_url === null ? null : (
                <a href={checkedExternalUrl(seller.website_url)} target="_blank" rel="noreferrer">
                  公式サイトを開く
                </a>
              )
            }
          />
          <InfoRow
            label="ロゴ"
            value={
              seller.logo_url === null ? null : (
                <a href={checkedExternalUrl(seller.logo_url)} target="_blank" rel="noreferrer">
                  登録画像を開く
                </a>
              )
            }
          />
          <InfoRow label="Farmille企業会員ID" value={seller.login_id} />
          <InfoRow label="担当者" value={seller.contact_name} />
          <InfoRow
            label="連絡先メール"
            value={<a href={`mailto:${seller.contact_email}`}>{seller.contact_email}</a>}
          />
          <InfoRow label="状態" value={seller.status === "approved" ? "確認済み" : seller.status} />
          <InfoRow
            label="確認日"
            value={seller.approved_at === null ? null : formatDateJa(seller.approved_at)}
          />
        </div>

        <h2 className={sectionHeading}>管理メニュー</h2>
        <div className={menuStack}>
          <ProcedureRow
            heading="h3"
            title="製品情報の管理"
            href="/dashboard/materials"
            actionLabel="資材管理を開く"
          >
            資材オーナー権限のある製品情報の編集、下書き保存、プレビュー、表現確認の状況確認を行います。
          </ProcedureRow>
          <ProcedureRow
            heading="h3"
            title="各種お手続き"
            href="/dashboard/applications"
            actionLabel="各種お手続きへ"
          >
            資材掲載・オーナー権限・移行の申請と受付票
          </ProcedureRow>
          <ProcedureRow
            heading="h3"
            title="メーカープロフィール"
            href="/dashboard/profile"
            actionLabel="プロフィールを編集"
          >
            会社紹介・ロゴ・公式リンクを編集する
          </ProcedureRow>
          <ProcedureRow
            heading="h3"
            title="記事管理"
            href="/dashboard/articles"
            actionLabel="記事管理を開く"
          >
            自社記事の作成、編集、公開状態の管理を行います。
          </ProcedureRow>
        </div>

        <section aria-labelledby="dash-materials-heading">
          <h2 id="dash-materials-heading" className={sectionHeading}>
            自社資材
          </h2>
          {materials.length === 0 ? (
            <div className={surfaceCardRecipe()}>
              <b className={emptyTitle}>公開中の自社資材はありません</b>
              <p className={emptyText}>
                資材オーナー権限の書類確認が完了すると、資材ごとに製品情報の編集が可能になります。
              </p>
            </div>
          ) : (
            <ul className={cardList}>
              {materials.map((material) => (
                <li className={infoRow} key={material.id}>
                  <div className={infoValueRecipe({ empty: false })}>
                    <Link href={`/dashboard/materials/${material.id}`}>
                      {material.publication_status === "archived"
                        ? `${material.name}（非公開）`
                        : material.name}
                    </Link>
                    <div className={materialMaker}>
                      {material.manufacturer_name}
                      {material.avg_rating === null
                        ? ""
                        : `・評価 ${material.avg_rating.toFixed(1)}`}
                    </div>
                  </div>
                  <div className={infoAction}>
                    <span
                      className={materialStatusRecipe({
                        verified: material.manufacturer_verified_at !== null,
                      })}
                    >
                      {material.manufacturer_verified_at === null ? "未入力あり" : "入力済み"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <h2 className={sectionHeading}>アカウント</h2>
        <div className={surfaceCardRecipe({ padding: "flush" })}>
          <div className={accountActions}>
            <Link className={accountButton} href="/account/passkeys">
              パスキーを管理
            </Link>
            <Link className={accountButton} href="/account/password">
              パスワードを変更
            </Link>
            <form action="/logout" method="post">
              <button className={accountButton} type="submit">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </div>
    </FormPageShell>
  );
}
