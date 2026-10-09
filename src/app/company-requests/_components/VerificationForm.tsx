"use client";
import * as v from "valibot";
import { useState, type FormEvent } from "react";

import { receiptAccessSchema } from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";

import { css } from "../../../../styled-system/css";

import { requestReceiptVerification } from "../actions";
import {
  fieldLabelStyle,
  fieldStyle,
  formalActionsStyle,
  formalControlRecipe,
  formalMessageRecipe,
  formalSubmitStyle,
} from "./formal-styles";
import { RequiredMark } from "./FormalMarks";

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
      <div className={css({ mt: "1.5" })}>
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
        <div className={fieldStyle}>
          <label className={fieldLabelStyle} htmlFor="intakeEmail">
            担当者メールアドレス <RequiredMark />
          </label>
          <input
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
          {busy ? "送信しています…" : "確認メールを送信"}
        </button>
      </div>
    </form>
  );
}
