"use client";
import { css, cx } from "../../../../styled-system/css";
import * as v from "valibot";
import { receiptAccessSchema, removalVerificationSchema } from "@/lib/company-application";
import { useState, type FormEvent } from "react";
import { Button, Input, TextLink } from "@/components";
import { errorMessageJa } from "@/server/errors";
import { requestVerification, requestReceiptVerification } from "../actions";
import { applicationField, applicationStack } from "./ContactFields";
const verificationStack = cx(applicationStack, css({ "& h2": { fontSize: "lg" } }));

export function VerificationForm({ receipt = false }: { receipt?: boolean }) {
  const [sent, setSent] = useState(false);
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
      if (result.ok && !receipt) setSent(true);
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
  if (sent)
    return (
      <section role="status" className={verificationStack}>
        <h2>申請フォームのご案内をお送りしました</h2>
        <p>
          ご入力いただいたメールアドレスへ、申請フォームのURLをお送りしました。30分以内にメールのリンクを開き、申請内容をご記入・ご提出ください。
        </p>
        <p>
          この受付だけでは申請は完了していません。メールが届かない場合は迷惑メールフォルダーもご確認ください。
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSent(false);
            setMessage("");
          }}
        >
          メールアドレスを確認して再送する
        </Button>
        <TextLink href="/sellers">企業様向け利用ガイドに戻る</TextLink>
      </section>
    );
  return (
    <form onSubmit={submit} className={verificationStack}>
      {receipt ? (
        <label className={applicationField}>
          受付番号
          <Input name="receiptNumber" required pattern="[0-9]+" inputMode="numeric" />
        </label>
      ) : (
        <>
          <label className={applicationField}>
            法人名（必須）
            <Input
              name="companyName"
              required
              maxLength={200}
              placeholder="例）〇〇バイオ株式会社"
            />
          </label>
          <label className={applicationField}>
            担当者名（必須）
            <Input name="contactName" required maxLength={200} placeholder="例）金子 太郎" />
          </label>
        </>
      )}
      <label className={applicationField}>
        担当者メールアドレス（必須）
        <Input
          name="email"
          type="email"
          required
          maxLength={254}
          placeholder="tanto@example.co.jp"
        />
      </label>
      {!receipt && <p>ご担当者名・担当者メールアドレスは公開されません。</p>}
      {!receipt && (
        <p>
          貴社ドメインのメールアドレスをご入力ください。このアドレス宛に申請フォームのURLをお送りします（フリーメールの場合、確認のご連絡をすることがあります）。
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "送信しています…" : receipt ? "確認メールを送信" : "送信して申請フォームを受け取る"}
      </Button>
      {!receipt && <p>送信後すぐに、上記のメールアドレス宛に申請フォームのURLを自動送信します。</p>}
      {message && <p role="status">{message}</p>}
    </form>
  );
}
