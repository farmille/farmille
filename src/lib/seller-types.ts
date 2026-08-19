/** seller_accounts.seller_type の許可値と申請フォーム用ラベル（モック sellerApply 準拠）。 */
export const SELLER_TYPES = [
  { value: "maker", label: "メーカー" },
  { value: "ja", label: "JA" },
  { value: "farm_corp", label: "農業法人・農家" },
  { value: "expert", label: "専門家・コンサル" },
  { value: "other", label: "その他" },
] as const;

export type SellerType = (typeof SELLER_TYPES)[number]["value"];

const SELLER_TYPE_SET = new Set<string>(SELLER_TYPES.map((entry) => entry.value));

export function isSellerType(value: string): value is SellerType {
  return SELLER_TYPE_SET.has(value);
}
