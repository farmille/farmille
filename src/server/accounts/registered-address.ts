import * as v from "valibot";

import { registeredContactSchema } from "@/lib/auth/registration-schema";
import { validateFields, type FieldsValidation, type FormFieldValues } from "@/lib/validation";
import { requireGeneralUser, type GeneralSession } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";
import type { Tables } from "@/types/database.types";

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

/** 登録情報の画面で変更する、本名・電話番号・住所。都道府県だけはプロフィールの地域として公開する。 */
export type RegisteredContactInput = v.InferOutput<typeof registeredContactSchema>;

export type RegisteredContact = {
  prefectureCode: number | null;
  /** 連絡先の行が無いアカウントは null。保存すると行を作る。 */
  contact: Pick<
    Tables<"profile_contact_details">,
    "family_name" | "given_name" | "phone" | "postal_code" | "city_street" | "building_name"
  > | null;
};

export type RegisteredContactStore = {
  /** プロフィールが無ければ null。 */
  findByUserId(userId: string): Promise<Result<RegisteredContact | null>>;
  save(userId: string, input: RegisteredContactInput): Promise<Result<null>>;
};

export function validateRegisteredContact(
  raw: FormFieldValues<typeof registeredContactSchema.entries>,
): FieldsValidation<typeof registeredContactSchema.entries> {
  return validateFields(registeredContactSchema, raw);
}

/** 連絡先は service_role だけが読み書きできるので、呼び出し側が渡す本人の id だけを条件にする。 */
export function adminRegisteredContactStore(): RegisteredContactStore {
  return {
    async findByUserId(userId) {
      const admin = createAdminSupabase();
      const [profile, contact] = await Promise.all([
        admin.from("profiles").select("prefecture_code").eq("user_id", userId).maybeSingle(),
        admin
          .from("profile_contact_details")
          .select("family_name,given_name,phone,postal_code,city_street,building_name")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (profile.error !== null || contact.error !== null) {
        console.error(
          "[accounts] 登録情報の取得に失敗",
          profile.error?.code ?? contact.error?.code,
        );
        return fail("internal");
      }
      if (profile.data === null) return succeed(null);
      return succeed({ prefectureCode: profile.data.prefecture_code, contact: contact.data });
    },
    async save(userId, input) {
      const admin = createAdminSupabase();
      const profile = await admin
        .from("profiles")
        .update({ prefecture_code: input.prefectureCode })
        .eq("user_id", userId)
        .select("user_id");
      if (profile.error !== null) {
        console.error("[accounts] 都道府県の保存に失敗", profile.error.code);
        return fail("internal");
      }
      if (profile.data.length === 0) return fail("not_found");
      const contact = await admin.from("profile_contact_details").upsert(
        {
          user_id: userId,
          family_name: input.familyName,
          given_name: input.givenName,
          phone: input.phone || null,
          postal_code: input.postalCode,
          city_street: input.cityStreet,
          building_name: input.buildingName || null,
        },
        { onConflict: "user_id" },
      );
      if (contact.error !== null) {
        console.error("[accounts] 非公開連絡先の保存に失敗", contact.error.code);
        return fail("internal");
      }
      return succeed(null);
    },
  };
}

export async function loadRegisteredContact(
  session: Result<GeneralSession>,
  store: RegisteredContactStore,
): Promise<Result<RegisteredContact>> {
  if (!session.ok) return session;
  const found = await store.findByUserId(session.data.userId);
  if (!found.ok) return found;
  if (found.data === null) return fail("not_found");
  return succeed(found.data);
}

export async function saveRegisteredContact(
  session: Result<GeneralSession>,
  input: RegisteredContactInput,
  store: RegisteredContactStore,
): Promise<Result<null>> {
  if (!session.ok) return session;
  return store.save(session.data.userId, input);
}

export async function getOwnRegisteredContact(): Promise<Result<RegisteredContact>> {
  return loadRegisteredContact(await requireGeneralUser(), adminRegisteredContactStore());
}

export async function saveOwnRegisteredContact(
  input: RegisteredContactInput,
): Promise<Result<null>> {
  return saveRegisteredContact(await requireGeneralUser(), input, adminRegisteredContactStore());
}
