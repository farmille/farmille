"use client";

import { Form as BaseForm } from "@base-ui/react/form";
import { useMemo, type FormEventHandler, type ReactNode } from "react";

import type { FieldErrors } from "./types";

type BaseErrors = NonNullable<BaseForm.Props["errors"]>;

type FormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  /** サーバーの項目エラー。値が変わった項目のエラーは消える。送信結果ごとに同じ参照を渡す。 */
  errors?: FieldErrors;
  id?: string;
  className?: string;
  children: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

/**
 * 送信時に中の Field を検証し、最初の不備へフォーカスを移すフォーム（noValidate）。
 * レイアウトは持たないので、並べ方は呼び出し側の className で決める。
 */
export function Form({ errors, ...rest }: FormProps) {
  // Base UI は errors の参照が変わるたびに取り込み直すので、描画ごとに作り直さない
  const baseErrors = useMemo(
    () => (errors === undefined ? undefined : presentErrors(errors)),
    [errors],
  );
  return <BaseForm errors={baseErrors} {...rest} />;
}

function presentErrors(errors: FieldErrors): BaseErrors {
  const present: BaseErrors = {};
  for (const [name, message] of Object.entries(errors)) {
    if (message !== undefined) present[name] = message;
  }
  return present;
}
