import { notFound } from "next/navigation";

import { AppBar } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { errorMessageJa } from "@/server/errors";
import { listMaterialsForCompare } from "@/server/queries/saved-materials";
import { css } from "../../../../../styled-system/css";

import { NonGeneralNotice } from "../../_components/NonGeneralNotice";
import { resolveMeAccess } from "../../_lib/access";
import { CompareTable } from "./CompareTable";

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
  maxW: "content.wide",
  mx: "auto",
  px: "4",
  py: "4",
  pb: "8",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ComparePageProps = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function MeSavedComparePage({ searchParams }: ComparePageProps) {
  const access = await resolveMeAccess("/me/saved/compare");

  if (access.kind === "other") {
    return <NonGeneralNotice accountType={access.accountType} />;
  }

  const params = await searchParams;
  const ids = (params.ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (ids.length === 0 || ids.some((id) => !UUID_PATTERN.test(id))) {
    notFound();
  }

  const result = await listMaterialsForCompare(access.session.userId, ids);

  if (!result.ok) {
    if (result.error === "invalid_body" || result.error === "not_found") {
      notFound();
    }

    throw new Error(errorMessageJa[result.error]);
  }

  return (
    <div className={shell}>
      <AppBar chrome="public" active="me" title="資材比較" backHref="/me/saved" />
      <main className={body}>
        <CompareTable materials={result.data} />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
