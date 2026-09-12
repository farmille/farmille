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
  md: { px: "5", py: "5" },
});

const statRow = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
  mt: "3.5",
});

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
      <AppBar chrome="public" active="me" title="マイページ" />
      <main className={body}>
        <ProfileCard profile={data.profile} />

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
        <AccountActions admin={(await getSessionUser())?.accountType === "admin"} />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
