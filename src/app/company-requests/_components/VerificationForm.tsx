"use client";
import * as v from "valibot";
import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { receiptAccessSchema } from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";

import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";

import { requestReceiptVerification } from "../actions";

export function VerificationForm() {
  const form = useForm({ defaultValues: { receiptNumber: "", email: "" } });
  const values = useStore(form.store, (state) => state.values);
  const [result, submit, busy] = useActionState(
    async (_previous: { failed: boolean; message: string }, _data: FormData) => {
      try {
        const result = await requestReceiptVerification(
          v.parse(receiptAccessSchema, form.state.values),
        );
        return {
          failed: !result.ok,
          message: result.ok
            ? "受付番号とメールアドレスが一致する場合は、確認メールをお送りしました。"
            : errorMessageJa[result.error],
        };
      } catch {
        return {
          failed: true,
          message:
            "確認メールを送信できませんでした。入力内容をご確認のうえ、もう一度お試しください。",
        };
      }
    },
    { failed: false, message: "" },
  );
  return (
    <Form
      action={submit}
      onRestore={(restored) => {
        form.setFieldValue("receiptNumber", restored.get("receiptNumber")?.[0] ?? "");
        form.setFieldValue("email", restored.get("email")?.[0] ?? "");
      }}
      persist="receipt-verification"
    >
      <Input
        label="受付番号"
        name="receiptNumber"
        value={values.receiptNumber}
        onChange={(event) => form.setFieldValue("receiptNumber", event.target.value)}
        requirement="required"
        inputMode="numeric"
        pattern="[0-9]+"
      />
      <Input
        label="担当者メールアドレス"
        name="email"
        value={values.email}
        onChange={(event) => form.setFieldValue("email", event.target.value)}
        requirement="required"
        maxLength={254}
        placeholder="tanto@example.co.jp"
        type="email"
      />
      {!busy && result.message ? (
        <Notice tone={result.failed ? "error" : "success"}>{result.message}</Notice>
      ) : null}
      <FormActions>
        <SubmitButton pending={busy} pendingLabel="送信しています…">
          確認メールを送信
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
