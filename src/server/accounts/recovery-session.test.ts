import { describe, expect, it } from "vitest";
import { decodeRecoveryProof, encodeRecoveryProof } from "./recovery-session";

const secret = "test-recovery-cookie-signing-secret";
const now = 1_000_000;
const session = {
  access_token: "test-access",
  refresh_token: "test-refresh",
  link: "test-link-digest",
  expires: now + 600_000,
};

describe("再設定専用セッションの署名", () => {
  it("同じリンクの有効な署名を検証する", () => {
    const proof = encodeRecoveryProof(session, secret);
    expect(decodeRecoveryProof(proof, session.link, secret, now)).toEqual(session);
  });
  it("本文・署名の改ざんと不正形式を拒否する", () => {
    const proof = encodeRecoveryProof(session, secret);
    for (const changed of ["x" + proof, "invalid"]) {
      expect(decodeRecoveryProof(changed, session.link, secret, now)).toBeNull();
    }
  });
  it("別のメールリンクに流用できない", () => {
    const proof = encodeRecoveryProof(session, secret);
    expect(decodeRecoveryProof(proof, "other-link", secret, now)).toBeNull();
  });
  it("期限に達した証明を拒否する", () => {
    const proof = encodeRecoveryProof(session, secret);
    expect(decodeRecoveryProof(proof, session.link, secret, session.expires)).toBeNull();
  });
  it("異なる秘密鍵で作成した証明を拒否する", () => {
    const proof = encodeRecoveryProof(session, "other-secret");
    expect(decodeRecoveryProof(proof, session.link, secret, now)).toBeNull();
  });
});
