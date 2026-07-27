import Link from "next/link";

import { AppBar, StatCard } from "@/components";
import { BottomNav } from "@/components/bottom-nav";
import { isPrefectureCode, PREFECTURES } from "@/lib/prefectures";
import { errorMessageJa } from "@/server/errors";
import { getMyPageData } from "@/server/queries/me-page";
import { css } from "../../../styled-system/css";

import { AccountActions } from "./_components/account-actions";
import { NonGeneralNotice } from "./_components/non-general-notice";
import { ProfileCard } from "./_components/profile-card";
import { HelpfulShelf, PostsShelf, SavedShelf } from "./_components/shelves";
import { resolveMeAccess } from "./_lib/access";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.panel",
  color: "text.default",
  fontFamily: "sans",
});

const body = css({
  flex: "1",
  px: "4",
  py: "4",
  pb: "6",
});

const statRow = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
  mt: "3.5",
});

function prefectureName(code: number): string {
  if (!isPrefectureCode(code)) {
    throw new Error(`未対応の都道府県コードです：${code}`);
  }

  return PREFECTURES[code - 1].name;
}

export default async function MePage() {
  const access = await resolveMeAccess("/me");

  if (access.kind === "other") {
    return <NonGeneralNotice accountType={access.accountType} />;
  }

  const result = await getMyPageData(access.session.userId);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  const data = result.data;

  return (
    <div className={shell}>
      <AppBar title="マイページ" />
      <main className={body}>
        <ProfileCard
          profile={data.profile}
          prefectureName={prefectureName(data.profile.prefectureCode)}
        />

        <div className={statRow}>
          <StatCard value={data.reviewCount} label="レビュー" />
          <StatCard value={data.helpfulReceivedCount} label="参考になった" />
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
              color: "brand.primary",
              fontWeight: "700",
              textDecoration: "none",
            })}
          >
            公開プロフィールを見る →
          </Link>
        </p>

        <PostsShelf profile={data.profile} posts={data.posts} />
        <SavedShelf items={data.savedMaterials} />
        <HelpfulShelf items={data.helpfulItems} />
        <AccountActions />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
