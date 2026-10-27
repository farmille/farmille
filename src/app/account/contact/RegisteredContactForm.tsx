"use client";

import { Fragment, useActionState } from "react";

import { saveRegisteredContactAction } from "@/app/account/contact/actions";
import { ContactNameFields } from "@/app/signup/ContactNameFields";
import { PostalAddressFields } from "@/app/signup/PostalAddressFields";
import { Form, FormActions, Notice, SubmitButton } from "@/components/form";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

import { css } from "../../../../styled-system/css";

const savedNoticeStyle = css({ mt: "3" });

/** 本名・電話番号・住所の変更。欄と検証は会員登録と同じものを使う。 */
export function RegisteredContactForm({ saved }: { saved: Record<string, string> }) {
  const [state, formAction] = useActionState(saveRegisteredContactAction, initialAuthFormState);
  const values = { ...saved, ...submittedValuesOf(state) };

  return (
    <Form
      action={formAction}
      errors={fieldErrorsOf(state)}
      persist="account-contact"
      revealFirstError
    >
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {/* 保存後・エラー後に初期値が変わったら欄を作り直す。入力中の欄の初期値を書き換えない */}
      <Fragment key={JSON.stringify(values)}>
        <ContactNameFields values={values} />
        <PostalAddressFields values={values} />
      </Fragment>
      {state.status === "done" ? (
        <Notice className={savedNoticeStyle} tone="success">
          {state.message}
        </Notice>
      ) : null}
      <FormActions>
        <SubmitButton pendingLabel="保存中…">保存する</SubmitButton>
      </FormActions>
    </Form>
  );
}
