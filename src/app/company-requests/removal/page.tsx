import Link from "next/link";

import { SitePageShell } from "@/app/_site/SitePageShell";

import { FormSection } from "../_components/FormSection";
import {
  formalPageRecipe,
  formalTitleStyle,
  formNoteStyle,
  introStyle,
} from "../_components/formal-styles";
import { VerificationForm } from "../_components/VerificationForm";

import { css, cx } from "../../../../styled-system/css";

/** 終売・廃盤／非表示の申請の受付。申請フォームのURLをメールで送る。 */
export default function RemovalEntryPage() {
  return (
    <SitePageShell title="終売・廃盤／非表示の申請 受付" backHref="/sellers">
      <div className={formalPageRecipe({ width: "narrow" })}>
        <h1 className={formalTitleStyle}>終売・廃盤／非表示の申請 受付フォーム</h1>
        <div className={introStyle}>
          <p>
            掲載されている資材ページについて、終売・廃盤の表示、または非表示をご希望の企業様向けの受付フォームです。ここで法人名・ご担当者名・メールアドレスを送信すると、申請フォームのURLをメールでお送りします。申請そのものは、メールで届く申請フォームから行います。
          </p>
          <ul>
            <li>
              受付対象は、当該資材の製造元・販売元・輸入元に該当する企業様です。特定地域の販売代理店、二次卸・三次卸、小売店の皆様からのご申請は受け付けておりません。
            </li>
            <li>
              企業会員でなくても申請できます。企業会員の方は、申請フォームにFarmilleアカウントIDを記入いただくと確認が早くなります。
            </li>
            <li>資材ページや感想口コミ・実証詳細レポートのデータは削除しません。</li>
          </ul>
        </div>
        <FormSection title="申請者情報">
          <VerificationForm />
        </FormSection>
        <p className={cx(formNoteStyle, css({ textAlign: "center" }))}>
          <Link href="/company-requests/receipts">受付済みの申請を確認する</Link>
        </p>
      </div>
    </SitePageShell>
  );
}
