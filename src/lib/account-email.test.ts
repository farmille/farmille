import { expect, it } from "vitest";
import {
  alreadyRegisteredEmail,
  passwordResetEmail,
  registrationCompleteEmail,
  registrationVerificationEmail,
  sellerWelcomeEmail,
  withdrawalCompleteEmail,
} from "./account-email";

it("案内メールに確認リンク・再手続きの入口・企業会員IDを差し込む", () => {
  const site = "https://www.farmille.com";
  const confirm = `${site}/auth/confirm?token_hash=abc&type=magiclink&registration=1`;
  const reset = `${site}/password-reset/update?token_hash=abc`;
  const cases = [
    { mail: registrationVerificationEmail(confirm, site), links: [confirm, `${site}/signup`] },
    {
      mail: alreadyRegisteredEmail(site),
      links: [`${site}/login`, `${site}/password-reset`],
    },
    { mail: registrationCompleteEmail(site), links: [`${site}/login`] },
    { mail: withdrawalCompleteEmail(site), links: [`${site}/signup`] },
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

it("登録済みのアドレスへの案内には、登録を進める認証リンクを載せない", () => {
  const mail = alreadyRegisteredEmail("https://www.farmille.com");
  expect(mail.subject).toBe("【Farmille】このメールアドレスは登録済みです");
  expect(mail.text).not.toContain("/auth/confirm");
});

it("退会完了メールは、投稿が退会済みユーザーとして残ることを伝える", () => {
  const mail = withdrawalCompleteEmail("https://www.farmille.com");
  expect(mail.subject).toBe("【Farmille】退会手続きが完了しました");
  expect(mail.text).toContain("投稿者名は「退会済みユーザー」と表示されます。");
  expect(mail.text).not.toContain("/login");
});
