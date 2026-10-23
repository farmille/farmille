import type { SubmittableKind } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";
import type { ApplicationReceipt } from "@/server/company-applications";

const id = (n: number) => `5a000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const materialUrl = (materialId: string) => `https://www.farmille.com/materials/${materialId}`;

/** saveCompanyApplication と同じく、最後の確認事項はプライバシーの案内を前に付けた文面で残る。 */
const consents = (
  kind: SubmittableKind,
  applicationId: string,
  acceptedAt: string,
): ApplicationReceipt["consents"] => {
  const { consents: texts, privacy } = applicationCopy[kind];
  return texts.map((text, index) => ({
    application_id: applicationId,
    position: index + 1,
    version: "2026-09-23",
    text_snapshot: index === texts.length - 1 ? `${privacy}\n${text}` : text,
    accepted_at: acceptedAt,
  }));
};

const registrationId = id(100);
const registrationSubmittedAt = "2026-10-15T01:23:45+00:00";
export const registrationReceipt: ApplicationReceipt = {
  application: {
    id: registrationId,
    kind: "registration",
    seller_id: id(101),
    access_id: null,
    company_name: "みどり農材株式会社",
    corporate_number: "6010001123456",
    account_id: "midori-nozai",
    contact_name: "佐藤美咲",
    department: "営業企画部",
    email: "sato@midori-nozai.example.com",
    phone: "03-1234-5678",
    signer_name: "佐藤美咲",
    application_date: "2026-10-15",
    receipt_number: 128,
    submitted_at: registrationSubmittedAt,
  },
  items: [
    {
      id: id(110),
      application_id: registrationId,
      material_id: null,
      material_name: "土壌改良微生物資材 みどりの土",
      material_url: "",
      position: 0,
      company_application_relations: [{ item_id: id(110), relation: "manufacturer" }],
      company_application_registration_items: {
        item_id: id(110),
        target: "new",
        official_url: "https://midori-nozai.example.com/products/midori-no-tsuchi",
      },
      company_application_transfer_in_items: null,
      company_application_removal_items: null,
      company_application_evidence_links: [],
    },
    {
      id: id(111),
      application_id: registrationId,
      material_id: id(120),
      material_name: "根張りサポート液肥 ルートアップ",
      material_url: materialUrl(id(120)),
      position: 1,
      company_application_relations: [
        { item_id: id(111), relation: "seller" },
        { item_id: id(111), relation: "importer" },
      ],
      company_application_registration_items: {
        item_id: id(111),
        target: "existing",
        official_url: "",
      },
      company_application_transfer_in_items: null,
      company_application_removal_items: null,
      company_application_evidence_links: [
        { item_id: id(111), url: "https://shop.example.com/products/root-up-1l" },
      ],
    },
  ],
  consents: consents("registration", registrationId, registrationSubmittedAt),
  evidence: [
    {
      id: id(130),
      item_key: id(110),
      purpose: "package",
      file_name: "みどりの土_パッケージ表面.pdf",
      byte_size: 2457600,
    },
  ],
  transferOut: null,
  transferIn: null,
  removal: null,
  delivery: {
    application_id: registrationId,
    recipient: "sato@midori-nozai.example.com",
    attempts: 1,
    claimed_at: null,
    sent_at: "2026-10-15T01:23:52+00:00",
    last_error_code: null,
  },
};

const transferOutId = id(200);
const transferOutSubmittedAt = "2026-10-08T05:12:30+00:00";
export const transferOutReceipt: ApplicationReceipt = {
  application: {
    id: transferOutId,
    kind: "transfer_out",
    seller_id: id(201),
    access_id: null,
    company_name: "北斗アグリ株式会社",
    corporate_number: "3430001234567",
    account_id: "hokuto-agri",
    contact_name: "高橋健一",
    department: "事業管理部",
    email: "takahashi@hokuto-agri.example.com",
    phone: "011-234-5678",
    signer_name: "高橋健一",
    application_date: "2026-10-08",
    receipt_number: 117,
    submitted_at: transferOutSubmittedAt,
  },
  items: [
    {
      id: id(210),
      application_id: transferOutId,
      material_id: id(220),
      material_name: "葉面散布用アミノ酸資材 アミノグロウ",
      material_url: materialUrl(id(220)),
      position: 0,
      company_application_relations: [],
      company_application_registration_items: null,
      company_application_transfer_in_items: null,
      company_application_removal_items: null,
      company_application_evidence_links: [],
    },
  ],
  consents: consents("transfer_out", transferOutId, transferOutSubmittedAt),
  evidence: [
    {
      id: id(230),
      item_key: id(210),
      purpose: "package",
      file_name: "アミノグロウ_新ラベル.jpg",
      byte_size: 1843200,
    },
    {
      id: id(231),
      item_key: id(210),
      purpose: "involvement",
      file_name: "販売権譲渡契約書_抜粋.pdf",
      byte_size: 512000,
    },
  ],
  transferOut: {
    application_id: transferOutId,
    kind: "transfer_out",
    destination_seller_id: id(202),
    company_name: "東和グリーンサイエンス株式会社",
    corporate_number: "8010001234567",
    account_id: "towa-green",
    contact_name: "中村由紀",
    department: "製品企画部",
    email: "nakamura@towa-green.example.com",
    phone: "03-5678-1234",
  },
  transferIn: null,
  removal: null,
  delivery: {
    application_id: transferOutId,
    recipient: "takahashi@hokuto-agri.example.com",
    attempts: 1,
    claimed_at: null,
    sent_at: "2026-10-08T05:12:36+00:00",
    last_error_code: null,
  },
};

