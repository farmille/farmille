export function canUseGeneralFeatures(accountType: string | null | undefined): boolean {
  return accountType === "general" || accountType === "admin";
}
