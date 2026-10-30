import { getAddress } from "jposta";
import * as v from "valibot";

const PostalCodeSchema = v.pipe(v.string(), v.regex(/^\d{7}$/));

/** 既定の getAddress は同梱チャンクを読む。host を渡すと取得先が外部になる。 */
export async function lookupPostalAddress(postalCode: string) {
  const parsed = v.safeParse(PostalCodeSchema, postalCode);

  if (!parsed.success) return { ok: false, message: "郵便番号を7桁で入力してください。" };
  const address = await getAddress(parsed.output);

  if (address === null) {
    return {
      ok: false,
      message: "住所が見つかりませんでした。都道府県と市区町村を入力してください。",
    };
  }

  return {
    ok: true,
    addresses: [
      {
        prefectureCode: address.prefNum,
        city: address.city,
        town: fillableTown(address.area ?? ""),
      },
    ],
  };
}

/** 「以下に掲載がない場合」と「番地がくる場合」は番地の前に置く町名ではない。 */
function fillableTown(town: string): string {
  if (town === "以下に掲載がない場合" || town.includes("番地がくる場合")) return "";

  return town;
}
