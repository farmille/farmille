"use client";
import Link from "next/link";
import * as v from "valibot";
import { useState, type FormEvent } from "react";

import { RequiredBadge } from "@/app/_mock/FormParts";
import { receiptAccessSchema, removalVerificationSchema } from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";

import { requestVerification, requestReceiptVerification } from "../actions";

const PRIVATE_NOTE = (
  <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>
    公開されません
  </span>
);

/**
 * 見本 S.delistIntake（D簡易受付）の申請者情報と送信、送信後は S.delistIntakeDone の .done-wrap。
 * receipt のときは受付票の確認メールの再発行（見本に画面はなく、同じ部品で組む）。送信・検証は本番のまま。
 */
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
      <section role="status" className="done-wrap" style={{ paddingTop: 40 }}>
        <div className="done-check" aria-hidden="true">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path d="M5 12l5 5 9-11" />
          </svg>
        </div>
        <h2>申請フォームのURLをお送りしました</h2>
        <p>
          ご入力いただいたメールアドレスへ、申請フォームのURLをお送りしました。30分以内にメールのリンクを開き、申請内容をご記入・ご提出ください。
        </p>
        <p>
          この受付だけでは申請は完了していません。メールが届かない場合は迷惑メールフォルダーもご確認ください。
        </p>
        <div className="done-actions">
          <Link className="btn btn-primary" href="/sellers/procedures">
            お手続き一覧へ戻る
          </Link>
          <Link className="btn btn-ghost" href="/sellers">
            企業様向け利用ガイドに戻る
          </Link>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setSent(false);
              setMessage("");
            }}
          >
            メールアドレスを確認して再送する
          </button>
        </div>
      </section>
    );
  return (
    <form onSubmit={submit}>
      <div style={{ marginTop: 6 }}>
        {receipt ? (
          <div className="field">
            <label htmlFor="receiptNumber">
              受付番号 <RequiredBadge />
            </label>
            <input
              className="input"
              id="receiptNumber"
              inputMode="numeric"
              name="receiptNumber"
              pattern="[0-9]+"
              required
            />
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="intakeCompany">
                法人名 <RequiredBadge />
              </label>
              <input
                className="input"
                id="intakeCompany"
                maxLength={200}
                name="companyName"
                placeholder="例）〇〇バイオ株式会社"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="intakeName">
                担当者名 <RequiredBadge /> {PRIVATE_NOTE}
              </label>
              <input
                className="input"
                id="intakeName"
                maxLength={200}
                name="contactName"
                placeholder="例）金子 太郎"
                required
              />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="intakeEmail">
            担当者メールアドレス <RequiredBadge /> {receipt ? null : PRIVATE_NOTE}
          </label>
          {receipt ? null : (
            <div className="fguide" id="intakeEmail-guide">
              貴社ドメインのメールアドレスをご入力ください。このアドレス宛に申請フォームのURLをお送りします（フリーメールの場合、確認のご連絡をすることがあります）。
            </div>
          )}
          <input
            aria-describedby={receipt ? undefined : "intakeEmail-guide"}
            className="input"
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
        <div className={failed ? "err-box show" : "form-notice info"} role="status">
          {message}
        </div>
      ) : null}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy
            ? "送信しています…"
            : receipt
              ? "確認メールを送信"
              : "送信して申請フォームを受け取る"}
        </button>
        {receipt ? null : (
          <div className="draft">
            送信後すぐに、上記のメールアドレス宛に申請フォームのURLを自動送信します
          </div>
        )}
      </div>
    </form>
  );
}
