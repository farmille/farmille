import { fn } from "storybook/test";

export const listMaterialPageAudits = fn<
  typeof import("@/server/material-page-audits").listMaterialPageAudits
>(async () => [
  {
    id: "11111111-1111-4111-8111-111111111111",
    outcome: "内容を確認してください。",
    note: "内容を確認してください。",
    created_at: "2026-09-15T09:00:00Z",
  },
]).mockName("listMaterialPageAudits");

export const recordMaterialPageAudit = fn<
  typeof import("@/server/material-page-audits").recordMaterialPageAudit
>(async () => ({ ok: true, data: null })).mockName("recordMaterialPageAudit");

export const listMaterialEditorGrants = fn<
  typeof import("@/server/material-page-audits").listMaterialEditorGrants
>(async () => [
  {
    id: "11111111-1111-4111-8111-111111111111",
    seller_id: "11111111-1111-4111-8111-111111111111",
    document_reference: "内容を確認してください。",
    granted_at: "2026-09-15T09:00:00Z",
    revoked_at: null,
  },
]).mockName("listMaterialEditorGrants");
