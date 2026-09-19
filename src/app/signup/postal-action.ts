"use server";
import { lookupPostalAddress } from "@/server/accounts/postal-address";

export async function findPostalAddress(postalCode: string) {
  try {
    return await lookupPostalAddress(postalCode);
  } catch (error) {
    console.error("[postal-address] 住所検索に失敗", error);
    return {
      ok: false,
      message:
        "住所を検索できませんでした。時間を置いて再度検索するか、都道府県と市区町村を入力してください。",
    };
  }
}
