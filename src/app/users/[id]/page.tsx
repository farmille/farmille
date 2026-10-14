import { SiteAppBar } from "@/components/SiteAppBar";
import { getProfileDetails } from "@/server/queries/profile-details";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ProfileCard } from "@/components/ProfileCard";
import { publicProfileLabel } from "@/lib/public-profile-label";
import { createPageMetadata } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import { createReportAction } from "@/server/actions/reports";
import { errorMessageJa } from "@/server/errors";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/reports";
import { getPublicProfilePage, type PublicProfilePageData } from "@/server/queries/public-profiles";
import type { Result } from "@/server/result";

import { ReportDialog } from "@/components/ReportDialog";
import { css } from "../../../../styled-system/css";

import { ProfileSectionHeading } from "@/app/me/_components/ProfileParts";

import { PostTimeline } from "./_components/PostTimeline";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const shell = css({
  minH: "100dvh",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const body = css({
  w: "100%",
  maxW: "content.medium",
  mx: "auto",
  px: "4",
  py: "4",
  pb: "10",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
});

const getCachedProfilePage = cache(async (id: string): Promise<Result<PublicProfilePageData>> => {
  if (!UUID_PATTERN.test(id)) {
    return { ok: false, error: "not_found" };
  }

  return getPublicProfilePage(id);
});

async function loadProfileOrNotFound(id: string): Promise<PublicProfilePageData> {
  const result = await getCachedProfilePage(id);

  if (!result.ok) {
    if (result.error === "not_found") {
      notFound();
    }

    throw new Error(errorMessageJa[result.error]);
  }

  return result.data;
}

type UserPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const { id } = await params;
  const { profile } = await loadProfileOrNotFound(id);
  const description = `${profile.handle}さんの感想口コミと実証詳細レポートを確認できます。`;

  return createPageMetadata({
    title: profile.handle,
    description,
    path: `/users/${profile.userId}`,
    type: "profile",
    imageUrls: profile.avatarUrl === null ? undefined : [profile.avatarUrl],
  });
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const [data, session, details] = await Promise.all([
    loadProfileOrNotFound(id),
    getSessionUser(),
    getProfileDetails(id),
  ]);
  if (!details.ok) throw new Error(errorMessageJa[details.error]);
  const viewerUserId =
    session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null;
  const isOwnProfile = viewerUserId !== null && viewerUserId === data.profile.userId;
  const reportCount = data.posts.filter((post) => post.kind === "usage_report").length;

  return (
    <div className={shell}>
      <SiteAppBar chrome="public" title={data.profile.handle} backHref="/" />
      <main className={body}>
        <ProfileCard
          handle={data.profile.handle}
          avatarUrl={data.profile.avatarUrl}
          details={details.data}
          stats={[
            { label: "実証詳細レポート", value: reportCount },
            { label: "感想口コミ", value: data.reviewCount },
            { label: "参考になった", value: data.helpfulCount },
          ]}
        />

        {isOwnProfile ? null : (
          <div className={css({ display: "flex", justifyContent: "flex-end", mt: "2" })}>
            <ReportDialog
              action={createReportAction.bind(null, "profile", data.profile.userId, `/users/${id}`)}
              reasonOptions={REPORT_REASON_OPTIONS}
              title={`${data.profile.handle}さんを通報する`}
            />
          </div>
        )}

        <section aria-labelledby="profile-posts-heading">
          <ProfileSectionHeading id="profile-posts-heading">これまでの投稿</ProfileSectionHeading>
          <PostTimeline
            profile={data.profile}
            posts={data.posts}
            authorLabel={publicProfileLabel(details.data)}
            viewerUserId={viewerUserId}
          />
        </section>
      </main>
    </div>
  );
}
