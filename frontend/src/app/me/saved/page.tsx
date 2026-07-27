import { AppBar } from "@/components";
import { BottomNav } from "@/components/bottom-nav";
import { errorMessageJa } from "@/server/errors";
import { listSavedMaterials } from "@/server/queries/saved-materials";
import { css } from "../../../../styled-system/css";

import { NonGeneralNotice } from "../_components/non-general-notice";
import { resolveMeAccess } from "../_lib/access";
import { SavedList } from "./saved-list";

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
  pb: "8",
});

export default async function MeSavedPage() {
  const access = await resolveMeAccess("/me/saved");

  if (access.kind === "other") {
    return <NonGeneralNotice accountType={access.accountType} />;
  }

  const result = await listSavedMaterials(access.session.userId);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  return (
    <div className={shell}>
      <AppBar title="検討リスト" backHref="/me" />
      <main className={body}>
        <SavedList items={result.data} />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
