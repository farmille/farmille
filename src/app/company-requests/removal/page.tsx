import { css } from "../../../../styled-system/css";
import { FormPageShell, TextLink } from "@/components";
import { VerificationForm } from "../_components/VerificationForm";
import { applicationStack } from "../_components/ContactFields";
export default function RemovalEntryPage() {
  return (
    <FormPageShell
      chrome="public"
      title="終売・廃盤／非表示の申請 受付フォーム"
      backHref="/sellers"
    >
      <div className={applicationStack}>
        <p>
          掲載されている資材ページについて、終売・廃盤の表示、または非表示をご希望の企業様向けの受付フォームです。ここで法人名・ご担当者名・メールアドレスを送信すると、申請フォームのURLをメールでお送りします。申請そのものは、メールで届く申請フォームから行います。
        </p>
        <ul
          className={css({
            listStyleType: "disc",
            pl: "5",
            display: "grid",
            gap: "2",
            lineHeight: "relaxed",
          })}
        >
          <li>
            受付対象は、当該資材の製造元・販売元・輸入元に該当する企業様です。特定地域の販売代理店、二次卸・三次卸、小売店の皆様からのご申請は受け付けておりません。
          </li>
          <li>
            企業会員でなくても申請できます。企業会員の方は、申請フォームにFarmilleアカウントIDを記入いただくと確認が早くなります。
          </li>
          <li>資材ページや感想口コミ・実証詳細レポートのデータは削除しません。</li>
        </ul>
        <h2 className={css({ fontSize: "lg", fontWeight: "700" })}>申請者情報</h2>
        <VerificationForm />
        <TextLink href="/company-requests/receipts">受付済みの申請を確認する</TextLink>
      </div>
    </FormPageShell>
  );
}
