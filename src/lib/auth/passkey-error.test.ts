import { describe, expect, it } from "vitest";
import { passkeyErrorMessage } from "./passkey-error";
import { errorMessageJa } from "@/server/errors";

describe("パスキーのエラー表示", () => {
  it("無効なAuth設定を案内する", () => {
    expect(passkeyErrorMessage({ code: "passkey_disabled" })).toBe(
      errorMessageJa.passkey_unavailable,
    );
  });
  it("認証失敗は再試行へ案内する", () => {
    expect(passkeyErrorMessage({ code: "webauthn_verification_failed" })).toBe(
      errorMessageJa.passkey_failed,
    );
  });
  it("コード未設定でも内部の情報を表示しない", () => {
    expect(passkeyErrorMessage({ code: undefined })).toBe(errorMessageJa.passkey_failed);
  });
});
