import { Webhook } from "standardwebhooks";
import { afterEach, describe, expect, it, vi } from "vitest";

import { confirmationUrl, verifyAuthEmail } from "./auth-email";

const secret = "bG9jYWwtZmFybWlsbGUtZW1haWwtaG9vay10ZXN0LWtleQ==";
const payload = {
  user: { id: "11111111-1111-4111-8111-111111111111", email: "user@example.test" },
  email_data: { email_action_type: "recovery", token_hash: "test-token-hash", token: "123456" },
};

function signedHeaders(body: string, timestamp = new Date()): Headers {
  return new Headers({
    "webhook-id": "test-event",
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": new Webhook(secret).sign("test-event", timestamp, body),
  });
}

afterEach(() => vi.unstubAllEnvs());

describe("認証メールの署名検証", () => {
  it("登録確認と再送メールは登録情報の入力へ戻る", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.farmille.com");
    for (const type of ["signup", "magiclink"]) {
      const url = new URL(
        confirmationUrl(
          "test-hash",
          type,
          "https://www.farmille.com/auth/confirm?registration=1&next=%2Freports%2Fsample",
        ),
      );
      expect(url.origin).toBe("https://www.farmille.com");
      expect(url.searchParams.get("registration")).toBe("1");
      expect(url.searchParams.get("next")).toBe("/reports/sample");
    }
  });

  it("外部サイトと認証画面への戻り先を確認メールへ持ち込まない", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.farmille.com");
    for (const destination of [
      "https://example.com/auth/confirm?next=/reports/sample",
      "https://www.farmille.com/auth/confirm?next=//example.com",
    ]) {
      expect(
        new URL(confirmationUrl("test-hash", "signup", destination)).searchParams.has("next"),
      ).toBe(false);
    }
  });

  it("正しい署名とスキーマの通知だけを受け付ける", () => {
    vi.stubEnv("AUTH_EMAIL_HOOK_SECRET", `v1,whsec_${secret}`);
    const body = JSON.stringify(payload);
    expect(verifyAuthEmail(body, signedHeaders(body))).toEqual(payload);
  });

  it("本文の改変を拒否する", () => {
    vi.stubEnv("AUTH_EMAIL_HOOK_SECRET", `v1,whsec_${secret}`);
    const body = JSON.stringify(payload);
    expect(() => verifyAuthEmail(body + " ", signedHeaders(body))).toThrow();
  });

  it("署名が正しくても不正な入力を拒否する", () => {
    vi.stubEnv("AUTH_EMAIL_HOOK_SECRET", `v1,whsec_${secret}`);
    const body = JSON.stringify({ ...payload, user: { id: "invalid", email: "invalid" } });
    expect(() => verifyAuthEmail(body, signedHeaders(body))).toThrow();
  });
});
