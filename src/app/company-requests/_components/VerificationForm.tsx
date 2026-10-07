"use client";
import Link from "next/link";
import { buttonRecipe } from "@/components/Button";
import * as v from "valibot";
import { useState, type FormEvent } from "react";

import { receiptAccessSchema, removalVerificationSchema } from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";

import { css } from "../../../../styled-system/css";

import { requestVerification, requestReceiptVerification } from "../actions";
import { DoneMessage } from "./DoneMessage";
import {
  fieldLabelStyle,
  fieldStyle,
  formalActionsStyle,
  formalControlRecipe,
  formalDraftStyle,
  formalGuideRecipe,
  formalMessageRecipe,
  formalSubmitStyle,
} from "./formal-styles";
import { PrivateNote, RequiredMark } from "./FormalMarks";

export function VerificationForm({ receipt = false }: { receipt?: boolean }) {
  const [sent, setSent] = useState(false);
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
      setFailed(!result.ok);
      setMessage(
        result.ok
          ? receipt
            ? "受付番号とメールアドレスが一致する場合は、確認メールをお送りしました。"
            : "確認メールをお送りしました。30分以内にリンクを開いてください。"
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
  if (sent)
    return (
      <DoneMessage
        role="status"
        spacing="section"
        title="申請フォームのURLをお送りしました"
        actions={
          <>
            <Link className={buttonRecipe({ variant: "primary" })} href="/sellers/procedures">
              お手続き一覧へ戻る
            </Link>
            <Link className={buttonRecipe({ variant: "ghost" })} href="/sellers">
              企業様向け利用ガイドに戻る
            </Link>
            <button
              className={buttonRecipe({ variant: "ghost" })}
              type="button"
              onClick={() => {
                setSent(false);
                setMessage("");
              }}
            >
              メールアドレスを確認して再送する
            </button>
          </>
        }
      >
        <p>
          ご入力いただいたメールアドレスへ、申請フォームのURLをお送りしました。30分以内にメールのリンクを開き、申請内容をご記入・ご提出ください。
        </p>
        <p>
          この受付だけでは申請は完了していません。メールが届かない場合は迷惑メールフォルダーもご確認ください。
        </p>
      </DoneMessage>
    );
  return (
    <form onSubmit={submit}>
      <div className={css({ mt: "1.5" })}>
        {receipt ? (
          <div className={fieldStyle}>
            <label className={fieldLabelStyle} htmlFor="receiptNumber">
              受付番号 <RequiredMark />
            </label>
            <input
              className={formalControlRecipe()}
              id="receiptNumber"
              inputMode="numeric"
              name="receiptNumber"
              pattern="[0-9]+"
              required
            />
          </div>
        ) : (
          <>
            <div className={fieldStyle}>
              <label className={fieldLabelStyle} htmlFor="intakeCompany">
                法人名 <RequiredMark />
              </label>
              <input
                className={formalControlRecipe()}
                id="intakeCompany"
                maxLength={200}
                name="companyName"
                placeholder="例）〇〇バイオ株式会社"
                required
              />
            </div>
            <div className={fieldStyle}>
              <label className={fieldLabelStyle} htmlFor="intakeName">
                担当者名 <RequiredMark /> <PrivateNote />
              </label>
              <input
                className={formalControlRecipe()}
                id="intakeName"
                maxLength={200}
                name="contactName"
                placeholder="例）金子 太郎"
                required
              />
            </div>
          </>
        )}
        <div className={fieldStyle}>
          <label className={fieldLabelStyle} htmlFor="intakeEmail">
            担当者メールアドレス <RequiredMark /> {receipt ? null : <PrivateNote />}
          </label>
          {receipt ? null : (
            <div className={formalGuideRecipe()} id="intakeEmail-guide">
              貴社ドメインのメールアドレスをご入力ください。このアドレス宛に申請フォームのURLをお送りします（フリーメールの場合、確認のご連絡をすることがあります）。
            </div>
          )}
          <input
            aria-describedby={receipt ? undefined : "intakeEmail-guide"}
            className={formalControlRecipe()}
            id="intakeEmail"
            maxLength={254}
            name="email"
            placeholder="tanto@example.co.jp"
            required
            type="email"
          />
        </div>
      </div>
      {message ? (
        <div className={formalMessageRecipe({ tone: failed ? "error" : "info" })} role="status">
          {message}
        </div>
      ) : null}
      <div className={formalActionsStyle}>
        <button className={formalSubmitStyle} disabled={busy} type="submit">
          {busy
            ? "送信しています…"
            : receipt
              ? "確認メールを送信"
              : "送信して申請フォームを受け取る"}
        </button>
        {receipt ? null : (
          <div className={formalDraftStyle}>
            送信後すぐに、上記のメールアドレス宛に申請フォームのURLを自動送信します
          </div>
        )}
      </div>
    </form>
  );
}
