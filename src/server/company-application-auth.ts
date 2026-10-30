import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import * as v from "valibot";
import { requireAdmin, requireSeller } from "@/server/auth";
import { createAdminSupabase } from "@/server/supabase";
import { ErrorCodeSchema, type ErrorCode } from "@/server/errors";
import { fail, type Result } from "@/server/result";

export const applicationCookie = "farmille_application_access";
export const secretHash = (value: string) => createHash("sha256").update(value).digest("hex");

export class ApplicationError extends Error {
  constructor(public code: ErrorCode) {
    super(code);
  }
}

export function checkApplicationDb(error: { message: string } | null) {
  if (!error) return;
  const code = v.safeParse(ErrorCodeSchema, error.message);

  if (code.success) throw new ApplicationError(code.output);
  console.error("[company-application] データベース操作に失敗しました。");
  throw new ApplicationError("internal");
}

export async function applicationResult<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof ApplicationError) return fail(error.code);

    if (v.isValiError(error)) return fail("invalid_body");
    console.error("[company-application] 申請処理に失敗しました。");

    return fail("internal");
  }
}

export async function approvedApplicationSeller() {
  const session = await requireSeller();

  if (!session.ok) throw new ApplicationError(session.error);

  const { data, error } = await createAdminSupabase()
    .from("seller_accounts")
    .select("*")
    .eq("id", session.data.sellerId)
    .eq("auth_user_id", session.data.userId)
    .eq("status", "approved")
    .maybeSingle();

  checkApplicationDb(error);

  if (!data) throw new ApplicationError("forbidden");

  return { seller: data, userId: session.data.userId };
}

export async function removalApplicationAccess() {
  const cookie = (await cookies()).get(applicationCookie)?.value;

  if (!cookie) throw new ApplicationError("expired_link");
  const sessionHash = secretHash(cookie);

  const { data, error } = await createAdminSupabase()
    .from("company_application_access")
    .select("*")
    .eq("session_hash", sessionHash)
    .gt("session_expires_at", new Date().toISOString())
    .maybeSingle();

  checkApplicationDb(error);

  if (!data) throw new ApplicationError("expired_link");

  return { access: data, sessionHash };
}

export async function applicationIntentActor(id: string) {
  const { data: intent, error } = await createAdminSupabase()
    .from("company_application_intents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  checkApplicationDb(error);

  if (!intent || intent.cleanup_claimed_at) throw new ApplicationError("not_found");

  if (intent.access_id) {
    const { access, sessionHash } = await removalApplicationAccess();

    if (access.id !== intent.access_id) throw new ApplicationError("forbidden");

    return { kind: "guest" as const, intent, sessionHash };
  }

  const { seller, userId } = await approvedApplicationSeller();

  if (seller.id !== intent.seller_id) throw new ApplicationError("forbidden");

  return { kind: "seller" as const, intent, userId };
}

export async function authorizeApplicationReceipt(id: string) {
  const admin = await requireAdmin();

  if (admin.ok) return;
  await applicationIntentActor(id);
}

export function applicationActorArgs(actor: Awaited<ReturnType<typeof applicationIntentActor>>) {
  return actor.kind === "seller"
    ? { p_user_id: actor.userId }
    : { p_session_hash: actor.sessionHash };
}
