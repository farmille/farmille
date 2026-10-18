import { expect, it } from "vitest";

import {
  registrationReceipt,
  removalReceipt,
  transferInReceipt,
  transferOutReceipt,
} from "@/app/company-requests/_components/story-fixtures";

import { applicationReceiptDocument, applicationReceiptLines } from "./company-application-receipt";

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

it("新規掲載の資材には FarmilleページURL を出さず、空の製品公式ページURLは項目にしない", () => {
  expect(
    applicationReceiptDocument(registrationReceipt).items.map((item) =>
      item.fields.map((field) => field.label),
    ),
  ).toEqual([
    ["製品公式ページURL", "関係"],
    ["FarmilleページURL", "関係", "パッケージ資料URL"],
  ]);
});

it("申請内容は掲載・権限申請の資材だけが持ち、ほかの項目と分けて持つ", () => {
  expect(applicationReceiptDocument(registrationReceipt).items.map((item) => item.request)).toEqual(
    ["資材情報の新規掲載", "掲載済み資材の資材オーナー権限"],
  );
  for (const receipt of [transferOutReceipt, transferInReceipt, removalReceipt]) {
    expect(applicationReceiptDocument(receipt).items.map((item) => item.request)).toEqual([null]);
  }
});

it("控えメールでは、申請内容を資材名のすぐ下に書く", () => {
  const lines = applicationReceiptLines(registrationReceipt);
  const first = lines.indexOf("対象資材 1：土壌改良微生物資材 みどりの土");
  expect(lines.slice(first, first + 4)).toEqual([
    "対象資材 1：土壌改良微生物資材 みどりの土",
    "申請内容：資材情報の新規掲載",
    "製品公式ページURL：https://midori-nozai.example.com/products/midori-no-tsuchi",
    "関係：製造元",
  ]);
});

it("資材との関係は「・」でつないで1項目にする", () => {
  expect(applicationReceiptDocument(registrationReceipt).items[1]?.fields).toContainEqual({
    label: "関係",
    value: "販売元・輸入元",
  });
});

it("添付資料は対象資材の名前を添え、資材に紐づかない資料は「申請全体」とする", () => {
  expect(
    applicationReceiptDocument(transferInReceipt).attachments.map((file) => [
      file.owner,
      file.purpose,
    ]),
  ).toEqual([
    ["有機酸系土壌活性剤 ソイルリバイブ", "パッケージ資料"],
    ["申請全体", "現オーナー同意資料"],
    ["申請全体", "移行の事実資料"],
  ]);
});

it("申請に無い資材を指す添付資料は、壊れたデータとして例外にする", () => {
  const receipt = {
    ...transferInReceipt,
    evidence: [
      {
        id: "5a000000-0000-4000-8000-000000000999",
        item_key: "5a000000-0000-4000-8000-000000000998",
        purpose: "package",
        file_name: "パッケージ.pdf",
        byte_size: 1024,
      },
    ],
  };
  expect(() => applicationReceiptDocument(receipt)).toThrow("添付資料の対象資材が見つかりません");
});

it("添付資料が無ければ「なし」と書く", () => {
  const lines = applicationReceiptLines(removalReceipt);
  expect(lines.slice(lines.indexOf("添付資料"), lines.indexOf("確認事項"))).toEqual([
    "添付資料",
    "なし",
    "",
  ]);
});

it("同じ版・同じ日時の確認事項は、同意の順のまま1つにまとめる", () => {
  expect(applicationReceiptDocument(registrationReceipt).consents).toEqual([
    {
      version: "2026-09-23",
      acceptedAt: "2026/10/15 10:23:45（日本時間）",
      texts: registrationReceipt.consents.map((consent) => consent.text_snapshot),
    },
  ]);
});

it("同意日時が変わるたびにまとまりを分け、前のまとまりと同じ日時に戻っても順を入れ替えない", () => {
  const consents = registrationReceipt.consents
    .slice(0, 4)
    .map((consent, index) =>
      index === 2 ? { ...consent, accepted_at: "2026-10-15T01:30:00+00:00" } : consent,
    );
  const texts = consents.map((consent) => consent.text_snapshot);
  expect(applicationReceiptDocument({ ...registrationReceipt, consents }).consents).toEqual([
    {
      version: "2026-09-23",
      acceptedAt: "2026/10/15 10:23:45（日本時間）",
      texts: [texts[0], texts[1]],
    },
    { version: "2026-09-23", acceptedAt: "2026/10/15 10:30:00（日本時間）", texts: [texts[2]] },
    { version: "2026-09-23", acceptedAt: "2026/10/15 10:23:45（日本時間）", texts: [texts[3]] },
  ]);
});

it("控えメールの受付票は、申請者・資材・移行先・添付資料・確認事項・署名の順に並べる", () => {
  const receipt = {
    ...transferOutReceipt,
    evidence: transferOutReceipt.evidence.slice(0, 1),
    consents: transferOutReceipt.consents.slice(0, 1),
  };
  expect(applicationReceiptLines(receipt)).toEqual([
    "資材オーナー権限の移行申請フォーム（現資材オーナー企業様用）",
    "受付番号：117",
    "受付日時：2026/10/08 14:12:30（日本時間）",
    "法人名：北斗アグリ株式会社",
    "部署名：事業管理部",
    "担当者名：高橋健一",
    "法人番号：3430001234567",
    "FarmilleアカウントID：hokuto-agri",
    "担当者メールアドレス：takahashi@hokuto-agri.example.com",
    "電話番号：011-234-5678",
    "",
    "対象資材 1：葉面散布用アミノ酸資材 アミノグロウ",
    "FarmilleページURL：https://www.farmille.com/materials/5a000000-0000-4000-8000-000000000220",
    "",
    "移行先企業",
    "法人名：東和グリーンサイエンス株式会社",
    "部署名：製品企画部",
    "担当者名：中村由紀",
    "法人番号：8010001234567",
    "FarmilleアカウントID：towa-green",
    "担当者メールアドレス：nakamura@towa-green.example.com",
    "電話番号：03-5678-1234",
    "",
    "添付資料",
    "葉面散布用アミノ酸資材 アミノグロウ／パッケージ資料：アミノグロウ_新ラベル.jpg（1843200バイト）",
    "",
    "確認事項",
    "☑ 上記の資材について、Farmille上の資材オーナー権限（編集権限を含む）を、上記の移行先企業に移行します。（版：2026-09-23、同意日時：2026/10/08 14:12:30（日本時間））",
    "",
    "申請日：2026-10-08",
    "署名：高橋健一",
    "控えメール送信先：takahashi@hokuto-agri.example.com",
  ]);
});
