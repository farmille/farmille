"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { Dialog, DialogActions, DialogClose } from "@/components/Dialog";
import { Form, Notice, Select, SubmitButton, Textarea } from "@/components/form";
import type { ReportActionState } from "@/server/actions/reports";
import { css, cx } from "../../styled-system/css";

const idleState: ReportActionState = { status: "idle" };

type ReportFormInput = { reasonCode: string | null; detail: string };

const trigger = css({
  display: "inline-flex",
  alignItems: "center",
  // 指で押せるよう、押せる高さを 44px 取る
  minH: "11",
  px: "2",
  bg: "transparent",
  color: "text.subtle",
  fontSize: "sm",
  fontWeight: "bold",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  cursor: "pointer",
});

const formStyle = css({ mt: "3" });

const errorStyle = css({ mt: "3" });

export type ReportDialogProps = {
  /** `createReportAction.bind(null, targetType, targetId, currentPath)` を渡す。 */
  action: (prevState: ReportActionState, formData: FormData) => Promise<ReportActionState>;
  reasonOptions: ReadonlyArray<{ value: string; label: string }>;
  /** モーダル見出し。例：「この感想口コミを通報する」 */
  title: string;
  triggerLabel?: string;
  className?: string;
};

export function ReportDialog({
  action,
  reasonOptions,
  title,
  triggerLabel = "通報する",
  className,
}: ReportDialogProps) {
  const initialValues: ReportFormInput = {
    reasonCode: null,
    detail: "",
  };

  const form = useForm({ defaultValues: initialValues });
  const values = useStore(form.store, (state) => state.values);
  const [state, formAction] = useActionState(action, idleState);
  const done = state.status === "success";

  return (
    <Dialog
      description={
        done ? "内容を確認のうえ対応いたします。ご協力ありがとうございます。" : undefined
      }
      title={done ? "通報を受け付けました" : title}
      trigger={
        <button className={cx(trigger, className)} type="button">
          {triggerLabel}
        </button>
      }
    >
      {done ? (
        <DialogActions>
          <DialogClose>閉じる</DialogClose>
        </DialogActions>
      ) : (
        <Form action={formAction} className={formStyle} persist={false}>
          <Select
            label="通報理由"
            labelSize="sm"
            name="reasonCode"
            value={values.reasonCode}
            onValueChange={(value) => form.setFieldValue("reasonCode", value)}
            requirement="required"
            options={reasonOptions}
            placeholder="選択してください"
          />
          <Textarea
            label="詳細（任意）"
            labelSize="sm"
            name="detail"
            value={values.detail}
            onChange={(event) => form.setFieldValue("detail", event.target.value)}
            placeholder="具体的な内容があればご記入ください"
          />
          {state.status === "error" ? (
            <Notice className={errorStyle} tone="error">
              {state.message}
            </Notice>
          ) : null}
          <DialogActions>
            <DialogClose>キャンセル</DialogClose>
            <SubmitButton pendingLabel="送信中…">通報する</SubmitButton>
          </DialogActions>
        </Form>
      )}
    </Dialog>
  );
}
