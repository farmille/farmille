import "@/app/_mock/forms.css";

import Link from "next/link";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { MockProfileCard } from "@/app/_mock/MockProfileCard";
import { publicProfileLabel } from "@/lib/public-profile-label";
import { errorMessageJa } from "@/server/errors";
import { getSessionUser } from "@/server/auth";
import { getMyPageData } from "@/server/queries/me-page";
import { getProfileDetails } from "@/server/queries/profile-details";

import { AccountActions } from "./_components/AccountActions";
import { NonGeneralNotice } from "./_components/NonGeneralNotice";
import { HelpfulShelf, PostsShelf, SavedShelf } from "./_components/Shelves";
import { resolveMeAccess } from "./_lib/access";

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

  // 見本 S.mypage の `.body` の中身。スタイルは src/app/_mock/mock.css・forms.css（.fm 配下）。
  return (
    <MockPageShell title="マイページ" backHref="/" active="me">
      <MockProfileCard
        handle={data.profile.handle}
        avatarUrl={data.profile.avatarUrl}
        details={details.data}
        editable
        stats={[
          { label: "実証詳細レポート", value: reportCount },
          { label: "感想口コミ", value: data.reviewCount },
          { label: "お気に入り", value: data.savedMaterials.length },
        ]}
      />

      <div className="sec-h">
        <h2 id="me-posts-heading">これまでの投稿</h2>
      </div>
      <nav aria-label="投稿の種類" className="filter-row">
        <Link
          href="/me?tab=reports"
          aria-current={tab === "reports" ? "page" : undefined}
          className={tab === "reports" ? "fpill on" : "fpill"}
        >
          実証詳細レポート {reportCount}
        </Link>
        <Link
          href="/me?tab=reviews"
          aria-current={tab === "reviews" ? "page" : undefined}
          className={tab === "reviews" ? "fpill on" : "fpill"}
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
    </MockPageShell>
  );
}
