import { SiteAppBar } from "@/components/SiteAppBar";
import Link from "next/link";

import { ProfileCard } from "@/components/ProfileCard";

import { BottomNav } from "@/components/BottomNav";
import { publicProfileLabel } from "@/lib/public-profile-label";
import { errorMessageJa } from "@/server/errors";
import { getSessionUser } from "@/server/auth";
import { getMyPageData } from "@/server/queries/me-page";
import { getProfileDetails } from "@/server/queries/profile-details";
import { css, cva } from "../../../../styled-system/css";

import { AccountActions } from "../_components/AccountActions";
import { NonGeneralNotice } from "../_components/NonGeneralNotice";
import { ProfileSectionHeading } from "../_components/ProfileParts";
import { missingProfileItems, ProfileSetupNotice } from "../_components/ProfileSetupNotice";
import { HelpfulShelf, PostsShelf, SavedShelf } from "../_components/Shelves";
import { resolveMeAccess } from "../_lib/access";
import { initialPostsTab } from "../_lib/posts-tab";

const shell = css({
  minH: "dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const body = css({
  flex: "1",
  w: "full",
  maxW: "content.medium",
  mx: "auto",
  px: "4",
  py: "4",
  pb: "6",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
});

const tabRow = css({
  display: "flex",
  gap: "2",
  pb: "1",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});

const tabPill = cva({
  base: {
    flex: "none",
    px: "3",
    py: "1.5",
    bg: "surface.card",
    color: "text.muted",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "pill",
    fontSize: "sm",
    textDecoration: "none",
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      outlineOffset: "0.5",
    },
  },
  variants: {
    current: {
      true: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        fontWeight: "semibold",
      },
      false: {},
    },
  },
});

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const requestedTab = (await searchParams).tab;
  const access = await resolveMeAccess("/me");

  if (access.kind === "other") {
    return <NonGeneralNotice accountType={access.accountType} />;
  }

  const [result, details] = await Promise.all([
    getMyPageData(access.session.userId),
    getProfileDetails(access.session.userId),
  ]);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  const data = result.data;
  if (!details.ok) throw new Error(errorMessageJa[details.error]);
  const reportCount = data.posts.filter((post) => post.kind === "usage_report").length;
  const tab = initialPostsTab(requestedTab, { reports: reportCount, reviews: data.reviewCount });

  return (
    <div className={shell}>
      <SiteAppBar chrome="public" active="me" title="マイページ" />
      <main className={body}>
        <ProfileCard
          handle={data.profile.handle}
          avatarUrl={data.profile.avatarUrl}
          details={details.data}
          editable
          stats={[
            { label: "実証詳細レポート", value: reportCount },
            { label: "感想口コミ", value: data.reviewCount },
            { label: "参考になった", value: data.helpfulReceivedCount },
          ]}
        />
        <ProfileSetupNotice missing={missingProfileItems(details.data)} />

        <ProfileSectionHeading id="me-posts-heading">これまでの投稿</ProfileSectionHeading>
        <nav aria-label="投稿の種類" className={tabRow}>
          <Link
            href="/me?tab=reports"
            aria-current={tab === "reports" ? "page" : undefined}
            className={tabPill({ current: tab === "reports" })}
          >
            実証詳細レポート {reportCount}
          </Link>
          <Link
            href="/me?tab=reviews"
            aria-current={tab === "reviews" ? "page" : undefined}
            className={tabPill({ current: tab === "reviews" })}
          >
            感想口コミ {data.reviewCount}
          </Link>
        </nav>
        <PostsShelf
          profile={data.profile}
          kind={tab}
          authorLabel={publicProfileLabel(details.data)}
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
