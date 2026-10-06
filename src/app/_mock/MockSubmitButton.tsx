"use client";

import { useFormStatus } from "react-dom";

/** 見本の `<button class="btn btn-primary">`。送信中は文言を変えて押せなくする。 */
export function MockSubmitButton({
  label,
  pendingLabel,
  disabled = false,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button className="btn btn-primary" disabled={pending || disabled} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}
