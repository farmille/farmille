"use client";

import { startTransition } from "react";
import { Button } from "@/components/Button";
import { Notice } from "@/components/form";
import { CompanyApplicationForm } from "@/app/company-requests/_components/CompanyApplicationForm";
import type { ContactDefaults } from "@/app/company-requests/_components/ContactFields";
import type { SubmittableKind } from "@/lib/company-application";
import { useCompanyApplicationStart } from "@/lib/hooks/use-company-application-start";
import { errorMessageJa } from "@/server/errors";

export function NewApplicationForm({
  kind,
  defaults,
  recipient,
}: {
  kind: SubmittableKind;
  defaults: ContactDefaults;
  recipient: string;
}) {
  const { state, begin, pending } = useCompanyApplicationStart(kind);
  if (state?.ok)
    return (
      <CompanyApplicationForm
        intentId={state.data}
        kind={kind}
        defaults={defaults}
        recipient={recipient}
      />
    );
  if (state === null || pending) return <p role="status">申請フォームを準備しています…</p>;
  return (
    <div>
      <Notice tone="error">{errorMessageJa[state.error]}</Notice>
      <Button onClick={() => startTransition(begin)}>もう一度試す</Button>
    </div>
  );
}
