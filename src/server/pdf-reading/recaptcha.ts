import * as v from "valibot";

import { PDF_READING_RECAPTCHA_ACTION } from "@/lib/pdf-reading";

const MIN_SCORE = 0.5;
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

const SiteverifySchema = v.object({
  success: v.boolean(),
  score: v.optional(v.number()),
  action: v.optional(v.string()),
  "error-codes": v.optional(v.array(v.string())),
});

/** reCAPTCHA v3 のトークンを確かめる。成功・action の一致・スコア 0.5 以上のすべてで通す。 */
export async function verifyRecaptcha(
  token: string,
  secret: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  let body: unknown;

  try {
    const response = await fetcher(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
    });

    if (!response.ok) {
      console.error("[pdf-reading] reCAPTCHA の検証に失敗", response.status);

      return false;
    }

    body = await response.json();
  } catch (error) {
    console.error("[pdf-reading] reCAPTCHA の検証に失敗", error);

    return false;
  }

  const result = v.safeParse(SiteverifySchema, body);

  if (!result.success) {
    console.error("[pdf-reading] reCAPTCHA の応答の形式が不正", v.summarize(result.issues));

    return false;
  }

  const { success, score, action } = result.output;

  if (!success) console.error("[pdf-reading] reCAPTCHA が拒否", result.output["error-codes"]);

  return (
    success && action === PDF_READING_RECAPTCHA_ACTION && score !== undefined && score >= MIN_SCORE
  );
}
