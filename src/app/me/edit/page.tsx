import { SiteAppBar } from "@/components/SiteAppBar";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { errorMessageJa } from "@/server/errors";
import { getProfileDetails, getProfileOptions } from "@/server/queries/profile-details";
import { getOwnProfile } from "@/server/queries/profiles";
import { css } from "../../../../styled-system/css";

import { NonGeneralNotice } from "../_components/NonGeneralNotice";
import { resolveMeAccess } from "../_lib/access";
import { ProfileEditForm } from "./ProfileEditForm";

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
  maxW: "content.form",
  mx: "auto",
  px: "4",
  py: "4",
  pb: "8",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
});

export default async function MeEditPage() {
  const access = await resolveMeAccess("/me/edit");

  if (access.kind === "other") {
    return <NonGeneralNotice accountType={access.accountType} />;
  }

  const profileResult = await getOwnProfile(access.session.userId);

  if (!profileResult.ok) {
    throw new Error(errorMessageJa[profileResult.error]);
  }

  const [details, options] = await Promise.all([
    getProfileDetails(access.session.userId),
    getProfileOptions(),
  ]);
  if (!details.ok || !options.ok) throw new Error("プロフィール設定の取得に失敗しました。");

  return (
    <div className={shell}>
      <SiteAppBar chrome="public" active="me" title="表示情報編集" backHref="/me" />
      <main className={body}>
        <div className={css({ maxW: "content.form", mx: "auto" })}>
          <h1 className={css({ srOnly: true })}>表示情報編集</h1>
          <ProfileEditForm
            avatar={
              <Avatar
                name={profileResult.data.handle}
                src={profileResult.data.avatarUrl}
                size="xs"
              />
            }
            profile={profileResult.data}
            details={details.data}
            options={options.data}
          />
        </div>
      </main>
      <BottomNav active="me" />
    </div>
  );
}
