import type { ApplicationReceipt } from "@/server/company-applications";
import { applicationReceiptLines } from "./company-application-receipt";
import { applicationKindSchema } from "./company-application";
import * as v from "valibot";

export const companyApplicationSender = "Farmille <contact@farmille.com>";
const applicationNames = {
  registration: "資材掲載・資材オーナー権限申請",
  transfer_out: "資材オーナー権限の移行申請（現資材オーナー企業）",
  transfer_in: "資材オーナー権限の移行申請（引き継ぎ先企業）",
  removal: "資材ページに関する申請（終売・廃盤／非表示）",
} as const;
const signature =
  "ご不明な点がございましたら、本メールへのご返信、または下記までお問い合わせください。\n\nファーミル株式会社 代表取締役社長 奥田朗盛\ncontact@farmille.com";
const greeting = (company: string, contact: string) =>
  `${company}\n${contact} 様\n\nお世話になっております。Farmille運営でございます。`;

export function receiptAccessEmail(company: string, contact: string, url: string) {
  return {
    subject: "【Farmille】受付票の確認用リンクのご案内",
    text: `${greeting(company, contact)}\n受付票の確認をご希望いただき、ありがとうございます。下記のリンクよりお進みください。\n\n${url}\n\nリンクの有効期限は30分です。リンク先の「メールアドレスを確認する」を押してお進みください。\n\n本メールにお心当たりがない場合は、お手数ですが破棄していただきますようお願いいたします。\n\n${signature}`,
  };
}

export function companyReceiptEmail(receipt: ApplicationReceipt, url: string) {
  const a = receipt.application;
  const kind = v.parse(applicationKindSchema, a.kind);
  const date = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Tokyo",
  }).format(new Date(a.submitted_at));
  return {
    subject: `【Farmille】ご申請を受け付けました（受付番号 ${a.receipt_number}）`,
    text: `${greeting(a.company_name, a.contact_name)}\nこのたびは下記のご申請をいただき、ありがとうございます。内容を受け付けましたのでご連絡いたします。\n\n受付番号：${a.receipt_number}\n申請種別：${applicationNames[kind]}\n受付日時：${date}（日本時間）\n対象資材：${receipt.items.map((item) => item.material_name).join("、")}\n\n運営にて内容を確認のうえ、結果をこちらのメールアドレス宛にご連絡いたします。\nご提出いただいた資料に不足がある場合や、確認させていただきたい事項がある場合も、こちらのメールアドレス宛にご連絡いたします。\n\n受付票の確認・印刷：${url}\n\n${applicationReceiptLines(receipt).join("\n")}\n\n${signature}`,
  };
}
