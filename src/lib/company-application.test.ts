import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { companyApplicationSchema, evidenceReservationSchema } from "./company-application";
import { applicationCopy } from "./company-application-copy";
const contact = {
  companyName: "試験株式会社",
  corporateNumber: "1234567890123",
  accountId: "test-maker",
  contactName: "試験担当",
  department: "管理部",
  email: "test@example.com",
  phone: "03-0000-0000",
  signerName: "試験担当",
  applicationDate: "2026-09-23",
};
const item = {
  id: "11111111-1111-4111-8111-111111111111",
  materialName: "資材",
  materialUrl: "https://farmille.com/materials/22222222-2222-4222-8222-222222222222",
  evidenceUrl: "https://example.com/package",
};
describe("企業申請の入力境界", () => {
  it("各原稿の同意数を維持し、未同意と不足を拒否する", () => {
    expect(Object.values(applicationCopy).map((copy) => copy.consents.length)).toEqual([
      12, 9, 11, 9,
    ]);
    const input = {
      ...contact,
      kind: "registration",
      items: [{ ...item, target: "existing", officialUrl: "", relations: ["manufacturer"] }],
      consents: Array(12).fill(true),
    };
    expect(v.safeParse(companyApplicationSchema, input).success).toBe(true);
    expect(
      v.safeParse(companyApplicationSchema, { ...input, consents: Array(11).fill(true) }).success,
    ).toBe(false);
    expect(
      v.safeParse(companyApplicationSchema, {
        ...input,
        consents: [false, ...Array(11).fill(true)],
      }).success,
    ).toBe(false);
  });
  it("Aは関係を必須にし、Cには同じ項目を要求しない", () => {
    const input = {
      ...contact,
      kind: "registration",
      items: [{ ...item, target: "existing", officialUrl: "", relations: [] }],
      consents: Array(12).fill(true),
    };
    expect(v.safeParse(companyApplicationSchema, input).success).toBe(false);
    expect(
      v.safeParse(companyApplicationSchema, {
        ...contact,
        kind: "transfer_in",
        items: [{ ...item, ownerName: "旧株式会社", ownerInformation: "" }],
        background: "事業譲渡により承継",
        consents: Array(11).fill(true),
      }).success,
    ).toBe(true);
  });
  it("資料URLのスクリプトと10MBを超える添付を拒否する", () => {
    const input = {
      ...contact,
      kind: "registration",
      items: [
        {
          ...item,
          target: "existing",
          officialUrl: "",
          relations: ["manufacturer"],
          evidenceUrl: "javascript:alert(1)",
        },
      ],
      consents: Array(12).fill(true),
    };
    expect(v.safeParse(companyApplicationSchema, input).success).toBe(false);
    const upload = {
      intentId: item.id,
      itemKey: item.id,
      purpose: "package",
      fileName: "資料.pdf",
      mime: "application/pdf",
      size: 10485760,
    };
    expect(v.safeParse(evidenceReservationSchema, upload).success).toBe(true);
    expect(v.safeParse(evidenceReservationSchema, { ...upload, size: 10485761 }).success).toBe(
      false,
    );
  });
});
