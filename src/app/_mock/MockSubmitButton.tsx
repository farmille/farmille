"use client";

import { useFormStatus } from "react-dom";

import { buttonRecipe } from "@/components/Button";
import { css } from "../../../styled-system/css";

const submitButton = css(buttonRecipe.raw({ variant: "primary" }), {
  fontFamily: "inherit",
  lineHeight: "normal",
});

/** フォームの送信ボタン。送信中は文言を変えて押せなくする。 */
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
    <button className={submitButton} disabled={pending || disabled} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}
