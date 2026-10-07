import { cache } from "react";

import { listPublishedUsageReportsByMaterial } from "@/server/queries/material-content";

const MATERIAL_PAGE_REPORT_LIMIT = 3;

export const loadMaterialReports = cache((materialId: string) =>
  listPublishedUsageReportsByMaterial(materialId, { limit: MATERIAL_PAGE_REPORT_LIMIT }),
);
