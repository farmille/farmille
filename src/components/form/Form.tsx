"use client";

import { Form as BaseForm } from "@base-ui/react/form";
import {
  Fragment,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type FormEventHandler,
  type ReactNode,
} from "react";

import { FormResetContext } from "./field-context";
import {
  readPersistedFields,
  removePersisted,
  RestoredFieldsContext,
  snapshotFields,
  useStoredOnce,
  writePersisted,
  type RestoredFields,
} from "./persisted-input";
import { revealFirstError } from "./reveal-first-error";
import type { FieldErrors } from "./types";

type BaseErrors = NonNullable<BaseForm.Props["errors"]>;

type FormProps = {
  /**
   * リロードや画面の移動のあとも入力を戻すときの、ページ内で一意な名前。タブを閉じるまで残る。
   * パスワード・認証コード・確認操作など、戻さないフォームは false。
   */
  persist: string | false;
  /** 控えから戻した入力値。Form の外の state で持つ入力欄は、ここで state に入れる。 */
  onRestore?: (restored: RestoredFields) => void;
  action?: (formData: FormData) => void | Promise<void>;
  /** サーバーの項目エラー。値が変わった項目のエラーは消える。送信結果ごとに同じ参照を渡す。 */
  errors?: FieldErrors;
  id?: string;
  className?: string;
  children: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  /** 送信の結果エラーがあったら、画面の上から見て最初のエラーの欄へ移動してフォーカスする。 */
  revealFirstError?: boolean;
};

export function Form({
  persist,
  onRestore,
  errors,
  revealFirstError: reveals = false,
  children,
  ...rest
}: FormProps) {
  // Base UI は errors の参照が変わるたびに取り込み直すので、描画ごとに作り直さない
  const baseErrors = useMemo(
    () => (errors === undefined ? undefined : presentErrors(errors)),
    [errors],
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [resetCount, setResetCount] = useState(0);
  const stored = useStoredOnce(persist, readPersistedFields);
  const saved = stored?.saved ?? null;
  // 送信後の reset からは、サーバーが返した値を初期値にする
  const [discarded, setDiscarded] = useState(false);
  const restored = discarded ? null : saved;
  const restoreOutside = useEffectEvent((fields: RestoredFields) => onRestore?.(fields));
  const keepsRestored = useEffectEvent(() => restored !== null);

  // action の後の reset を React は commit 中に呼び、その間は onReset を配らないので、DOM の reset を直接聞く
  useEffect(() => {
    const form = formRef.current;
    if (form === null) return;
    const countReset = () => {
      setResetCount((count) => count + 1);
      setDiscarded(true);
    };
    form.addEventListener("reset", countReset);
    return () => form.removeEventListener("reset", countReset);
  }, []);

  useEffect(() => {
    if (saved !== null) restoreOutside(saved);
  }, [saved]);

  // 入力チェックで送信が止まったとき。Base UI がエラーの印を付けた後の描画で移動する
  useEffect(() => {
    const form = formRef.current;
    if (!reveals || form === null) return;
    let frame = 0;
    const revealWhenBlocked = (event: SubmitEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (event.defaultPrevented) revealFirstError(form);
      });
    };
    form.addEventListener("submit", revealWhenBlocked);
    return () => {
      cancelAnimationFrame(frame);
      form.removeEventListener("submit", revealWhenBlocked);
    };
  }, [reveals]);

  // サーバーから項目エラーが返ったとき。送信後の reset と再描画を待ってから移動する
  useEffect(() => {
    const form = formRef.current;
    if (!reveals || form === null || baseErrors === undefined) return;
    if (Object.keys(baseErrors).length === 0) return;
    const frame = requestAnimationFrame(() => revealFirstError(form));
    return () => cancelAnimationFrame(frame);
  }, [reveals, baseErrors]);

  useEffect(() => {
    const form = formRef.current;
    if (stored === undefined || form === null) return;
    const { key } = stored;
    const initial = JSON.stringify(Object.fromEntries(snapshotFields(form)));

    // 送信したあと入力を変えずに画面が外れたら、送信が通って移動したとみなして控えを消す
    let submitted = false;
    const keep = () => {
      const fields = Object.fromEntries(snapshotFields(form));
      if (!keepsRestored() && JSON.stringify(fields) === initial) removePersisted(key);
      else writePersisted(key, fields);
    };
    const markSubmitted = () => {
      submitted = true;
    };
    const markEdited = () => {
      submitted = false;
    };
    const keepWhenHidden = () => {
      if (document.visibilityState === "hidden") keep();
    };
    form.addEventListener("submit", markSubmitted);
    form.addEventListener("input", markEdited);
    form.addEventListener("change", markEdited);
    window.addEventListener("pagehide", keep);
    document.addEventListener("visibilitychange", keepWhenHidden);
    return () => {
      form.removeEventListener("submit", markSubmitted);
      form.removeEventListener("input", markEdited);
      form.removeEventListener("change", markEdited);
      window.removeEventListener("pagehide", keep);
      document.removeEventListener("visibilitychange", keepWhenHidden);
      if (submitted) removePersisted(key);
      else keep();
    };
  }, [stored]);

  return (
    <BaseForm errors={baseErrors} ref={formRef} {...rest}>
      <FormResetContext.Provider value={resetCount}>
        <RestoredFieldsContext.Provider value={restored}>
          {/* 控えを戻したら中身を作り直し、入力欄と中の部品の state を控えの値から始め直す */}
          <Fragment key={saved === null ? "blank" : "restored"}>{children}</Fragment>
        </RestoredFieldsContext.Provider>
      </FormResetContext.Provider>
    </BaseForm>
  );
}

function presentErrors(errors: FieldErrors): BaseErrors {
  const present: BaseErrors = {};
  for (const [name, message] of Object.entries(errors)) {
    if (message !== undefined) present[name] = message;
  }
  return present;
}
