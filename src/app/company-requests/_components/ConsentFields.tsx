import { Checkbox, Field, Notice } from "@/components/form";
import { SurfaceCard } from "@/components/SurfaceCard";
import { TextLink } from "@/components/TextLink";
import type { SubmittableKind } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";

import { css } from "../../../../styled-system/css";

const noteStyle = css({ mt: "2" });

function ConsentRow({ name, text }: { name: string; text: string }) {
  return (
    <Field name={name} requirement="required">
      <Checkbox>{text}</Checkbox>
    </Field>
  );
}

function PrivacyText({ text }: { text: string }) {
  const [before, ...rest] = text.split("プライバシーポリシー");
  return (
    <Notice className={noteStyle} tone="neutral">
      {before}
      {rest.length > 0 ? (
        <>
          <TextLink href="/legal/privacy">プライバシーポリシー</TextLink>
          {rest.join("プライバシーポリシー")}
        </>
      ) : null}
    </Notice>
  );
}

export function ConsentFields({ kind }: { kind: SubmittableKind }) {
  const copy = applicationCopy[kind];
  const last = copy.consents.length - 1;
  const conditionCount = kind === "registration" ? 2 : 0;
  const conditions = copy.consents.slice(0, conditionCount);
  const confirmations = copy.consents.slice(conditionCount, last);
  const checkAll = (
    <Notice className={noteStyle} tone="warn">
      以下すべてをご確認のうえ、チェックしてください。
    </Notice>
  );
  return (
    <>
      {conditionCount > 0 ? (
        <SurfaceCard title="該当条件のご確認">
          {checkAll}
          {conditions.map((text, index) => (
            <ConsentRow key={text} name={`consent.${index}`} text={text} />
          ))}
        </SurfaceCard>
      ) : null}
      <SurfaceCard title="ご申請にあたっての確認事項">
        {checkAll}
        {confirmations.map((text, index) => (
          <ConsentRow key={text} name={`consent.${conditionCount + index}`} text={text} />
        ))}
      </SurfaceCard>
      <SurfaceCard title="ご入力いただいた情報の取扱いについて">
        <PrivacyText text={copy.privacy} />
        <ConsentRow name={`consent.${last}`} text={copy.consents[last]} />
      </SurfaceCard>
    </>
  );
}
