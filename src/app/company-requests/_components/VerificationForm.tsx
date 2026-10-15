"use client";
import * as v from "valibot";
import { useState, type FormEvent } from "react";

import { receiptAccessSchema } from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";

import { Form, FormActions, Input, Notice, SubmitButton } from "@/components/form";

import { requestReceiptVerification } from "../actions";

export function VerificationForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setFailed(false);
    const data = new FormData(event.currentTarget);
    try {
      const result = await requestReceiptVerification(
        v.parse(receiptAccessSchema, {
          receiptNumber: data.get("receiptNumber"),
          email: data.get("email"),
        }),
      );
      setFailed(!result.ok);
      setMessage(
        result.ok
          ? "受付番号とメールアドレスが一致する場合は、確認メールをお送りしました。"
          : errorMessageJa[result.error],
      );
    } catch {
      setFailed(true);
      setMessage(
        "確認メールを送信できませんでした。入力内容をご確認のうえ、もう一度お試しください。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Form onSubmit={submit} persist="receipt-verification">
      <Input
        label="受付番号"
        name="receiptNumber"
        requirement="required"
        inputMode="numeric"
        pattern="[0-9]+"
      />
      <Input
        label="担当者メールアドレス"
        name="email"
        requirement="required"
        maxLength={254}
        placeholder="tanto@example.co.jp"
        type="email"
      />
      {message ? <Notice tone={failed ? "error" : "success"}>{message}</Notice> : null}
      <FormActions>
        <SubmitButton pending={busy} pendingLabel="送信しています…">
          確認メールを送信
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
