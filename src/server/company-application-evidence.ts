import type { EvidenceReservation } from "@/lib/company-application";
import { randomUUID, createHash } from "node:crypto";
import * as v from "valibot";
import { evidenceReservationSchema, uuidSchema } from "@/lib/company-application";
import { createAdminSupabase } from "./supabase";
import {
  applicationActorArgs,
  ApplicationError,
  applicationIntentActor,
  authorizeApplicationReceipt,
  checkApplicationDb,
} from "./company-application-auth";
import { applicationData } from "./company-applications";

const bucket = "company-application-evidence";
export async function reserveApplicationEvidence(input: EvidenceReservation) {
  const values = v.parse(evidenceReservationSchema, input);
  const actor = await applicationIntentActor(values.intentId);
  const db = createAdminSupabase();
  const evidence = applicationData(
    await db.rpc("reserve_company_application_evidence", {
      p_intent_id: values.intentId,
      ...applicationActorArgs(actor),
      p_item_key: values.itemKey ?? undefined,
      p_purpose: values.purpose,
      p_file_name: values.fileName,
      p_mime: values.mime,
      p_size: values.size,
    }),
  );
  const upload = await db.storage
    .from(bucket)
    .createSignedUploadUrl(evidence.staging_path, { upsert: false });
  if (upload.error) {
    await db.rpc("remove_company_application_evidence", {
      p_id: evidence.id,
      ...applicationActorArgs(actor),
    });
    throw new ApplicationError("internal");
  }
  return { id: evidence.id, path: upload.data.path, token: upload.data.token };
}
export function evidenceMatchesMime(bytes: Uint8Array, mime: string) {
  if (mime === "application/pdf")
    return Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-";
  if (mime === "image/png")
    return Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return mime === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
}
export async function finalizeApplicationEvidence(rawId: string) {
  const id = v.parse(uuidSchema, rawId);
  const db = createAdminSupabase();
  const file = applicationData(
    await db.from("company_application_evidence").select("*").eq("id", id).maybeSingle(),
  );
  const actor = await applicationIntentActor(file.intent_id);
  if (actor.intent.submitted_at) throw new ApplicationError("conflict");
  if (file.verified_at) return true;
  const downloaded = await db.storage.from(bucket).download(file.staging_path);
  if (downloaded.error) throw new ApplicationError("invalid_body");
  const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
  if (
    bytes.byteLength !== file.byte_size ||
    bytes.byteLength > 10 * 1024 * 1024 ||
    downloaded.data.type !== file.declared_mime ||
    !evidenceMatchesMime(bytes, file.declared_mime)
  )
    throw new ApplicationError("invalid_body");
  const sealed = `sealed/${file.intent_id}/${randomUUID()}`;
  const uploaded = await db.storage
    .from(bucket)
    .upload(sealed, bytes, { contentType: file.declared_mime, upsert: false });
  if (uploaded.error) throw new ApplicationError("internal");
  const result = await db.rpc("finalize_company_application_evidence", {
    p_id: id,
    ...applicationActorArgs(actor),
    p_sealed_path: sealed,
    p_sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  if (result.error) {
    const removed = await db.storage.from(bucket).remove([sealed]);
    if (removed.error) console.error("[company-application] 未使用資料の削除に失敗しました。");
    checkApplicationDb(result.error);
  }
  return true;
}
export async function removeApplicationEvidence(rawId: string) {
  const id = v.parse(uuidSchema, rawId);
  const db = createAdminSupabase();
  const file = applicationData(
    await db.from("company_application_evidence").select("*").eq("id", id).maybeSingle(),
  );
  const actor = await applicationIntentActor(file.intent_id);
  const removed = applicationData(
    await db.rpc("remove_company_application_evidence", {
      p_id: id,
      ...applicationActorArgs(actor),
    }),
  );
  const objects = await db.storage
    .from(bucket)
    .remove(
      removed.sealed_path ? [removed.staging_path, removed.sealed_path] : [removed.staging_path],
    );
  if (objects.error) console.error("[company-application] 未提出資料の削除に失敗しました。");
  return true;
}
export async function downloadApplicationEvidence(rawId: string) {
  const id = v.parse(uuidSchema, rawId);
  const db = createAdminSupabase();
  const file = applicationData(
    await db.from("company_application_evidence").select("*").eq("id", id).maybeSingle(),
  );
  await authorizeApplicationReceipt(file.intent_id);
  const receipt = await db
    .from("company_applications")
    .select("id")
    .eq("id", file.intent_id)
    .maybeSingle();
  checkApplicationDb(receipt.error);
  if (!receipt.data || !file.sealed_path) throw new ApplicationError("not_found");
  const result = await db.storage
    .from(bucket)
    .createSignedUrl(file.sealed_path, 60, { download: file.file_name });
  if (result.error) throw new ApplicationError("internal");
  return result.data.signedUrl;
}

export async function cleanupExpiredApplicationUploads() {
  const db = createAdminSupabase();
  const intents = await db.rpc("claim_expired_company_application_uploads");
  checkApplicationDb(intents.error);
  if (!intents.data) return;
  for (const intent of intents.data) {
    const files = applicationData(
      await db
        .from("company_application_evidence")
        .select("staging_path,sealed_path")
        .eq("intent_id", intent.id),
    );
    const paths = files.flatMap((file) =>
      file.sealed_path ? [file.staging_path, file.sealed_path] : [file.staging_path],
    );
    const removed = await db.storage.from(bucket).remove(paths);
    if (removed.error) {
      console.error("[company-application] 期限切れ資料の削除に失敗しました。");
      continue;
    }
    checkApplicationDb(
      (await db.from("company_application_evidence").delete().eq("intent_id", intent.id)).error,
    );
  }
}
