import { AppBar } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { errorMessageJa } from "@/server/errors";
import { listSavedMaterials } from "@/server/queries/saved-materials";
import { css } from "../../../../styled-system/css";

import { NonGeneralNotice } from "../_components/NonGeneralNotice";
import { resolveMeAccess } from "../_lib/access";
import { SavedList } from "./SavedList";

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
  pb: "8",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
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
      <AppBar chrome="public" active="me" title="検討リスト" backHref="/me" />
      <main className={body}>
        <SavedList items={result.data} />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
