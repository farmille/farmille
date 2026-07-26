import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { AppBar, SectionHeading, StatCard } from "@/components";
import { isPrefectureCode, PREFECTURES } from "@/lib/prefectures";
import { errorMessageJa } from "@/server/errors";
import { getPublicProfilePage, type PublicProfilePageData } from "@/server/queries/public-profiles";
import type { Result } from "@/server/result";
import { css } from "../../../../styled-system/css";

import { PostTimeline } from "./_components/post-timeline";
import { ProfileHeader } from "./_components/profile-header";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const shell = css({
  minH: "100dvh",
  bg: "surface.panel",
  color: "text.default",
  fontFamily: "sans",
});

const body = css({
  px: "4",
  py: "4",
  pb: "10",
});

const statRow = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
  mt: "3.5",
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
  const title = `${profile.handle}｜Farmille`;
  const description =
    profile.bio ?? `${profile.handle}さんのレビューと使用レポートを確認できます。`;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
      ...(profile.avatarUrl === null ? {} : { images: [{ url: profile.avatarUrl }] }),
    },
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;
  const data = await loadProfileOrNotFound(id);

  return (
    <div className={shell}>
      <AppBar title={data.profile.handle} backHref="/" />
      <main className={body}>
        <ProfileHeader
          profile={data.profile}
          prefectureName={prefectureName(data.profile.prefectureCode)}
        />

        <div className={statRow}>
          <StatCard value={data.reviewCount} label="レビュー" />
          <StatCard value={data.helpfulCount} label="参考になった" />
        </div>

        <section aria-labelledby="profile-posts-heading">
          <SectionHeading title={<span id="profile-posts-heading">これまでの投稿</span>} />
          <PostTimeline profile={data.profile} posts={data.posts} />
        </section>
      </main>
    </div>
  );
}
