import { Webhook } from "standardwebhooks";
import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyAuthEmail } from "./auth-email";

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
  it("正しい署名とスキーマの通知だけを受け付ける", () => {
    vi.stubEnv("AUTH_EMAIL_HOOK_SECRET", `v1,whsec_${secret}`);
    const body = JSON.stringify(payload);
    expect(verifyAuthEmail(body, signedHeaders(body))).toEqual(payload);
  });

  it("署名の欠落・本文の改変・古い署名を拒否する", () => {
    vi.stubEnv("AUTH_EMAIL_HOOK_SECRET", `v1,whsec_${secret}`);
    const body = JSON.stringify(payload);
    expect(() => verifyAuthEmail(body, new Headers())).toThrow();
    expect(() => verifyAuthEmail(body + " ", signedHeaders(body))).toThrow();
    expect(() => verifyAuthEmail(body, signedHeaders(body, new Date(0)))).toThrow();
  });

  it("署名が正しくても不正な入力を拒否する", () => {
    vi.stubEnv("AUTH_EMAIL_HOOK_SECRET", `v1,whsec_${secret}`);
    const body = JSON.stringify({ ...payload, user: { id: "invalid", email: "invalid" } });
    expect(() => verifyAuthEmail(body, signedHeaders(body))).toThrow();
  });
});
