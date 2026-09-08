import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Button,
  DataList,
  EmptyState,
  FormPageShell,
  MaterialRefCard,
  SectionHeading,
  SurfaceCard,
  TextLink,
  buttonRecipe,
  formatDateJa,
} from "@/components";
import { SellerAccessDenied } from "./_components/AccessDenied";
import { requireSeller } from "@/server/auth";
import { getSellerDashboardData } from "@/server/queries/seller-dashboard";
import { css } from "../../../styled-system/css";

const pageStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
});

const itemStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

function checkedExternalUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("メーカーの公式サイトURLはHTTPまたはHTTPSで指定してください。");
  }

  return url.toString();
}

export default async function DashboardPage() {
  const session = await requireSeller();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent("/dashboard")}`);
    }

    return <SellerAccessDenied />;
  }

  const result = await getSellerDashboardData(session.data.sellerId);
  if (!result.ok) {
    if (result.error === "forbidden") return <SellerAccessDenied />;
    throw new Error("メーカーダッシュボードの取得に失敗しました。");
  }

  const { seller, materials } = result.data;

  return (
    <FormPageShell chrome="seller" backHref="/" title="メーカーダッシュボード">
      <div className={pageStack}>
        <SurfaceCard
          description={seller.profile_text ?? "会社情報は公開メーカーページにも表示されます。"}
          title={seller.official_name}
        >
          <DataList
            rows={[
              { label: "資材マスタのメーカー", value: seller.manufacturer_name },
              { label: "所在地", value: seller.location },
              { label: "対応地域", value: seller.region_scope },
              {
                label: "公式サイト",
                value:
                  seller.website_url === null ? null : (
                    <TextLink external href={checkedExternalUrl(seller.website_url)}>
                      公式サイトを開く
                    </TextLink>
                  ),
              },
              {
                label: "ロゴ",
                value:
                  seller.logo_url === null ? null : (
                    <TextLink external href={checkedExternalUrl(seller.logo_url)}>
                      登録画像を開く
                    </TextLink>
                  ),
              },
              { label: "ログインID", value: seller.login_id },
              { label: "担当者", value: seller.contact_name },
              {
                label: "連絡先メール",
                value: (
                  <TextLink external href={`mailto:${seller.contact_email}`}>
                    {seller.contact_email}
                  </TextLink>
                ),
              },
              { label: "状態", value: seller.status === "approved" ? "承認済み" : seller.status },
              {
                label: "承認日",
                value: seller.approved_at === null ? null : formatDateJa(seller.approved_at),
              },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard
          description="資材の新規登録、情報変更、掲載終了、承認状況の確認を行います。"
          title="資材管理"
        >
          <Link className={buttonRecipe()} href="/dashboard/materials">
            資材管理を開く
          </Link>
        </SurfaceCard>

        <section aria-label="自社資材">
          <SectionHeading first title="自社資材" />
          {materials.length === 0 ? (
            <SurfaceCard>
              <EmptyState
                title="公開中の自社資材はありません"
                description="資材管理から新規登録を申請できます"
              />
            </SurfaceCard>
          ) : (
            <div className={itemStack}>
              {materials.map((material) => (
                <MaterialRefCard
                  avgRating={material.avg_rating}
                  href={`/dashboard/materials/${material.id}`}
                  isOfficial={material.manufacturer_verified_at !== null}
                  key={material.id}
                  manufacturerName={material.manufacturer_name}
                  name={
                    material.publication_status === "archived"
                      ? `${material.name}（掲載終了）`
                      : material.name
                  }
                />
              ))}
            </div>
          )}
        </section>

        <SurfaceCard
          description="自社記事の作成、編集、公開状態の管理を行います。"
          title="記事管理"
        >
          <Link className={buttonRecipe({ variant: "ghost" })} href="/dashboard/articles">
            記事管理を開く
          </Link>
        </SurfaceCard>

        <SurfaceCard title="アカウント">
          <Link className={buttonRecipe({ variant: "ghost" })} href="/account/password">
            パスワードを変更
          </Link>
          <form action="/logout" method="post">
            <Button type="submit" variant="ghost">
              ログアウト
            </Button>
          </form>
        </SurfaceCard>
      </div>
    </FormPageShell>
  );
}
