import { requireGeneralUser, type GeneralSession } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";

export type RegisteredAddress = { prefectureCode: number | null };

export type RegisteredAddressStore = {
  findByUserId(userId: string): Promise<Result<RegisteredAddress | null>>;
};

export function adminRegisteredAddressStore(): RegisteredAddressStore {
  return {
    async findByUserId(userId) {
      const { data, error } = await createAdminSupabase()
        .from("profiles")
        .select("prefecture_code")
        .eq("user_id", userId)
        .maybeSingle();

      if (error !== null) {
        console.error("[accounts] 登録住所の取得に失敗", error.code);

        return fail("internal");
      }

      if (data === null) return succeed(null);

      return succeed({ prefectureCode: data.prefecture_code });
    },
  };
}

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

export async function getOwnRegisteredAddress(): Promise<Result<RegisteredAddress>> {
  return loadRegisteredAddress(await requireGeneralUser(), adminRegisteredAddressStore());
}
