import { describe, expect, it } from "vitest";
import {
  passwordResetEmail,
  registrationCompleteEmail,
  registrationVerificationEmail,
  sellerWelcomeEmail,
} from "./account-email";

const siteUrl = "https://www.farmille.com";
const footer =
  "※本メールは送信専用のアドレスからお送りしています。\nご質問・お問い合わせは下記までお願いいたします。\ncontact@farmille.com\n\n――――――――\nFarmille（ファーミル）\n運営：ファーミル株式会社\nhttps://www.farmille.com\n";

describe("一般会員の登録とパスワード再設定のメール", () => {
  it("認証メールは未完了と期限を伝え、確認リンクと再手続きの入口を載せる", () => {
    const link = `${siteUrl}/auth/confirm?token_hash=abc&type=magiclink&registration=1`;
    const mail = registrationVerificationEmail(link, siteUrl);
    expect(mail.subject).toBe("【Farmille】メールアドレスの確認（会員登録はまだ完了していません）");
    expect(mail.text).toContain("※まだ会員登録は完了していません。");
    expect(mail.text).toContain(`▼登録情報の入力へ進む\n${link}\n※リンクの有効期限は1時間です。`);
    expect(mail.text).toContain(
      "有効期限が切れた場合は、お手数ですが下記から再度お手続きください。\nhttps://www.farmille.com/signup",
    );
    expect(mail.text).toContain("このメールを破棄していただくか、下記までご連絡ください。");
    expect(mail.text.endsWith(footer)).toBe(true);
  });

  it("登録完了メールはログインの入口と投稿の案内を載せる", () => {
    const mail = registrationCompleteEmail(siteUrl);
    expect(mail.subject).toBe("【Farmille】会員登録が完了しました");
    expect(mail.text).toContain("▼ログインはこちら\nhttps://www.farmille.com/login");
    expect(mail.text).toContain("ぜひ、ご自身の体験を共有してください。");
    expect(mail.text.endsWith(footer)).toBe(true);
  });

  it("再設定メールは期限と、申し込んでいない場合の扱いを伝える", () => {
    const link = `${siteUrl}/password-reset/update?token_hash=abc`;
    const mail = passwordResetEmail(link, siteUrl);
    expect(mail.subject).toBe("【Farmille】パスワード再設定のご案内");
    expect(mail.text).toContain(
      `▼新しいパスワードを設定する\n${link}\n※リンクの有効期限は1時間です。`,
    );
    expect(mail.text).toContain("「パスワードをお忘れの方」から再度お手続きください。");
    expect(mail.text).toContain("リンクを開かない限り、パスワードは変更されません。");
    expect(mail.text.endsWith(footer)).toBe(true);
  });

  it("企業会員の案内はログインIDと設定リンク、期限、再発行とログインの入口を載せる", () => {
    const setup = `${siteUrl}/password-reset/update?token_hash=abc`;
    const mail = sellerWelcomeEmail("example-agri", setup, siteUrl);
    expect(mail.subject).toBe("【Farmille】企業会員登録のご案内（ログイン情報）");
    expect(mail.text).toContain("■ログイン情報\nログインID：example-agri");
    expect(mail.text).toContain(`▼パスワードを設定する\n${setup}\n※リンクの有効期限は1時間です。`);
    expect(mail.text).toContain(
      "有効期限が切れた場合は、お手数ですが下記から再発行してください。\nhttps://www.farmille.com/sellers/password-reset",
    );
    expect(mail.text).toContain("▼メーカーログイン画面\nhttps://www.farmille.com/sellers/login");
    expect(mail.text.endsWith(footer)).toBe(true);
  });
});
