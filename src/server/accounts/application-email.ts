import nodemailer from "nodemailer";
import { clientEnv, serverEnv } from "@/env";
import { applicationReceiptLines } from "@/lib/company-application-receipt";
import { readCompanyApplication } from "@/server/company-applications";
import { createAdminSupabase } from "@/server/supabase";
import { checkApplicationDb } from "@/server/company-application-auth";

export async function sendApplicationReceipt(id: string) {
  const receipt = await readCompanyApplication(id);
  const db = createAdminSupabase();
  const now = new Date().toISOString();
  const claimed = await db
    .from("company_application_mail_deliveries")
    .update({ claimed_at: now, attempts: receipt.delivery.attempts + 1, last_error_code: null })
    .eq("application_id", id)
    .is("sent_at", null)
    .or(`claimed_at.is.null,claimed_at.lt.${new Date(Date.now() - 5 * 60 * 1000).toISOString()}`)
    .select("application_id")
    .maybeSingle();
  checkApplicationDb(claimed.error);
  if (!claimed.data) return;
  const path =
    receipt.application.kind === "removal"
      ? "/company-requests/receipts"
      : `/dashboard/applications/${id}`;
  try {
    await nodemailer.createTransport(serverEnv.smtpUrl).sendMail({
      from: serverEnv.mailFrom,
      to: receipt.delivery.recipient,
      messageId: `<application-${id}@farmille.com>`,
      subject: `Farmille：申請受付の控え（受付番号 ${receipt.application.receipt_number}）`,
      text: `ご申請を受け付けました。手続きの完了や不足資料については、担当者メールアドレスにご連絡します。\n\n${applicationReceiptLines(receipt).join("\n")}\n\n受付票の確認・印刷：${new URL(path, clientEnv.siteUrl)}\n\n訂正が必要な場合は、受付番号を添えて運営へご連絡ください。`,
    });
  } catch {
    const failed = await db
      .from("company_application_mail_deliveries")
      .update({ claimed_at: null, last_error_code: "smtp_failed" })
      .eq("application_id", id)
      .eq("claimed_at", now);
    checkApplicationDb(failed.error);
    return;
  }
  const marked = await db
    .from("company_application_mail_deliveries")
    .update({ sent_at: new Date().toISOString(), claimed_at: null })
    .eq("application_id", id)
    .eq("claimed_at", now);
  checkApplicationDb(marked.error);
}
