import nodemailer from "nodemailer";
import { Webhook } from "standardwebhooks";
import * as v from "valibot";

import { clientEnv, serverEnv } from "@/env";
import { safeNextPath } from "@/lib/auth/safe-next";
import { createAdminSupabase } from "@/server/supabase";

const EmailSchema = v.pipe(v.string(), v.email());
export const AuthEmailSchema = v.object({
  user: v.object({
    id: v.pipe(v.string(), v.uuid()),
    email: EmailSchema,
    new_email: v.optional(v.string()),
  }),
  email_data: v.object({
    email_action_type: v.picklist([
      "signup",
      "recovery",
      "invite",
      "magiclink",
      "email_change",
      "reauthentication",
    ]),
    token_hash: v.string(),
    token: v.string(),
    token_hash_new: v.optional(v.string()),
    token_new: v.optional(v.string()),
    redirect_to: v.optional(v.string()),
  }),
});
type AuthEmail = v.InferOutput<typeof AuthEmailSchema>;

export function verifyAuthEmail(body: string, headers: Headers): AuthEmail {
  const secret = serverEnv.authEmailHookSecret.replace(/^v1,whsec_/, "");
  const verified: unknown = new Webhook(secret).verify(body, Object.fromEntries(headers));
  return v.parse(AuthEmailSchema, verified);
}

/** 宛先は署名済みIDと承認状態から解決し、内部認証アドレスには送信しない。 */
async function recipientFor(user: AuthEmail["user"]): Promise<string> {
  const db = createAdminSupabase();
  const seller = await db
    .from("seller_accounts")
    .select("status,contact_email")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (seller.error) throw new Error("認証メールの宛先を確認できませんでした。");
  if (seller.data) {
    if (seller.data.status !== "approved") throw new Error("承認済みメーカーではありません。");
    return v.parse(EmailSchema, seller.data.contact_email);
  }
  if (user.email.endsWith("@sellers.farmille.internal"))
    throw new Error("メーカーの連絡先がありません。");
  return user.email;
}

export function confirmationUrl(tokenHash: string, type: string, redirectTo?: string): string {
  if (!tokenHash) throw new Error("認証トークンがありません。");
  const url = new URL(
    type === "recovery" ? "/password-reset/update" : "/auth/confirm",
    clientEnv.siteUrl,
  );
  url.searchParams.set("token_hash", tokenHash);
  if (type !== "recovery") url.searchParams.set("type", type);
  if (["signup", "magiclink"].includes(type) && redirectTo) {
    const destination = new URL(v.parse(v.pipe(v.string(), v.url()), redirectTo));
    if (destination.origin === url.origin && destination.pathname === "/auth/confirm") {
      if (destination.searchParams.get("registration") === "1")
        url.searchParams.set("registration", "1");
      const next = safeNextPath(destination.searchParams.get("next"));
      if (next) url.searchParams.set("next", next);
    }
  }
  return url.toString();
}

/** トークンはメールだけに載せ、署名済みpayload内の任意URLをリンク先に使わない。 */
export async function deliverAuthEmail(input: AuthEmail): Promise<void> {
  const to = await recipientFor(input.user);
  const data = input.email_data;
  const transport = nodemailer.createTransport(serverEnv.smtpUrl);
  async function send(recipient: string, subject: string, content: string) {
    await transport.sendMail({
      from: serverEnv.mailFrom,
      to: recipient,
      subject: `Farmille：${subject}`,
      text: `${content}\n\n心当たりがない場合は、このメールを破棄してください。\n`,
    });
  }
  if (data.email_action_type === "reauthentication") {
    await send(to, "本人確認コード", `本人確認コードは ${data.token} です。`);
    return;
  }
  if (data.email_action_type === "email_change") {
    const newEmail = v.parse(EmailSchema, input.user.new_email);
    if (data.token_hash_new)
      await send(
        to,
        "メールアドレス変更の確認",
        confirmationUrl(data.token_hash_new, "email_change"),
      );
    await send(
      newEmail,
      "メールアドレス変更の確認",
      confirmationUrl(data.token_hash, "email_change"),
    );
    return;
  }
  const recovery = data.email_action_type === "recovery";
  await send(
    to,
    recovery ? "パスワードの再設定" : "メールアドレスの確認",
    `${recovery ? "次のリンクから新しいパスワードを設定してください。" : "次のリンクからメールアドレスを確認し、登録情報を入力してください。リンクの有効期限は1時間です。"}\n\n${confirmationUrl(data.token_hash, data.email_action_type, data.redirect_to)}`,
  );
}
