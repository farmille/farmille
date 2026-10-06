import "../../_mock/dashboard.css";

import Link from "next/link";
import type { ReactNode } from "react";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { formatDateJa } from "@/components";
import type { SellerDashboardData } from "@/server/queries/seller-dashboard";

import { DashboardTabs } from "./DashboardTabs";

function checkedExternalUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("メーカーの公式サイトURLはHTTPまたはHTTPSで指定してください。");
  }

  return url.toString();
}

/** 見本の md-row（項目名・値・状態）。値が無い行は「−」。 */
function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value: ReactNode;
  action?: ReactNode;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="md-row">
      <div className="k">{label}</div>
      <div className={empty ? "v full empty" : "v full"}>{empty ? "−" : value}</div>
      {action ? <div className="act">{action}</div> : null}
    </div>
  );
}

/** 見本の md-ck（はじめに済ませておきたいこと の1行）。 */
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
    <li className={done ? "md-ck done" : "md-ck"}>
      <span className="cb" aria-hidden="true">
        {done ? "✓" : ""}
      </span>
      <span>
        {children}
        <span className="sr-only">{done ? "（済み）" : "（未完了）"}</span>
      </span>
      {!done && href && actionLabel ? (
        <Link className="md-btn" href={href}>
          {actionLabel}
        </Link>
      ) : null}
    </li>
  );
}

/** 見本 S.makerDash の「ダッシュボード」タブ。メーカーの登録情報・管理メニュー・自社資材を表示する。 */
export function DashboardContent({ seller, materials }: SellerDashboardData) {
  const verifiedCount = materials.filter(
    (material) => material.manufacturer_verified_at !== null,
  ).length;
  const firstUnentered = materials.find((material) => material.manufacturer_verified_at === null);
  const hasProfileText = (seller.profile_text ?? "").trim().length > 0;

  return (
    <MockPageShell title="企業会員ダッシュボード" backHref="/">
      <div className="dash-wide">
        <DashboardTabs active="dash" />

        <div className="card pad">
          <div className="md-status">
            <span className="org-mini dash-org" aria-hidden="true">
              {seller.official_name.slice(0, 1)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="dash-name">{seller.official_name}</h1>
              <span className="verified-badge">企業会員</span>
              <div className="muted dash-sub">ご担当者：{seller.contact_name}様</div>
            </div>
          </div>
          <div className="md-kpis dash-kpis">
            <div className="md-kpi">
              <div className="n tnum">{materials.length}</div>
              <div className="l">掲載製品</div>
            </div>
            <div className="md-kpi">
              <div className="n tnum">{verifiedCount}</div>
              <div className="l">情報入力済み</div>
            </div>
          </div>
          <div className="md-check">
            <h2 className="md-check-h">はじめに済ませておきたいこと</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
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

        <h2 className="dash-sec-h">登録情報</h2>
        <div className="card">
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
          <InfoRow label="ログインID" value={seller.login_id} />
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

        <h2 className="dash-sec-h">管理メニュー</h2>
        <div className="stack">
          <div className="card proc-row">
            <div className="pr-main">
              <h3>製品情報の管理</h3>
              <p>編集権のある製品の編集、下書き保存、プレビュー、表現確認の状況確認を行います。</p>
            </div>
            <Link className="btn btn-ghost" href="/dashboard/materials">
              資材管理を開く
            </Link>
          </div>
          <div className="card proc-row">
            <div className="pr-main">
              <h3>各種お手続き</h3>
              <p>資材掲載・オーナー権限・移行の申請と受付票</p>
            </div>
            <Link className="btn btn-ghost" href="/dashboard/applications">
              各種お手続きへ
            </Link>
          </div>
          <div className="card proc-row">
            <div className="pr-main">
              <h3>メーカープロフィール</h3>
              <p>会社紹介・ロゴ・公式リンクを編集する</p>
            </div>
            <Link className="btn btn-ghost" href="/dashboard/profile">
              プロフィールを編集
            </Link>
          </div>
          <div className="card proc-row">
            <div className="pr-main">
              <h3>記事管理</h3>
              <p>自社記事の作成、編集、公開状態の管理を行います。</p>
            </div>
            <Link className="btn btn-ghost" href="/dashboard/articles">
              記事管理を開く
            </Link>
          </div>
        </div>

        <section aria-labelledby="dash-materials-heading">
          <h2 id="dash-materials-heading" className="dash-sec-h">
            自社資材
          </h2>
          {materials.length === 0 ? (
            <div className="card pad">
              <b style={{ fontSize: 13 }}>公開中の自社資材はありません</b>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                編集権の書類確認が完了すると、資材ごとに編集できるようになります。
              </p>
            </div>
          ) : (
            <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {materials.map((material) => (
                <li className="md-row" key={material.id}>
                  <div className="v full">
                    <Link href={`/dashboard/materials/${material.id}`}>
                      {material.publication_status === "archived"
                        ? `${material.name}（掲載終了）`
                        : material.name}
                    </Link>
                    <div className="muted" style={{ fontSize: 11 }}>
                      {material.manufacturer_name}
                      {material.avg_rating === null
                        ? ""
                        : `・評価 ${material.avg_rating.toFixed(1)}`}
                    </div>
                  </div>
                  <div className="act">
                    {material.manufacturer_verified_at === null ? (
                      <span className="md-st miss">未入力あり</span>
                    ) : (
                      <span className="md-st ok">入力済み</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <h2 className="dash-sec-h">アカウント</h2>
        <div className="card">
          <div className="dash-actions">
            <Link className="btn btn-ghost" href="/account/passkeys">
              パスキーを管理
            </Link>
            <Link className="btn btn-ghost" href="/account/password">
              パスワードを変更
            </Link>
            <form action="/logout" method="post">
              <button className="btn btn-ghost" type="submit">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </div>
    </MockPageShell>
  );
}
