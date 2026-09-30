import { ProfileDetailsDisplay } from "@/components/ProfileDetailsDisplay";
import { getProfileDetails } from "@/server/queries/profile-details";
import { buttonRecipe } from "@/components";
import { Icon } from "@/components/Icon";
import Link from "next/link";

import { AppBar, StatCard } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { errorMessageJa } from "@/server/errors";
import { getSessionUser } from "@/server/auth";
import { getMyPageData } from "@/server/queries/me-page";
import { css } from "../../../styled-system/css";

import { AccountActions } from "./_components/AccountActions";
import { NonGeneralNotice } from "./_components/NonGeneralNotice";
import { ProfileCard } from "./_components/ProfileCard";
import { HelpfulShelf, PostsShelf, SavedShelf } from "./_components/Shelves";
import { resolveMeAccess } from "./_lib/access";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const body = css({
  flex: "1",
  w: "100%",
  maxW: "content.medium",
  mx: "auto",
  px: "4",
  py: "4",
  pb: "6",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
});

const statRow = css({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "2.5",
  mt: "3.5",
});

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = (await searchParams).tab === "reviews" ? "reviews" : "reports";
  const access = await resolveMeAccess("/me");

  if (access.kind === "other") {
    return <NonGeneralNotice accountType={access.accountType} />;
  }

  const result = await getMyPageData(access.session.userId);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  const data = result.data;
  const details = await getProfileDetails(access.session.userId);
  if (!details.ok) throw new Error(errorMessageJa[details.error]);
  const reportCount = data.posts.filter((post) => post.kind === "usage_report").length;

  return (
    <div className={shell}>
      <AppBar chrome="public" active="me" title="マイページ" />
      <main className={body}>
        <ProfileCard profile={data.profile} />
        <ProfileDetailsDisplay details={details.data} editable />

        <div className={statRow}>
          <StatCard value={data.reviewCount} label="感想口コミ" />
          <StatCard value={reportCount} label="実証詳細レポート" />
          <StatCard value={data.savedMaterials.length} label="お気に入り" />
        </div>

        <p
          className={css({
            mt: "3",
            mb: "0",
            textAlign: "center",
            fontSize: "sm",
          })}
        >
          <Link
            href={`/users/${data.profile.userId}`}
            className={css({
              color: "primary.700",
              fontWeight: "700",
              textDecoration: "none",
            })}
          >
            公開プロフィールを見る <Icon name="arrow_forward" size="sm" />
          </Link>
        </p>

        <nav aria-label="投稿の種類" className={css({ display: "flex", gap: "2", mt: "5" })}>
          <Link
            href="/me?tab=reports"
            aria-current={tab === "reports" ? "page" : undefined}
            className={buttonRecipe({
              variant: tab === "reports" ? "primary" : "ghost",
              size: "sm",
            })}
          >
            実証詳細レポート {reportCount}
          </Link>
          <Link
            href="/me?tab=reviews"
            aria-current={tab === "reviews" ? "page" : undefined}
            className={buttonRecipe({
              variant: tab === "reviews" ? "primary" : "ghost",
              size: "sm",
            })}
          >
            感想口コミ {data.reviewCount}
          </Link>
        </nav>
        <PostsShelf
          profile={data.profile}
          posts={data.posts.filter((post) =>
            tab === "reviews" ? post.kind === "review" : post.kind === "usage_report",
          )}
        />
        <SavedShelf items={data.savedMaterials} />
        <HelpfulShelf items={data.helpfulItems} />
        <AccountActions admin={(await getSessionUser())?.accountType === "admin"} />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
