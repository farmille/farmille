"use client";

import { useFormStatus } from "react-dom";

import { Button } from "./button";

type PendingButtonProps = {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "ghost" | "danger";
  size?: "md" | "sm";
  disabled?: boolean;
  className?: string;
};

/** フォーム送信中の二重送信を防ぎ、処理中の文言へ切り替える。 */
export function PendingButton({
  label,
  pendingLabel,
  variant,
  size,
  disabled = false,
  className,
}: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={className}
      disabled={disabled || pending}
      size={size}
      type="submit"
      variant={variant}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
