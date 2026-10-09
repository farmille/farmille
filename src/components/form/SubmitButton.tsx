"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/Button";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  /** 画面側の送信中。囲むフォームの送信中（useFormStatus）も送信中として扱う。 */
  pending?: boolean;
  variant?: "primary" | "ghost" | "danger";
  size?: "md" | "sm";
  disabled?: boolean;
  className?: string;
};

/** 送信中は文言を切り替えて二重送信を防ぐ。押したボタンからフォーカスを外さない。 */
export function SubmitButton({
  children,
  pendingLabel,
  pending: pendingProp,
  disabled = false,
  ...rest
}: SubmitButtonProps) {
  const status = useFormStatus();
  const pending = pendingProp === true || status.pending;

  return (
    <Button {...rest} disabled={disabled || pending} focusableWhenDisabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </Button>
  );
}
