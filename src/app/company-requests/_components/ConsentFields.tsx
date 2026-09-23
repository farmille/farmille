import Link from "next/link";
import { applicationCopy } from "@/lib/company-application-copy";
import type { ApplicationKind } from "@/lib/company-application";
import { applicationStack } from "./ContactFields";
export function ConsentFields({ kind }: { kind: ApplicationKind }) {
  const copy = applicationCopy[kind];
  return (
    <section className={applicationStack}>
      <h2>ご申請にあたっての確認事項</h2>
      <p>すべてをご確認のうえ、チェックしてください。</p>
      {copy.consents.slice(0, -1).map((text, index) => (
        <label key={text}>
          <input type="checkbox" name={`consent.${index}`} required /> {text}
        </label>
      ))}
      <h2>ご入力いただいた情報の取扱いについて</h2>
      <p>{copy.privacy}</p>
      <Link href="/legal/privacy">プライバシーポリシー</Link>
      <label>
        <input type="checkbox" name={`consent.${copy.consents.length - 1}`} required />{" "}
        {copy.consents[copy.consents.length - 1]}
      </label>
    </section>
  );
}
