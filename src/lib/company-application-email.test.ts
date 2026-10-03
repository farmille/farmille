import { describe, expect, it } from "vitest";
import {
  companyApplicationSender,
  companyReceiptEmail,
  removalInvitationEmail,
} from "./company-application-email";

describe("企業申請の案内メール", () => {
  it("宛名・正式署名・期限を付け、受付票の再確認を新規申請と区別する", () => {
    const url = "https://www.farmille.com/company-requests/removal/confirm#one-time-token";
    const invitation = removalInvitationEmail("農業資材株式会社", "山田太郎", url, false);
    expect(companyApplicationSender).toBe("Farmille <contact@farmille.com>");
    expect(invitation.subject).toBe("【Farmille】資材ページに関する申請フォームのご案内");
    expect(invitation.text).toContain("農業資材株式会社\n山田太郎 様");
    expect(invitation.text).toContain(url);
    expect(invitation.text).toContain("30分");
    expect(invitation.text).toContain(
      "ファーミル株式会社 代表取締役社長 奥田朗盛\ncontact@farmille.com",
    );
    const receipt = removalInvitationEmail("農業資材株式会社", "山田太郎", url, true);
    expect(receipt.subject).toContain("受付票");
    expect(receipt.text).not.toContain("申請フォームよりお手続き");
  });
});

it("受付メールは指定の申請種別・受付番号を示し、署名で結ぶ", () => {
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
  expect(
    receipt.text.endsWith("ファーミル株式会社 代表取締役社長 奥田朗盛\ncontact@farmille.com"),
  ).toBe(true);
});
