"use client";

import { useFormStatus } from "react-dom";

import { primaryButtonStyle } from "@/components/auth/fields";

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button className={primaryButtonStyle} disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}
