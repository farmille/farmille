import { SavedPosts } from "./SavedPosts";
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
      <AppBar chrome="public" active="me" title="お気に入り（★）" backHref="/me" />
      <main className={body}>
        <h1 className={css({ fontSize: "lg", mb: "3" })}>お気に入りの資材</h1>
        <SavedList items={result.data} />
        <SavedPosts userId={access.session.userId} />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
