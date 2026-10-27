import { describe, expect, it } from "vitest";

import { contactSummary } from "./contact-summary";

const contact = {
  family_name: "山田",
  given_name: "太郎",
  phone: null,
  postal_code: "3100011",
  city_street: "水戸市三の丸1-1",
  building_name: null,
};

describe("contactSummary", () => {
  it("本名と都道府県だけを出し、住所の番地は出さない", () => {
    expect(contactSummary({ prefectureCode: 8, contact })).toBe("山田 太郎・茨城県");
  });

  it("都道府県が無ければ本名だけを出す", () => {
    expect(contactSummary({ prefectureCode: null, contact })).toBe("山田 太郎");
  });

  it("連絡先の行が無ければ未登録とする", () => {
    expect(contactSummary({ prefectureCode: 8, contact: null })).toBe("未登録");
  });
});
