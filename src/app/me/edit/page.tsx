import { AppBar } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { errorMessageJa } from "@/server/errors";
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

  const profileResult = await getOwnProfile(access.session.userId);

  if (!profileResult.ok) {
    throw new Error(errorMessageJa[profileResult.error]);
  }

  return (
    <div className={shell}>
      <AppBar chrome="public" active="me" title="表示情報編集" backHref="/me" />
      <main className={body}>
        <ProfileEditForm profile={profileResult.data} />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
