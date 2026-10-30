"use client";

import { startTransition, useActionState, useRef } from "react";
import { beginApplication } from "@/app/company-requests/actions";
import { Button } from "@/components/Button";
import { Notice } from "@/components/form";
import { CompanyApplicationForm } from "@/app/company-requests/_components/CompanyApplicationForm";
import type { ContactDefaults } from "@/app/company-requests/_components/ContactFields";
import type { SubmittableKind } from "@/lib/company-application";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";
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
  const [state, begin, pending] = useActionState<Awaited<
    ReturnType<typeof beginApplication>
  > | null>(() => beginApplication(kind), null);

  // 呼び出し側が種類を key に渡すので、種類ごとに1回だけ作る。StrictModeの再実行では作らない。
  const started = useRef(false);
  useMountEffect(() => {
    if (started.current) return;
    started.current = true;
    startTransition(begin);
  });

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
