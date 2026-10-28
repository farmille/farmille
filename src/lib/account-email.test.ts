import { expect, it } from "vitest";
import {
  passwordResetEmail,
  registrationCompleteEmail,
  registrationVerificationEmail,
  sellerWelcomeEmail,
} from "./account-email";

it("案内メールに確認リンク・再手続きの入口・企業会員IDを差し込む", () => {
  const site = "https://www.farmille.com";
  const confirm = `${site}/auth/confirm?token_hash=abc&type=magiclink&registration=1`;
  const reset = `${site}/password-reset/update?token_hash=abc`;
  const cases = [
    { mail: registrationVerificationEmail(confirm, site), links: [confirm, `${site}/signup`] },
    { mail: registrationCompleteEmail(site), links: [`${site}/login`] },
    { mail: passwordResetEmail(reset, site), links: [reset] },
    {
      mail: sellerWelcomeEmail("example-agri", reset, site),
      links: [
        reset,
        `${site}/sellers/password-reset`,
        `${site}/sellers/login`,
        "Farmille企業会員ID：example-agri",
      ],
    },
  ];
  for (const { mail, links } of cases) {
    for (const link of links) expect(mail.text).toContain(link);
    expect(mail.text).toContain("contact@farmille.com");
    expect(mail.text).toContain(site);
  }
});
