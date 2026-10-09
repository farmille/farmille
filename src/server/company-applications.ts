import type { ApplicationSubmission } from "@/lib/company-application";
import * as v from "valibot";
import {
  submissionSchema,
  submittableKindSchema,
  uuidSchema,
  type SubmittableKind,
} from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";
import { clientEnv } from "@/env";
import { createAdminSupabase } from "./supabase";
import { requireAdmin } from "./auth";
import {
  applicationActorArgs,
  ApplicationError,
  applicationIntentActor,
  approvedApplicationSeller,
  authorizeApplicationReceipt,
  checkApplicationDb,
} from "./company-application-auth";

export function applicationData<T>(result: {
  data: T;
  error: { message: string } | null;
}): NonNullable<T> {
  checkApplicationDb(result.error);
  if (result.data === null || result.data === undefined) throw new ApplicationError("not_found");
  return result.data;
}
export async function beginCompanyApplication(kind: SubmittableKind) {
  v.parse(submittableKindSchema, kind);
  const { seller } = await approvedApplicationSeller();
  return applicationData(
    await createAdminSupabase()
      .from("company_application_intents")
      .insert({ kind, seller_id: seller.id })
      .select()
      .single(),
  );
}
function materialId(url: string) {
  const parsed = new URL(url);
  const path = /^\/materials\/([a-f\d-]+)\/?$/.exec(parsed.pathname);
  if (parsed.origin !== new URL(clientEnv.siteUrl).origin || !path?.[1])
    throw new ApplicationError("invalid_body");
  return v.parse(uuidSchema, path[1]);
}
export async function saveCompanyApplication(raw: ApplicationSubmission) {
  const { intentId, input } = v.parse(submissionSchema, raw);
  const actor = await applicationIntentActor(intentId);
  const resolvedItems = input.items.map((item) => ({
    ...item,
    materialId: item.materialUrl ? materialId(item.materialUrl) : "",
  }));
  const result = await createAdminSupabase().rpc("submit_company_application", {
    p_intent_id: intentId,
    ...applicationActorArgs(actor),
    p_input: { ...input, items: resolvedItems },
    p_consents: applicationCopy[input.kind].consents.map((text, index) =>
      index === applicationCopy[input.kind].consents.length - 1
        ? `${applicationCopy[input.kind].privacy}\n${text}`
        : text,
    ),
  });
  return applicationData(result);
}
export async function readCompanyApplication(id: string) {
  v.parse(uuidSchema, id);
  await authorizeApplicationReceipt(id);
  const db = createAdminSupabase();
  const [application, items, consents, evidence, delivery, transferOut, transferIn, removal] =
    await Promise.all([
      db.from("company_applications").select("*").eq("id", id).single(),
      db
        .from("company_application_items")
        .select(
          "*,company_application_relations(*),company_application_registration_items(*),company_application_transfer_in_items(*),company_application_removal_items(*),company_application_evidence_links(*)",
        )
        .eq("application_id", id)
        .order("position"),
      db
        .from("company_application_consents")
        .select("*")
        .eq("application_id", id)
        .order("position"),
      db
        .from("company_application_evidence")
        .select("id,item_key,purpose,file_name,byte_size")
        .eq("intent_id", id)
        .order("created_at"),
      db.from("company_application_mail_deliveries").select("*").eq("application_id", id).single(),
      db
        .from("company_application_transfer_out")
        .select("*")
        .eq("application_id", id)
        .maybeSingle(),
      db.from("company_application_transfer_in").select("*").eq("application_id", id).maybeSingle(),
      db.from("company_application_removals").select("*").eq("application_id", id).maybeSingle(),
    ]);
  checkApplicationDb(transferOut.error);
  checkApplicationDb(transferIn.error);
  checkApplicationDb(removal.error);
  return {
    application: applicationData(application),
    items: applicationData(items),
    consents: applicationData(consents),
    evidence: applicationData(evidence),
    delivery: applicationData(delivery),
    transferOut: transferOut.data,
    transferIn: transferIn.data,
    removal: removal.data,
  };
}
export type ApplicationReceipt = Awaited<ReturnType<typeof readCompanyApplication>>;
export async function listCompanyApplications(admin = false) {
  let query = createAdminSupabase()
    .from("company_applications")
    .select(
      "id,kind,receipt_number,company_name,submitted_at,company_application_mail_deliveries(sent_at,last_error_code)",
    )
    .order("submitted_at", { ascending: false });
  if (admin) {
    const session = await requireAdmin();
    if (!session.ok) throw new ApplicationError(session.error);
  } else {
    const { seller } = await approvedApplicationSeller();
    query = query.eq("seller_id", seller.id);
  }
  return applicationData(await query.limit(100));
}
