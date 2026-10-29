import { Webhook } from "standardwebhooks";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accountEmailFor, confirmationUrl, verifyAuthEmail } from "./auth-email";

const secret = "bG9jYWwtZmFybWlsbGUtZW1haWwtaG9vay10ZXN0LWtleQ==";
const payload = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "user@example.test",
    app_metadata: { provider: "email", providers: ["email"] },
  },
  email_data: { email_action_type: "recovery", token_hash: "test-token-hash", token: "123456" },
};
const verifiedPayload = {
  ...payload,
  user: { ...payload.user, app_metadata: {} },
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
    expect(verifyAuthEmail(body, signedHeaders(body))).toEqual(verifiedPayload);
  });

  it("本文の改変を拒否する", () => {
    vi.stubEnv("AUTH_EMAIL_HOOK_SECRET", `v1,whsec_${secret}`);
    const body = JSON.stringify(payload);
    expect(() => verifyAuthEmail(body + " ", signedHeaders(body))).toThrow();
  });

  it("署名が正しくても不正な入力を拒否する", () => {
    vi.stubEnv("AUTH_EMAIL_HOOK_SECRET", `v1,whsec_${secret}`);
    for (const user of [
      { ...payload.user, id: "invalid", email: "invalid" },
      { id: payload.user.id, email: payload.user.email },
    ]) {
      const body = JSON.stringify({ ...payload, user });
      expect(() => verifyAuthEmail(body, signedHeaders(body))).toThrow();
    }
  });
});

describe("認証メールの文面の選び分け", () => {
  const registration = {
    user: { id: payload.user.id, email: payload.user.email, app_metadata: {} },
    email_data: {
      email_action_type: "magiclink" as const,
      token_hash: "test-token-hash",
      token: "123456",
      redirect_to: "https://www.farmille.com/auth/confirm?registration=1",
    },
  };

  it("会員種別のない本人には、登録情報の入力へ進む認証リンクを送る", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.farmille.com");
    for (const type of ["signup", "magiclink"] as const) {
      const mail = accountEmailFor({
        ...registration,
        email_data: { ...registration.email_data, email_action_type: type },
      });
      expect(mail.subject).toBe(
        "【Farmille】メールアドレスの確認（会員登録はまだ完了していません）",
      );
      expect(mail.text).toContain(
        `https://www.farmille.com/auth/confirm?token_hash=test-token-hash&type=${type}&registration=1`,
      );
    }
  });

  it("登録済みの本人が会員登録を始めたら、認証リンクの代わりに登録済みであることを送る", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.farmille.com");
    const mail = accountEmailFor({
      ...registration,
      user: { ...registration.user, app_metadata: { account_type: "general" } },
    });
    expect(mail.subject).toBe("【Farmille】このメールアドレスは登録済みです");
    expect(mail.text).toContain("https://www.farmille.com/login");
    expect(mail.text).toContain("https://www.farmille.com/password-reset");
    expect(mail.text).not.toContain("test-token-hash");
  });

  it("登録済みの本人のパスワード再設定には、再設定のリンクを送る", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.farmille.com");
    const mail = accountEmailFor({
      user: { ...registration.user, app_metadata: { account_type: "general" } },
      email_data: { email_action_type: "recovery", token_hash: "test-token-hash", token: "123456" },
    });
    expect(mail.subject).toBe("【Farmille】パスワード再設定のご案内");
    expect(mail.text).toContain(
      "https://www.farmille.com/password-reset/update?token_hash=test-token-hash",
    );
  });
});
