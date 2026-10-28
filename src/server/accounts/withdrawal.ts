import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import {
  createAdminSupabase,
  createIsolatedAuthClient,
  createServerSupabase,
} from "@/server/supabase";

import type { MemberAccount } from "./member-account";
import { sendWithdrawalCompleteEmail } from "./notification-email";

export type WithdrawalSteps = {
  verifyPassword(account: MemberAccount, password: string): Promise<Result<null>>;
  withdrawProfile(userId: string): Promise<Result<null>>;
  removeAvatars(userId: string): Promise<Result<null>>;
  deleteAuthUser(userId: string): Promise<Result<null>>;
  sendCompletionEmail(email: string): Promise<boolean>;
  signOut(): Promise<Result<null>>;
};

/**
 * 退会の順序。Auth のユーザーを消すまでは、どこで止まっても本人のログインが残るので、
 * もう一度押すと同じ順序で最後まで進む（DB とアイコンの処理は何度実行しても同じ結果になる）。
 */
export async function withdrawMember(
  account: MemberAccount,
  password: string,
  steps: WithdrawalSteps,
): Promise<Result<null>> {
  const verified = await steps.verifyPassword(account, password);
  if (!verified.ok) return verified;
  // Auth のユーザーを消すとアドレスも消えるので、完了メールの宛先を先に控える。
  const email = account.email;
  const profile = await steps.withdrawProfile(account.userId);
  if (!profile.ok) return profile;
  const avatars = await steps.removeAvatars(account.userId);
  if (!avatars.ok) return avatars;
  const deleted = await steps.deleteAuthUser(account.userId);
  if (!deleted.ok) return deleted;
  // ここから先はログインも Auth のユーザーも無く、押し直せない。失敗は記録して退会を完了として扱う。
  if (!(await steps.sendCompletionEmail(email)))
    console.error("[accounts] 退会完了メールを送れませんでした", account.userId);
  const signedOut = await steps.signOut();
  if (!signedOut.ok)
    console.error("[accounts] 退会後のログアウトに失敗", account.userId, signedOut.error);
  return succeed(null);
}

const AVATAR_BUCKET = "avatars";
const AVATAR_PAGE = 100;

export function liveWithdrawalSteps(): WithdrawalSteps {
  return {
    async verifyPassword(account, password) {
      // ブラウザのセッション cookie を書き換えないよう、保存しないクライアントで確かめる。
      const verifier = createIsolatedAuthClient();
      const verified = await verifier.auth.signInWithPassword({ email: account.email, password });
      if (verified.error) return fail(toErrorCode(verified.error, "verifyWithdrawalPassword"));
      if (verified.data.user.id !== account.userId) return fail("forbidden");
      const closed = await verifier.auth.signOut({ scope: "local" });
      if (closed.error) return fail(toErrorCode(closed.error, "closeWithdrawalVerification"));
      return succeed(null);
    },
    async withdrawProfile(userId) {
      const { error } = await createAdminSupabase().rpc("withdraw_general_member", {
        p_user_id: userId,
      });
      if (error === null) return succeed(null);
      console.error("[accounts] 退会の記録に失敗", error.code);
      return fail(error.code === "P0002" ? "not_found" : "internal");
    },
    async removeAvatars(userId) {
      const bucket = createAdminSupabase().storage.from(AVATAR_BUCKET);
      for (;;) {
        const listed = await bucket.list(userId, { limit: AVATAR_PAGE });
        if (listed.error) {
          console.error("[accounts] アイコンの一覧の取得に失敗", listed.error.message);
          return fail("internal");
        }
        if (listed.data.length === 0) return succeed(null);
        const removed = await bucket.remove(listed.data.map((item) => `${userId}/${item.name}`));
        if (removed.error || removed.data.length === 0) {
          console.error("[accounts] アイコンの削除に失敗", removed.error?.message);
          return fail("internal");
        }
      }
    },
    async deleteAuthUser(userId) {
      // 論理削除なら行が残り、profiles と投稿の on delete cascade は動かない。
      const { error } = await createAdminSupabase().auth.admin.deleteUser(userId, true);
      return error ? fail(toErrorCode(error, "softDeleteMember")) : succeed(null);
    },
    sendCompletionEmail: sendWithdrawalCompleteEmail,
    async signOut() {
      const { error } = await (await createServerSupabase()).auth.signOut({ scope: "local" });
      return error ? fail(toErrorCode(error, "signOutAfterWithdrawal")) : succeed(null);
    },
  };
}
