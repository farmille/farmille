import type { ReceiptAccess } from "@/lib/company-application";
import { randomBytes } from "node:crypto";
import { headers, cookies } from "next/headers";
import nodemailer from "nodemailer";
import * as v from "valibot";
import { clientEnv, serverEnv } from "@/env";
import { companyApplicationSender, receiptAccessEmail } from "@/lib/company-application-email";
import { receiptAccessSchema } from "@/lib/company-application";
import { createAdminSupabase } from "@/server/supabase";
import {
  ApplicationError,
  applicationCookie,
  checkApplicationDb,
  secretHash,
} from "./company-application-auth";

async function checkRate(email: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();

  if (!ip) throw new ApplicationError("invalid_body");

  for (const [key, limit] of [
    [`mail:${email.toLowerCase()}`, 5],
    [`ip:${ip}`, 20],
  ] satisfies [string, number][]) {
    const result = await createAdminSupabase().rpc("check_company_application_rate", {
      p_key_hash: secretHash(key),
      p_limit: limit,
    });

    checkApplicationDb(result.error);

    if (!result.data) throw new ApplicationError("rate_limited");
  }
}

async function sendReceiptAccessLink(to: string, token: string, company: string, contact: string) {
  const link = new URL("/company-requests/receipts/confirm", clientEnv.siteUrl);
  link.hash = token;

  try {
    await nodemailer.createTransport(serverEnv.smtpUrl).sendMail({
      from: companyApplicationSender,
      replyTo: "contact@farmille.com",
      to,
      ...receiptAccessEmail(company, contact, link.toString()),
    });
  } catch {
    throw new ApplicationError("internal");
  }
}

export async function requestReceiptAccess(input: ReceiptAccess) {
  const values = v.parse(receiptAccessSchema, input);
  await checkRate(values.email);
  const db = createAdminSupabase();

  const receipt = await db
    .from("company_applications")
    .select("access_id,email,company_name,contact_name")
    .eq("receipt_number", Number(values.receiptNumber))
    .eq("kind", "removal")
    .maybeSingle();

  checkApplicationDb(receipt.error);

  if (!receipt.data?.access_id || receipt.data.email !== values.email) return true;
  const token = randomBytes(32).toString("hex");

  const updated = await db
    .from("company_application_access")
    .update({
      token_hash: secretHash(token),
      token_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      consumed_at: null,
    })
    .eq("id", receipt.data.access_id);

  checkApplicationDb(updated.error);
  await sendReceiptAccessLink(
    values.email,
    token,
    receipt.data.company_name,
    receipt.data.contact_name,
  );

  return true;
}

export async function confirmReceiptAccess(token: string) {
  v.parse(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)), token);
  const secret = randomBytes(32).toString("hex");
  const db = createAdminSupabase();

  const confirmed = await db.rpc("confirm_company_application_access", {
    p_token_hash: secretHash(token),
    p_session_hash: secretHash(secret),
  });

  checkApplicationDb(confirmed.error);

  if (!confirmed.data) throw new ApplicationError("expired_link");
  (await cookies()).set(applicationCookie, secret, {
    httpOnly: true,
    secure: new URL(clientEnv.siteUrl).protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  const receipt = await db
    .from("company_applications")
    .select("id")
    .eq("access_id", confirmed.data)
    .maybeSingle();

  checkApplicationDb(receipt.error);

  return receipt.data
    ? `/company-requests/receipts/${receipt.data.id}`
    : "/company-requests/receipts";
}
