import "@/app/_mock/forms.css";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { errorMessageJa } from "@/server/errors";
import { getProfileDetails, getProfileOptions } from "@/server/queries/profile-details";
import { getOwnProfile } from "@/server/queries/profiles";

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

  // 見本 S.profileEdit（本文は 640px に絞る）。
  return (
    <MockPageShell title="プロフィールを編集" backHref="/me" active="me">
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="sr-only">表示情報編集</h1>
        <ProfileEditForm
          profile={profileResult.data}
          details={details.data}
          options={options.data}
        />
      </div>
    </MockPageShell>
  );
}
