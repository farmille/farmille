import nodemailer from "nodemailer";
import * as v from "valibot";
import { clientEnv, serverEnv } from "@/env";
import {
  registrationCompleteEmail,
  sellerWelcomeEmail,
  withdrawalCompleteEmail,
} from "@/lib/account-email";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";

const EmailSchema = v.pipe(v.string(), v.email());

export async function sendSellerWelcome(
  to: string,
  loginId: string,
  passwordSetupUrl: string,
): Promise<boolean> {
  try {
    await nodemailer.createTransport(serverEnv.smtpUrl).sendMail({
      from: serverEnv.mailFrom,
      to: v.parse(EmailSchema, to),
      ...sellerWelcomeEmail(loginId, passwordSetupUrl, clientEnv.siteUrl),
    });
    return true;
  } catch (error) {
    console.error("[notification-email] メーカー案内メールの送信に失敗", error);
    return false;
  }
}

/** 退会後は Auth のユーザーが消えているので、退会前に控えたアドレスへ送る。 */
export async function sendWithdrawalCompleteEmail(to: string): Promise<boolean> {
  try {
    await nodemailer.createTransport(serverEnv.smtpUrl).sendMail({
      from: serverEnv.mailFrom,
      to: v.parse(EmailSchema, to),
      ...withdrawalCompleteEmail(clientEnv.siteUrl),
    });
    return true;
  } catch (error) {
    console.error("[notification-email] 退会完了メールの送信に失敗", error);
    return false;
  }
}

/** 確認済み本人の未送信通知だけを取得し、同時ログインによる重複送信を防ぐ。 */
export async function sendPendingRegistrationEmail(): Promise<void> {
  const session = await createServerSupabase();
  const { data, error } = await session.auth.getUser();
  if (error || !data.user?.email_confirmed_at || !data.user.email) return;
  await sendRegistrationEmail(data.user.id, data.user.email);
}

export async function sendRegistrationEmail(userId: string, email: string): Promise<void> {
  const db = createAdminSupabase();
  const claimedAt = new Date().toISOString();
  const expiredClaim = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const claim = await db
    .from("registration_notifications")
    .update({ claimed_at: claimedAt })
    .eq("user_id", userId)
    .is("sent_at", null)
    .or(`claimed_at.is.null,claimed_at.lt.${expiredClaim}`)
    .select("user_id")
    .maybeSingle();
  if (claim.error) {
    console.error("[notification-email] 登録通知の取得に失敗", claim.error);
    return;
  }
  if (!claim.data) return;
  try {
    await nodemailer.createTransport(serverEnv.smtpUrl).sendMail({
      from: serverEnv.mailFrom,
      to: v.parse(EmailSchema, email),
      ...registrationCompleteEmail(clientEnv.siteUrl),
    });
  } catch (error) {
    console.error(
      "[notification-email] 登録完了メールの送信に失敗。次回ログイン時に再試行します",
      error,
    );
    const released = await db
      .from("registration_notifications")
      .update({ claimed_at: null })
      .eq("user_id", userId)
      .eq("claimed_at", claimedAt);
    if (released.error)
      console.error("[notification-email] 送信待ちへの復帰に失敗", released.error);
    return;
  }
  const marked = await db
    .from("registration_notifications")
    .update({ sent_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("claimed_at", claimedAt);
  if (marked.error) console.error("[notification-email] 送信済み記録に失敗", marked.error);
}
