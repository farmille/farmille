import { describe, expect, it } from "vitest";
import { companyReceiptEmail, receiptAccessEmail } from "./company-application-email";

describe("企業申請の案内メール", () => {
  it("宛名を付け、受付票の確認用リンクを案内する", () => {
    const url = "https://www.farmille.com/company-requests/receipts/confirm#one-time-token";
    const mail = receiptAccessEmail("農業資材株式会社", "山田太郎", url);
    expect(mail.text).toContain("農業資材株式会社\n山田太郎 様");
    expect(mail.text).toContain(url);
  });
});

it("受付メールは指定の申請種別・受付番号と宛名を示す", () => {
  const receipt = companyReceiptEmail(
    {
      application: {
        id: "11111111-1111-4111-8111-111111111111",
        kind: "registration",
        seller_id: null,
        access_id: null,
        company_name: "農業資材株式会社",
        corporate_number: "1234567890123",
        account_id: "agri",
        contact_name: "山田太郎",
        department: "営業部",
        email: "contact@example.test",
        phone: "03-0000-0000",
        signer_name: "山田太郎",
        application_date: "2026-09-30",
        receipt_number: 12,
        submitted_at: "2026-09-30T01:00:00Z",
      },
      items: [],
      consents: [],
      evidence: [],
      transferOut: null,
      transferIn: null,
      removal: null,
      delivery: {
        application_id: "11111111-1111-4111-8111-111111111111",
        recipient: "contact@example.test",
        attempts: 0,
        claimed_at: null,
        sent_at: null,
        last_error_code: null,
      },
    },
    "https://www.farmille.com/dashboard/applications/example",
  );

  expect(receipt.subject).toBe("【Farmille】ご申請を受け付けました（受付番号 12）");
  expect(receipt.text).toContain("申請種別：資材掲載・資材オーナー権限申請\n");
  expect(receipt.text).toContain("農業資材株式会社\n山田太郎 様");
});
