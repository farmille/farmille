import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { AppBar, SectionHeading, StatCard } from "@/components";
import { createPageMetadata } from "@/lib/seo";
import { isPrefectureCode, PREFECTURES } from "@/lib/prefectures";
import { getSessionUser } from "@/server/auth";
import { createReportAction } from "@/server/actions/reports";
import { errorMessageJa } from "@/server/errors";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/reports";
import { getPublicProfilePage, type PublicProfilePageData } from "@/server/queries/public-profiles";
import type { Result } from "@/server/result";
import { ReportDialog } from "@/components/ReportDialog";
import { css } from "../../../../styled-system/css";

import { PostTimeline } from "./_components/PostTimeline";
import { ProfileHeader } from "./_components/ProfileHeader";

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
  md: { px: "5", py: "5" },
});

const statRow = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
  mt: "3.5",
});

const getCachedProfilePage = cache(
  async (id: string, viewerUserId: string | null): Promise<Result<PublicProfilePageData>> => {
    if (!UUID_PATTERN.test(id)) {
      return { ok: false, error: "not_found" };
    }

    return getPublicProfilePage(id, viewerUserId);
  },
);

async function loadProfileOrNotFound(
  id: string,
  viewerUserId: string | null = null,
): Promise<PublicProfilePageData> {
  const result = await getCachedProfilePage(id, viewerUserId);

  if (!result.ok) {
    if (result.error === "not_found") {
      notFound();
    }

    throw new Error(errorMessageJa[result.error]);
  }

  return result.data;
}

function prefectureName(code: number | null): string | null {
  if (code === null) {
    return null;
  }

  if (!isPrefectureCode(code)) {
    throw new Error(`未対応の都道府県コードです：${code}`);
  }

  return PREFECTURES[code - 1].name;
}

type UserPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const { id } = await params;
  const { profile } = await loadProfileOrNotFound(id);
  const description =
    profile.bio ?? `${profile.handle}さんのレビューと使用レポートを確認できます。`;

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
  const session = await getSessionUser();
  const viewerUserId = session?.accountType === "general" ? session.userId : null;
  const data = await loadProfileOrNotFound(id, viewerUserId);
  const isOwnProfile = viewerUserId !== null && viewerUserId === data.profile.userId;

  return (
    <div className={shell}>
      <AppBar chrome="public" title={data.profile.handle} backHref="/" />
      <main className={body}>
        <ProfileHeader
          profile={data.profile}
          prefectureName={prefectureName(data.profile.prefectureCode)}
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

        <div className={statRow}>
          <StatCard value={data.reviewCount} label="レビュー" />
          <StatCard value={data.helpfulCount} label="参考になった" />
        </div>

        <section aria-labelledby="profile-posts-heading">
          <SectionHeading title={<span id="profile-posts-heading">これまでの投稿</span>} />
          <PostTimeline profile={data.profile} posts={data.posts} viewerUserId={viewerUserId} />
        </section>
      </main>
    </div>
  );
}
