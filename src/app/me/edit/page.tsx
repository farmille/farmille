import { MockPageShell } from "@/app/_mock/MockPageShell";
import { errorMessageJa } from "@/server/errors";
import { getProfileDetails, getProfileOptions } from "@/server/queries/profile-details";
import { getOwnProfile } from "@/server/queries/profiles";
import { css } from "../../../../styled-system/css";

import { NonGeneralNotice } from "../_components/NonGeneralNotice";
import { resolveMeAccess } from "../_lib/access";
import { ProfileEditForm } from "./ProfileEditForm";

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
    <MockPageShell title="プロフィールを編集" backHref="/me" active="me">
      <div className={css({ maxW: "content.form", mx: "auto" })}>
        <h1 className={css({ srOnly: true })}>表示情報編集</h1>
        <ProfileEditForm
          profile={profileResult.data}
          details={details.data}
          options={options.data}
        />
      </div>
    </MockPageShell>
  );
}
