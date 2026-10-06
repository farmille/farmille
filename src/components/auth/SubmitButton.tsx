"use client";

import { PendingButton } from "@/components/PendingButton";

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  return <PendingButton label={label} pendingLabel={pendingLabel} />;
}
