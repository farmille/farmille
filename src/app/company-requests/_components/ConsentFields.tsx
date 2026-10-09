import { HintBox, NoteBox } from "@/components/auth/Fields";
import { Checkbox } from "@/components/Checkbox";
import { SurfaceCard } from "@/components/SurfaceCard";
import { TextLink } from "@/components/TextLink";
import type { SubmittableKind } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";

import { css } from "../../../../styled-system/css";

const consentRowStyle = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "2.5",
  mt: "3",
  fontSize: "md",
  lineHeight: "relaxed",
  cursor: "pointer",
  "& input": { mt: "1" },
});

function ConsentRow({ name, text }: { name: string; text: string }) {
  return (
    <label className={consentRowStyle}>
      <Checkbox name={name} required />
      <span>{text}</span>
    </label>
  );
}

function PrivacyText({ text }: { text: string }) {
  const [before, ...rest] = text.split("プライバシーポリシー");
  return (
    <HintBox>
      {before}
      {rest.length > 0 ? (
        <>
          <TextLink href="/legal/privacy">プライバシーポリシー</TextLink>
          {rest.join("プライバシーポリシー")}
        </>
      ) : null}
    </HintBox>
  );
}

export function ConsentFields({ kind }: { kind: SubmittableKind }) {
  const copy = applicationCopy[kind];
  const last = copy.consents.length - 1;
  const conditionCount = kind === "registration" ? 2 : 0;
  const conditions = copy.consents.slice(0, conditionCount);
  const confirmations = copy.consents.slice(conditionCount, last);
  const checkAll = <NoteBox>以下すべてをご確認のうえ、チェックしてください。</NoteBox>;
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
