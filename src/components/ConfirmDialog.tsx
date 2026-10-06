"use client";

import { useId, useRef, type ReactNode } from "react";

import { buttonRecipe } from "@/components/Button";
import { dialogPanel } from "@/components/dialog-panel";
import { css, cx } from "../../styled-system/css";

type ConfirmDialogProps = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  triggerLabel: string;
  triggerVariant?: "danger" | "ghost" | "primary";
  triggerSize?: "sm" | "md";
  triggerDisabled?: boolean;
  /** form action として渡す。確認ボタンは submit になる。 */
  action?: (formData: FormData) => void | Promise<void>;
  onConfirm?: () => void;
};

/**
 * 削除・危険操作の確認ダイアログ。
 * action があれば form submit、なければ onConfirm を呼ぶ。
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "キャンセル",
  confirmVariant = "danger",
  triggerLabel,
  triggerVariant = "danger",
  triggerSize = "sm",
  triggerDisabled = false,
  action,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        className={buttonRecipe({ variant: triggerVariant, size: triggerSize })}
        disabled={triggerDisabled}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </button>

      <dialog ref={dialogRef} aria-labelledby={titleId} className={dialogPanel}>
        <h2 id={titleId} className={css({ m: "0", fontSize: "lg" })}>
          {title}
        </h2>
        <div
          className={css({
            mt: "2",
            mb: "4",
            fontSize: "sm",
            color: "text.muted",
            lineHeight: "relaxed",
          })}
        >
          {description}
        </div>
        <div className={css({ display: "flex", gap: "2" })}>
          <button
            type="button"
            className={cx(buttonRecipe({ variant: "ghost", size: "md" }), css({ flex: "1" }))}
            onClick={() => dialogRef.current?.close()}
          >
            {cancelLabel}
          </button>
          {action !== undefined ? (
            <form action={action} className={css({ flex: "1" })}>
              <button
                type="submit"
                className={buttonRecipe({ variant: confirmVariant, size: "md" })}
              >
                {confirmLabel}
              </button>
            </form>
          ) : (
            <button
              type="button"
              className={cx(
                buttonRecipe({ variant: confirmVariant, size: "md" }),
                css({ flex: "1" }),
              )}
              onClick={() => {
                dialogRef.current?.close();
                onConfirm?.();
              }}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </dialog>
    </>
  );
}
