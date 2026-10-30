"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { beginApplication } from "@/app/company-requests/actions";
import type { SubmittableKind } from "@/lib/company-application";

export function useCompanyApplicationStart(kind: SubmittableKind) {
  const [state, begin, pending] = useActionState<Awaited<
    ReturnType<typeof beginApplication>
  > | null>(() => beginApplication(kind), null);
  const startedKind = useRef<SubmittableKind | null>(null);

  useEffect(() => {
    if (startedKind.current === kind) return;
    startedKind.current = kind;
    startTransition(begin);
  }, [begin, kind]);

  return { state, begin, pending };
}
