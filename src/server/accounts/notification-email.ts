import nodemailer from "nodemailer";
import * as v from "valibot";
import { clientEnv, serverEnv } from "@/env";
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
      subject: "Farmille：メーカーアカウントのご案内",
      text: `メーカーアカウントの申請を承認しました。\n\nログインID：${loginId}\nパスワード設定：${passwordSetupUrl}\n\nメーカーのログイン画面：${new URL("/sellers/login", clientEnv.siteUrl)}\n\nパスワード設定リンクの期限が切れた場合は、ログイン画面の「パスワードをお忘れの方」から再発行してください。\n資材の編集権については、運営から別途ご案内します。\n`,
    });
    return true;
  } catch (error) {
    console.error("[notification-email] メーカー案内メールの送信に失敗", error);
    return false;
  }
}

/** 確認済み本人の未送信通知だけを取得し、同時ログインによる重複送信を防ぐ。 */
export async function sendPendingRegistrationEmail(): Promise<void> {
  const session = await createServerSupabase();
  const { data, error } = await session.auth.getUser();
  if (error || !data.user?.email_confirmed_at || !data.user.email) return;
  const user = data.user;
  const db = createAdminSupabase();
  const claimedAt = new Date().toISOString();
  const expiredClaim = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const claim = await db
    .from("registration_notifications")
    .update({ claimed_at: claimedAt })
    .eq("user_id", user.id)
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
      to: v.parse(EmailSchema, user.email),
      subject: "Farmille：会員登録が完了しました",
      text: `Farmilleへの会員登録が完了しました。\n\nマイページから主な作目・所属・自己紹介を設定できます。\n${new URL("/me", clientEnv.siteUrl)}\n\n感想口コミや実証詳細レポートの投稿、お気に入りの保存にご利用ください。\n`,
    });
  } catch (error) {
    console.error(
      "[notification-email] 登録完了メールの送信に失敗。次回ログイン時に再試行します",
      error,
    );
    const released = await db
      .from("registration_notifications")
      .update({ claimed_at: null })
      .eq("user_id", user.id)
      .eq("claimed_at", claimedAt);
    if (released.error)
      console.error("[notification-email] 送信待ちへの復帰に失敗", released.error);
    return;
  }
  const marked = await db
    .from("registration_notifications")
    .update({ sent_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("claimed_at", claimedAt);
  if (marked.error) console.error("[notification-email] 送信済み記録に失敗", marked.error);
}
