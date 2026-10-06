import Link from "next/link";

import type { ApplicationKind } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";

import { FormSection } from "./FormSection";

/** 見本 consentRow()：`.consent.strong` の中に本物のチェックボックスを置く。 */
function ConsentRow({ name, text }: { name: string; text: string }) {
  return (
    <label className="consent strong">
      <input name={name} required type="checkbox" />
      <span className="cbox" aria-hidden="true"></span>
      <span>{text}</span>
    </label>
  );
}

/** 見本の PRIVACY()。「プライバシーポリシー」をリンクにする。 */
function PrivacyText({ text }: { text: string }) {
  const [before, ...rest] = text.split("プライバシーポリシー");
  return (
    <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
      {before}
      {rest.length > 0 ? (
        <>
          <Link
            href="/legal/privacy"
            style={{ color: "var(--green)", textDecoration: "underline" }}
          >
            プライバシーポリシー
          </Link>
          {rest.join("プライバシーポリシー")}
        </>
      ) : null}
    </p>
  );
}

/**
 * 見本 formScreen の確認事項（該当条件のご確認／ご申請にあたっての確認事項／情報の取扱い）。
 * name は本番どおり consent.0〜consent.n（最後が「上記に同意します」）。
 */
export function ConsentFields({
  kind,
  startNumber,
}: {
  kind: ApplicationKind;
  startNumber: number;
}) {
  const copy = applicationCopy[kind];
  const last = copy.consents.length - 1;
  // 見本は A と D だけ、最初の2項目を「該当条件のご確認」として分けている。
  const conditionCount = kind === "registration" || kind === "removal" ? 2 : 0;
  const conditions = copy.consents.slice(0, conditionCount);
  const confirmations = copy.consents.slice(conditionCount, last);
  let number = startNumber;
  return (
    <>
      {conditionCount > 0 ? (
        <FormSection number={number++} title="該当条件のご確認">
          <div className="fguide">以下すべてをご確認のうえ、チェックしてください。</div>
          <div style={{ marginTop: 12 }}>
            {conditions.map((text, index) => (
              <ConsentRow key={text} name={`consent.${index}`} text={text} />
            ))}
          </div>
        </FormSection>
      ) : null}
      <FormSection number={number++} title="ご申請にあたっての確認事項">
        <div className="fguide">以下すべてをご確認のうえ、チェックしてください。</div>
        <div style={{ marginTop: 12 }}>
          {confirmations.map((text, index) => (
            <ConsentRow key={text} name={`consent.${conditionCount + index}`} text={text} />
          ))}
        </div>
      </FormSection>
      <FormSection number={number} title="ご入力いただいた情報の取扱いについて">
        <PrivacyText text={copy.privacy} />
        <div style={{ marginTop: 12 }}>
          <ConsentRow name={`consent.${last}`} text={copy.consents[last]} />
        </div>
      </FormSection>
    </>
  );
}

/** ConsentFields が使う見出しの数（番号の続きを数えるため）。 */
export function consentSectionCount(kind: ApplicationKind): number {
  return kind === "registration" || kind === "removal" ? 3 : 2;
}
