import * as v from "valibot";

const TotpQrCodeSourceSchema = v.pipe(
  v.string(),
  v.trimEnd(),
  v.check(
    (source) =>
      source.startsWith("data:image/svg+xml,") || source.startsWith("data:image/svg+xml;"),
    "TOTP登録用QRコードがSVGのdata URIではありません。",
  ),
);

/** Supabase Auth の外部レスポンスを Next Image が受け取れる SVG data URI に正規化する。 */
export function normalizeTotpQrCodeSource(source: string): string | null {
  const result = v.safeParse(TotpQrCodeSourceSchema, source);

  return result.success ? result.output : null;
}
