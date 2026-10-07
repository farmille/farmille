"use client";

import { useFormStatus } from "react-dom";

import { buttonRecipe } from "@/components/Button";


/** フォームの送信ボタン。送信中は文言を変えて押せなくする。 */
export function FormSubmitButton({
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
    <button className={buttonRecipe({ variant: "primary" })} disabled={pending || disabled} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}