const transferInId = id(300);
const transferInSubmittedAt = "2026-10-12T02:40:00+00:00";
export const transferInReceipt: ApplicationReceipt = {
  application: {
    id: transferInId,
    kind: "transfer_in",
    seller_id: id(301),
    access_id: null,
    company_name: "ひかり農産資材株式会社",
    corporate_number: "5120001234567",
    account_id: "hikari-nousan",
    contact_name: "伊藤翔太",
    department: "法務部",
    email: "ito@hikari-nousan.example.com",
    phone: "06-6123-4567",
    signer_name: "伊藤翔太",
    application_date: "2026-10-12",
    receipt_number: 123,
    submitted_at: transferInSubmittedAt,
  },
  items: [
    {
      id: id(310),
      application_id: transferInId,
      material_id: id(320),
      material_name: "有機酸系土壌活性剤 ソイルリバイブ",
      material_url: materialUrl(id(320)),
      position: 0,
      company_application_relations: [],
      company_application_registration_items: null,
      company_application_transfer_in_items: {
        item_id: id(310),
        owner_name: "関西バイオ資材株式会社",
        owner_information: "営業本部 資材企画課が窓口です。代表電話：06-6000-1234",
      },
      company_application_removal_items: null,
      company_application_evidence_links: [],
    },
  ],
  consents: consents("transfer_in", transferInId, transferInSubmittedAt),
  evidence: [
    {
      id: id(330),
      item_key: id(310),
      purpose: "package",
      file_name: "ソイルリバイブ_新パッケージ.png",
      byte_size: 3145728,
    },
    {
      id: id(331),
      item_key: null,
      purpose: "owner_agreement",
      file_name: "権限移行の同意メール.pdf",
      byte_size: 245760,
    },
    {
      id: id(332),
      item_key: null,
      purpose: "succession",
      file_name: "事業譲渡に関するお知らせ.pdf",
      byte_size: 389120,
    },
  ],
  transferOut: null,
  transferIn: {
    application_id: transferInId,
    kind: "transfer_in",
    background:
      "2026年4月1日付の事業譲渡契約により、関西バイオ資材株式会社から「ソイルリバイブ」の製造・販売事業を譲り受けました。\n同年7月の出荷分から、パッケージの販売元表記を当社名に切り替えています。\n関西バイオ資材株式会社には、本申請について事前に連絡しています。",
  },
  removal: null,
  delivery: {
    application_id: transferInId,
    recipient: "ito@hikari-nousan.example.com",
    attempts: 1,
    claimed_at: null,
    sent_at: "2026-10-12T02:40:07+00:00",
    last_error_code: null,
  },
};

const removalId = id(400);
export const removalReceipt: ApplicationReceipt = {
  application: {
    id: removalId,
    kind: "removal",
    seller_id: null,
    access_id: id(401),
    company_name: "やまびこ肥料株式会社",
    corporate_number: null,
    account_id: "yamabiko-hiryo",
    contact_name: "渡辺直樹",
    department: "品質保証部",
    email: "watanabe@yamabiko-hiryo.example.com",
    phone: "0263-12-3456",
    signer_name: "渡辺直樹",
    application_date: "2026-09-30",
    receipt_number: 96,
    submitted_at: "2026-09-30T06:05:00+00:00",
  },
  items: [
    {
      id: id(410),
      application_id: removalId,
      material_id: id(420),
      material_name: "粒状有機配合肥料 やまびこ1号",
      material_url: materialUrl(id(420)),
      position: 0,
      company_application_relations: [{ item_id: id(410), relation: "manufacturer" }],
      company_application_registration_items: null,
      company_application_transfer_in_items: null,
      company_application_removal_items: {
        item_id: id(410),
        request_type: "hidden",
        reason:
          "取引先限定の業務用製品で、一般の農家向けには販売していません。\n販売店への問い合わせが増えているため、資材ページを非公開にしてください。",
        disclose_reason: false,
      },
      company_application_evidence_links: [
        { item_id: id(410), url: "https://yamabiko-hiryo.example.com/products/yamabiko-1" },
      ],
    },
  ],
  consents: [],
  evidence: [],
  transferOut: null,
  transferIn: null,
  removal: {
    application_id: removalId,
    kind: "removal",
    company_url: "https://yamabiko-hiryo.example.com/company",
  },
  delivery: {
    application_id: removalId,
    recipient: "watanabe@yamabiko-hiryo.example.com",
    attempts: 3,
    claimed_at: null,
    sent_at: null,
    last_error_code: "smtp_failed",
  },
};
