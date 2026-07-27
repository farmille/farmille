"use client";

import { useActionState, useId, useRef } from "react";

import { buttonRecipe } from "@/components/button";
import { Select } from "@/components/select";
import { Textarea } from "@/components/textarea";
import type { ReportActionState } from "@/server/actions/reports";
import { css, cx } from "../../styled-system/css";

const idleState: ReportActionState = { status: "idle" };

const trigger = css({
  display: "inline-flex",
  alignItems: "center",
  bg: "transparent",
  color: "text.subtle",
  fontSize: "xs",
  fontWeight: "700",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  cursor: "pointer",
  px: "1",
  py: "1",
});

const dialogStyle = css({
  maxW: "sm",
  w: "full",
  p: "4",
  bg: "surface.card",
  color: "text.default",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow.lift",
  "&::backdrop": { bg: "ink/45" },
});

const field = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
  mt: "3",
});

const fieldLabel = css({
  fontSize: "xs",
  fontWeight: "700",
  color: "text.muted",
});

export type ReportDialogProps = {
  /** `createReportAction.bind(null, targetType, targetId, currentPath)` を渡す。 */
  action: (prevState: ReportActionState, formData: FormData) => Promise<ReportActionState>;
  reasonOptions: ReadonlyArray<{ value: string; label: string }>;
  /** モーダル見出し。例：「このレビューを通報する」 */
  title: string;
  triggerLabel?: string;
  className?: string;
};

/** 通報導線（控えめなテキストリンク）＋通報モーダル（理由 select＋自由記述）。T-34。 */
export function ReportDialog({
  action,
  reasonOptions,
  title,
  triggerLabel = "通報する",
  className,
}: ReportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState(action, idleState);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        className={cx(trigger, className)}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </button>

      <dialog ref={dialogRef} aria-labelledby={titleId} className={dialogStyle}>
        {state.status === "success" ? (
          <>
            <h2 id={titleId} className={css({ m: "0", fontSize: "lg", fontWeight: "700" })}>
              通報を受け付けました
            </h2>
            <p className={css({ mt: "2", mb: "4", fontSize: "sm", color: "text.muted" })}>
              内容を確認のうえ対応いたします。ご協力ありがとうございます。
            </p>
            <button
              type="button"
              className={cx(buttonRecipe({ variant: "ghost", size: "md" }), css({ w: "100%" }))}
              onClick={() => dialogRef.current?.close()}
            >
              閉じる
            </button>
          </>
        ) : (
          <form action={formAction}>
            <h2 id={titleId} className={css({ m: "0", fontSize: "lg", fontWeight: "700" })}>
              {title}
            </h2>

            <div className={field}>
              <label htmlFor={`${titleId}-reason`} className={fieldLabel}>
                通報理由
              </label>
              <Select name="reasonCode" id={`${titleId}-reason`} required defaultValue="">
                <option value="" disabled>
                  選択してください
                </option>
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className={field}>
              <label htmlFor={`${titleId}-detail`} className={fieldLabel}>
                詳細（任意）
              </label>
              <Textarea
                name="detail"
                id={`${titleId}-detail`}
                placeholder="具体的な内容があればご記入ください"
              />
            </div>

            {state.status === "error" ? (
              <p role="alert" className={css({ mt: "3", fontSize: "sm", color: "accent.danger" })}>
                {state.message}
              </p>
            ) : null}

            <div className={css({ display: "flex", gap: "2", mt: "4" })}>
              <button
                type="button"
                className={cx(buttonRecipe({ variant: "ghost", size: "md" }), css({ flex: "1" }))}
                onClick={() => dialogRef.current?.close()}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={cx(buttonRecipe({ variant: "primary", size: "md" }), css({ flex: "1" }))}
              >
                {isPending ? "送信中…" : "通報する"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
