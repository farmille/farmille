import { readFile } from "node:fs/promises";
import path from "node:path";
import * as v from "valibot";

const AddressSchema = v.tuple([
  v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(47)),
  v.string(),
]);
const PostalMasterSchema = v.record(v.string(), v.array(AddressSchema));
let master: Promise<v.InferOutput<typeof PostalMasterSchema>> | undefined;

/** 日本郵便の公開データをサイト内で検索し、入力された郵便番号を外部へ送らない。 */
export async function lookupPostalAddress(postalCode: string) {
  const parsed = v.safeParse(v.pipe(v.string(), v.regex(/^\d{7}$/)), postalCode);
  if (!parsed.success) return { ok: false, message: "郵便番号を7桁で入力してください。" };
  master ??= readFile(
    path.join(process.cwd(), "src/server/data/postal-addresses.json"),
    "utf8",
  ).then((text) => v.parse(PostalMasterSchema, JSON.parse(text)));
  const matches = (await master)[parsed.output];
  if (!matches || matches.length === 0)
    return {
      ok: false,
      message: "住所が見つかりませんでした。都道府県と市区町村を入力してください。",
    };
  return {
    ok: true,
    addresses: matches.map(([prefectureCode, city]) => ({ prefectureCode, city })),
  };
}
