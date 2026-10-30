import { Checkbox, Field, Fieldset, Notice } from "@/components/form";
import { SurfaceCard } from "@/components/SurfaceCard";
import { TextLink } from "@/components/TextLink";
import type { SubmittableKind } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";

import { css } from "../../../../styled-system/css";

const noteStyle = css({ mt: "2" });

function ConsentRow({
  name,
  text,
  checked,
  onChange,
}: {
  name: string;
  text: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field name={name}>
      <Checkbox checked={checked} onCheckedChange={onChange}>
        {text}
      </Checkbox>
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

export function ConsentFields({
  kind,
  values,
  onChange,
}: {
  kind: SubmittableKind;
  values: boolean[];
  onChange: (index: number, checked: boolean) => void;
}) {
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
          <Fieldset hideLegend legend="該当条件のご確認" requirement="required">
            {conditions.map((text, index) => (
              <ConsentRow
                key={text}
                name={`consent.${index}`}
                text={text}
                checked={values[index]}
                onChange={(checked) => onChange(index, checked)}
              />
            ))}
          </Fieldset>
        </SurfaceCard>
      ) : null}
      <SurfaceCard title="ご申請にあたっての確認事項">
        {checkAll}
        <Fieldset hideLegend legend="ご申請にあたっての確認事項" requirement="required">
          {confirmations.map((text, index) => (
            <ConsentRow
              key={text}
              name={`consent.${conditionCount + index}`}
              text={text}
              checked={values[conditionCount + index]}
              onChange={(checked) => onChange(conditionCount + index, checked)}
            />
          ))}
        </Fieldset>
      </SurfaceCard>
      <SurfaceCard title="ご入力いただいた情報の取扱いについて">
        <PrivacyText text={copy.privacy} />
        <Fieldset hideLegend legend="ご入力いただいた情報の取扱いについて" requirement="required">
          <ConsentRow
            name={`consent.${last}`}
            text={copy.consents[last]}
            checked={values[last]}
            onChange={(checked) => onChange(last, checked)}
          />
        </Fieldset>
      </SurfaceCard>
    </>
  );
}
