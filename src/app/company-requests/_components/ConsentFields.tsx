import Link from "next/link";
import type { ReactNode } from "react";

import type { ApplicationKind } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";

import { css } from "../../../../styled-system/css";
import { choiceInputStyle, formalGuideRecipe } from "./formal-styles";
import { FormSection } from "./FormSection";

const consentStyle = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "2.5",
  py: "1.5",
  fontSize: "md",
  lineHeight: "prose",
  color: "text.muted",
  cursor: "pointer",
  "& + &": { mt: "0.5" },
});

function ConsentRow({ name, text }: { name: string; text: string }) {
  return (
    <label className={consentStyle}>
      <input className={choiceInputStyle} name={name} required type="checkbox" />
      <span>{text}</span>
    </label>
  );
}

function PrivacyText({ text }: { text: string }) {
  const [before, ...rest] = text.split("プライバシーポリシー");
  return (
    <p className={css({ color: "text.subtle", fontSize: "sm", lineHeight: "prose" })}>
      {before}
      {rest.length > 0 ? (
        <>
          <Link
            className={css({ color: "primary.700", textDecoration: "underline" })}
            href="/legal/privacy"
          >
            プライバシーポリシー
          </Link>
          {rest.join("プライバシーポリシー")}
        </>
      ) : null}
    </p>
  );
}

function ConsentList({ children }: { children: ReactNode }) {
  return <div className={css({ mt: "3" })}>{children}</div>;
}

/** name は consent.0〜consent.n（最後が「上記に同意します」）。 */
export function ConsentFields({ kind }: { kind: ApplicationKind }) {
  const copy = applicationCopy[kind];
  const last = copy.consents.length - 1;
  const conditionCount = kind === "registration" || kind === "removal" ? 2 : 0;
  const conditions = copy.consents.slice(0, conditionCount);
  const confirmations = copy.consents.slice(conditionCount, last);
  const checkAll = (
    <div className={formalGuideRecipe()}>以下すべてをご確認のうえ、チェックしてください。</div>
  );
  return (
    <>
      {conditionCount > 0 ? (
        <FormSection title="該当条件のご確認">
          {checkAll}
          <ConsentList>
            {conditions.map((text, index) => (
              <ConsentRow key={text} name={`consent.${index}`} text={text} />
            ))}
          </ConsentList>
        </FormSection>
      ) : null}
      <FormSection title="ご申請にあたっての確認事項">
        {checkAll}
        <ConsentList>
          {confirmations.map((text, index) => (
            <ConsentRow key={text} name={`consent.${conditionCount + index}`} text={text} />
          ))}
        </ConsentList>
      </FormSection>
      <FormSection title="ご入力いただいた情報の取扱いについて">
        <PrivacyText text={copy.privacy} />
        <ConsentList>
          <ConsentRow name={`consent.${last}`} text={copy.consents[last]} />
        </ConsentList>
      </FormSection>
    </>
  );
}
