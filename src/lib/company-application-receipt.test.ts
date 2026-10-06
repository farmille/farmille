import { expect, it } from "vitest";

import type { ApplicationReceipt } from "@/server/company-applications";

import { applicationReceiptLines } from "./company-application-receipt";

const id = "11111111-1111-4111-8111-111111111111";
const removalReceipt: ApplicationReceipt = {
  application: {
    id,
    kind: "removal",
    seller_id: null,
    access_id: null,
    company_name: "農業資材株式会社",
    corporate_number: null,
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
    application_id: id,
    recipient: "contact@example.test",
    attempts: 0,
    claimed_at: null,
    sent_at: null,
    last_error_code: null,
  },
};

it("法人番号の無い申請（フォームD）は、申請者向けの受付票だけ「法人番号：該当なし」を出さない", () => {
  expect(applicationReceiptLines(removalReceipt)).toContain("法人番号：該当なし");
  expect(
    applicationReceiptLines(removalReceipt, { omitMissingCorporateNumber: true }).some((line) =>
      line.startsWith("法人番号："),
    ),
  ).toBe(false);
  const withNumber = {
    ...removalReceipt,
    application: { ...removalReceipt.application, corporate_number: "1234567890123" },
  };
  expect(applicationReceiptLines(withNumber, { omitMissingCorporateNumber: true })).toContain(
    "法人番号：1234567890123",
  );
});
