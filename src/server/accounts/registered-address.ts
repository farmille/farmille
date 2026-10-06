import { requireGeneralUser, type GeneralSession } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";

export type RegisteredAddress = { prefectureCode: number | null; city: string };

/** 登録住所の読み取り口。user_id を受け取って、その人の行だけを返す。 */
export type RegisteredAddressStore = {
  findByUserId(userId: string): Promise<Result<RegisteredAddress | null>>;
};

/** 市区町村は非公開の profile_contact_details にあり service_role でしか読めない。 */
export function adminRegisteredAddressStore(): RegisteredAddressStore {
  return {
    async findByUserId(userId) {
      const { data, error } = await createAdminSupabase()
        .from("profiles")
        .select("prefecture_code,contact:profile_contact_details(city)")
        .eq("user_id", userId)
        .maybeSingle();
      if (error !== null) {
        console.error("[accounts] 登録住所の取得に失敗", error.code);
        return fail("internal");
      }
      if (data === null) return succeed(null);
      return succeed({ prefectureCode: data.prefecture_code, city: data.contact?.city ?? "" });
    },
  };
}

/** 読む対象は認可済みセッションの本人に固定する。未ログインなら読みに行かない。 */
export async function loadRegisteredAddress(
  session: Result<GeneralSession>,
  store: RegisteredAddressStore,
): Promise<Result<RegisteredAddress>> {
  if (!session.ok) return session;
  const found = await store.findByUserId(session.data.userId);
  if (!found.ok) return found;
  if (found.data === null) return fail("not_found");
  return succeed(found.data);
}

/**
 * ログイン中の本人が登録時に入力した都道府県と市区町村を返す（読み取り専用）。
 * 引数でユーザーを指定させないため、他人の住所は読めない。
 */
export async function getOwnRegisteredAddress(): Promise<Result<RegisteredAddress>> {
  return loadRegisteredAddress(await requireGeneralUser(), adminRegisteredAddressStore());
}
