import { AppBar } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { errorMessageJa } from "@/server/errors";
import { listCropOptions } from "@/server/queries/crops";
import { getOwnProfile } from "@/server/queries/profiles";
import { css } from "../../../../styled-system/css";

import { NonGeneralNotice } from "../_components/NonGeneralNotice";
import { resolveMeAccess } from "../_lib/access";
import { ProfileEditForm } from "./ProfileEditForm";

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
  maxW: "content.form",
  mx: "auto",
  px: "4",
  py: "4",
  pb: "8",
  bg: "surface.panel",
  md: { px: "5", py: "5" },
});

export default async function MeEditPage() {
  const access = await resolveMeAccess("/me/edit");

  if (access.kind === "other") {
    return <NonGeneralNotice accountType={access.accountType} />;
  }

  const [profileResult, cropsResult] = await Promise.all([
    getOwnProfile(access.session.userId),
    listCropOptions(),
  ]);

  if (!profileResult.ok) {
    throw new Error(errorMessageJa[profileResult.error]);
  }

  if (!cropsResult.ok) {
    throw new Error(errorMessageJa[cropsResult.error]);
  }

  return (
    <div className={shell}>
      <AppBar chrome="public" active="me" title="プロフィール編集" backHref="/me" />
      <main className={body}>
        <ProfileEditForm profile={profileResult.data} crops={cropsResult.data} />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
