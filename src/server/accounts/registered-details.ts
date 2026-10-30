import * as v from "valibot";

import { generalRegistrationSchema } from "@/lib/auth/registration-schema";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";

import type { MemberAccount } from "./member-account";

/** 登録時と同じ規則で検証する、本名・連絡先・住所の欄。 */
export const RegisteredDetailsSchema = v.pick(generalRegistrationSchema, [
  "familyName",
  "givenName",
  "phone",
  "postalCode",
  "prefectureCode",
  "cityStreet",
  "buildingName",
]);

export type RegisteredDetailsInput = v.InferOutput<typeof RegisteredDetailsSchema>;

type RegisteredDetailsField = keyof RegisteredDetailsInput;

export type RegisteredDetailsFieldErrors = Partial<Record<RegisteredDetailsField, string>>;

type RegisteredDetailsFormValues = { [Key in RegisteredDetailsField]: FormDataEntryValue | null };

export function validateRegisteredDetails(
  raw: RegisteredDetailsFormValues,
):
  | { ok: true; input: RegisteredDetailsInput }
  | { ok: false; fieldErrors: RegisteredDetailsFieldErrors } {
  const result = v.safeParse(RegisteredDetailsSchema, raw);

  if (result.success) return { ok: true, input: result.output };
  const fieldErrors: RegisteredDetailsFieldErrors = {};
  const nested = v.flatten(result.issues).nested;

  for (const key of Object.keys(RegisteredDetailsSchema.entries)) {
    const field = v.parse(v.keyof(RegisteredDetailsSchema), key);
    const message = nested?.[field]?.[0];

    if (message !== undefined) fieldErrors[field] = message;
  }

  return { ok: false, fieldErrors };
}

/** 画面に出す登録情報。連絡先を保存する前に登録した会員は、本名・連絡先が空になる。 */
export type RegisteredDetails = {
  email: string;
  familyName: string;
  givenName: string;
  phone: string;
  /** 7桁の数字。未登録は空。 */
  postalCode: string;
  prefectureCode: number | null;
  cityStreet: string;
  buildingName: string;
};

type StoredDetails = Omit<RegisteredDetails, "email">;

export type RegisteredDetailsStore = {
  /** 退会済み・プロフィールの無い会員は null。 */
  find(userId: string): Promise<Result<StoredDetails | null>>;
  save(userId: string, input: RegisteredDetailsInput): Promise<Result<null>>;
};

export function adminRegisteredDetailsStore(): RegisteredDetailsStore {
  return {
    async find(userId) {
      const db = createAdminSupabase();

      const [profile, contact] = await Promise.all([
        db
          .from("profiles")
          .select("prefecture_code")
          .eq("user_id", userId)
          .is("withdrawn_at", null)
          .maybeSingle(),
        db
          .from("profile_contact_details")
          .select("family_name, given_name, phone, postal_code, city_street, building_name")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (profile.error !== null || contact.error !== null) {
        console.error("[accounts] 登録情報の取得に失敗", profile.error?.code, contact.error?.code);

        return fail("internal");
      }

      if (profile.data === null) return succeed(null);

      return succeed({
        familyName: contact.data?.family_name ?? "",
        givenName: contact.data?.given_name ?? "",
        phone: contact.data?.phone ?? "",
        postalCode: contact.data?.postal_code ?? "",
        prefectureCode: profile.data.prefecture_code,
        cityStreet: contact.data?.city_street ?? "",
        buildingName: contact.data?.building_name ?? "",
      });
    },
    async save(userId, input) {
      const { error } = await createAdminSupabase().rpc("save_registered_details", {
        p_user_id: userId,
        p_family_name: input.familyName,
        p_given_name: input.givenName,
        p_phone: input.phone,
        p_postal_code: input.postalCode,
        p_prefecture_code: input.prefectureCode,
        p_city_street: input.cityStreet,
        p_building_name: input.buildingName,
      });

      if (error === null) return succeed(null);

      if (error.code === "P0002") return fail("not_found");
      console.error("[accounts] 登録情報の保存に失敗", error.code);

      return fail("internal");
    },
  };
}

export async function loadRegisteredDetails(
  account: MemberAccount,
  store: RegisteredDetailsStore,
): Promise<Result<RegisteredDetails>> {
  const found = await store.find(account.userId);

  if (!found.ok) return found;

  if (found.data === null) return fail("not_found");

  return succeed({ email: account.email, ...found.data });
}
