import { redirect } from "next/navigation";

import { getSessionUser } from "@/server/auth";
import { createServerSupabase } from "@/server/supabase";

/** パスキー管理も運営アカウントの AAL2 要件を維持する。 */
export async function getAccountPasskeys() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=%2Faccount%2Fpasskeys");
  if (user.accountType === "admin" && user.aal !== "aal2") {
    redirect("/admin/mfa?next=%2Faccount%2Fpasskeys");
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.passkey.list();
  if (error)
    throw new Error("パスキーの一覧を取得できませんでした。時間をおいて再度お試しください。");
  return { passkeys: data, accountType: user.accountType };
}
