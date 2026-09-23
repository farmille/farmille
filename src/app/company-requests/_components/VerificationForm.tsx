"use client";
import * as v from "valibot";
import { receiptAccessSchema, removalVerificationSchema } from "@/lib/company-application";
import { useState, type FormEvent } from "react";
import { Button, Input } from "@/components";
import { errorMessageJa } from "@/server/errors";
import { requestVerification, requestReceiptVerification } from "../actions";
import { applicationField, applicationStack } from "./ContactFields";
export function VerificationForm({ receipt = false }: { receipt?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const result = receipt
        ? await requestReceiptVerification(
            v.parse(receiptAccessSchema, {
              receiptNumber: data.get("receiptNumber"),
              email: data.get("email"),
            }),
          )
        : await requestVerification(
            v.parse(removalVerificationSchema, {
              companyName: data.get("companyName"),
              contactName: data.get("contactName"),
              email: data.get("email"),
            }),
          );
      setMessage(
        result.ok
          ? receipt
            ? "受付番号とメールアドレスが一致する場合は、確認メールをお送りしました。"
            : "確認メールをお送りしました。30分以内にリンクを開いてください。"
          : errorMessageJa[result.error],
      );
    } catch {
      setMessage(
        "確認メールを送信できませんでした。入力内容をご確認のうえ、もう一度お試しください。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={applicationStack}>
      {receipt ? (
        <label className={applicationField}>
          受付番号
          <Input name="receiptNumber" required pattern="[0-9]+" inputMode="numeric" />
        </label>
      ) : (
        <>
          <label className={applicationField}>
            法人名
            <Input name="companyName" required maxLength={200} />
          </label>
          <label className={applicationField}>
            担当者名
            <Input name="contactName" required maxLength={200} />
          </label>
        </>
      )}
      <label className={applicationField}>
        法人メールアドレス
        <Input name="email" type="email" required maxLength={254} />
      </label>
      <Button type="submit" disabled={busy}>
        {busy ? "送信しています…" : "確認メールを送信"}
      </Button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
