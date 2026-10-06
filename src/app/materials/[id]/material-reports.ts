import { cache } from "react";

import { listPublishedUsageReportsByMaterial } from "@/server/queries/material-content";

/** 資材ページに並べる実証詳細レポートの上限。 */
const MATERIAL_PAGE_REPORT_LIMIT = 3;

/** 資材カードの件数と一覧で同じ取得結果を使い、1回の描画の中では1度だけ取得する。 */
export const loadMaterialReports = cache((materialId: string) =>
  listPublishedUsageReportsByMaterial(materialId, { limit: MATERIAL_PAGE_REPORT_LIMIT }),
);
