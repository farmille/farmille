/** seller_accounts.seller_type → UI ラベル。 */
export function sellerTypeLabel(sellerType: string): string {
  switch (sellerType) {
    case "maker":
      return "メーカー";
    case "ja":
      return "JA";
    case "farm_corp":
      return "農業法人";
    case "expert":
      return "専門家";
    case "other":
      return "その他";
    default:
      return "出品者";
  }
}
