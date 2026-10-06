"use client";
import { Button, FormPageShell, TextLink } from "@/components";
import { applicationStack } from "./_components/ContactFields";
export default function ApplicationErrorPage({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <FormPageShell chrome="public" title="申請ページを開けませんでした" backHref="/">
      <div className={applicationStack}>
        <p>
          認証の有効期限が切れた場合は、確認メールを再発行してください。受付済みの申請は、受付番号とメールアドレスで再確認できます。時間をおいても開けない場合は、受付番号を添えて運営へご連絡ください。
        </p>
        <Button onClick={unstable_retry}>再読み込み</Button>
        <p>
          <TextLink href="/company-requests/receipts">受付票の確認メールを再発行</TextLink>
        </p>
        <p>
          <TextLink href="/company-requests/removal">申請用メールを再発行</TextLink>
        </p>
      </div>
    </FormPageShell>
  );
}
