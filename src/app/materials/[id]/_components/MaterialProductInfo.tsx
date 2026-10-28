import { materialSourceLinks } from "@/lib/material-links";
import type { MaterialPageContent } from "@/lib/material-page-editor";
import type { MaterialDetail } from "@/server/queries/materials";

import { css } from "../../../../../styled-system/css";

import { MaterialDetailTable, materialDetailRows } from "./DetailTable";
import { MaterialDescriptionBox, MaterialTimingBox } from "./MaterialOverview";
import { MaterialSourceLinks } from "./MaterialSourceLinks";

const emptyStyle = css({ textStyle: "body", color: "text.muted" });

/** 製品情報の区画のうち、値のあるものだけを出す。どれにも値が無ければ1行の案内だけを出す。 */
export function MaterialProductInfo({
  material,
  content,
}: {
  material: MaterialDetail;
  content: MaterialPageContent | undefined;
}) {
  const description = content?.description ?? "";
  const timings = content?.timings ?? [];
  const links = content === undefined ? materialSourceLinks(material) : content.links;
  const detailRows = materialDetailRows(material, content);

  if (
    description.length === 0 &&
    timings.length === 0 &&
    links.length === 0 &&
    detailRows.length === 0
  ) {
    return <p className={emptyStyle}>この資材の製品情報は、まだ登録されていません。</p>;
  }

  return (
    <>
      {description.length > 0 ? <MaterialDescriptionBox description={description} /> : null}
      {timings.length > 0 ? <MaterialTimingBox timings={timings} /> : null}
      {links.length > 0 ? <MaterialSourceLinks links={links} /> : null}
      {detailRows.length > 0 ? <MaterialDetailTable rows={detailRows} /> : null}
    </>
  );
}
