import { describe, expect, it } from "vitest";
import { encodeRegistrationProof, decodeRegistrationProof } from "./registration-proof";
const proof = {
  userId: "00000000-0000-4000-8000-000000000701",
  email: "farmer@example.test",
  expires: 2000,
};
describe("登録用の本人証明", () => {
  it("署名された本人とメールアドレスを期限内だけ返す", () => {
    const stored = encodeRegistrationProof(proof, "test-secret");
    expect(decodeRegistrationProof(stored, "test-secret", 1999)).toEqual(proof);
    expect(decodeRegistrationProof(stored, "test-secret", 2000)).toBeNull();
  });
  it("本人の差し替え、異なる鍵、壊れた証明を拒否する", () => {
    const stored = encodeRegistrationProof(proof, "test-secret");
    const modifiedBody = Buffer.from(
      JSON.stringify({ ...proof, email: "other@example.test" }),
    ).toString("base64url");
    expect(
      decodeRegistrationProof(`${modifiedBody}.${stored.split(".")[1]}`, "test-secret", 1000),
    ).toBeNull();
    expect(decodeRegistrationProof(stored, "other-secret", 1000)).toBeNull();
    for (const value of ["", "a.b", `${stored}.extra`])
      expect(decodeRegistrationProof(value, "test-secret", 1000)).toBeNull();
  });
});
