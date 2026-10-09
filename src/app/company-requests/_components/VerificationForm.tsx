"use client";
import * as v from "valibot";
import { useState, type FormEvent } from "react";

import { receiptAccessSchema } from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";

import { Field, FormMessage, formActionsStyle } from "@/components/auth/Fields";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

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
    <form onSubmit={submit}>
      <Field htmlFor="receiptNumber" label="受付番号" requirement="required">
        <Input
          id="receiptNumber"
          inputMode="numeric"
          name="receiptNumber"
          pattern="[0-9]+"
          required
        />
      </Field>
      <Field htmlFor="intakeEmail" label="担当者メールアドレス" requirement="required">
        <Input
          id="intakeEmail"
          maxLength={254}
          name="email"
          placeholder="tanto@example.co.jp"
          required
          type="email"
        />
      </Field>
      {message ? <FormMessage tone={failed ? "error" : "info"}>{message}</FormMessage> : null}
      <div className={formActionsStyle}>
        <Button disabled={busy} type="submit">
          {busy ? "送信しています…" : "確認メールを送信"}
        </Button>
      </div>
    </form>
  );
}
