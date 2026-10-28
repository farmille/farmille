"use client";

import { Form as BaseForm } from "@base-ui/react/form";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type FormEventHandler,
  type ReactNode,
  type RefObject,
} from "react";

import { FormResetContext, FormValidateContext } from "./field-context";
import {
  readPersistedFields,
  removePersisted,
  RestoredFieldsContext,
  snapshotFields,
  useStoredOnce,
  writePersisted,
  type RestoredFields,
} from "./persisted-input";
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
  /**
   * 送る前に、送る値（FormData）をサーバーと同じ規則で確かめ、欄ごとのエラー文言を返す。
   * 送信時に全欄の誤りをまとめて出して最初の誤りの欄へ移り、その後は入力のたびに確かめ直す。
   */
  validate?: (formData: FormData) => FieldErrors;
  id?: string;
  className?: string;
  children: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

export function Form({ persist, onRestore, errors, validate, children, ...rest }: FormProps) {
  // Base UI は errors の参照が変わるたびに取り込み直すので、描画ごとに作り直さない
  const baseErrors = useMemo(
    () => (errors === undefined ? undefined : presentErrors(errors)),
    [errors],
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fieldError = useMemo(
    () =>
      validate === undefined
        ? null
        : (name: string) => {
            const form = formRef.current;
            return form === null ? null : (validate(new FormData(form))[name] ?? null);
          },
    [validate],
  );
  useSubmitClickGuard(formRef);
  const [resetCount, setResetCount] = useState(0);
  // 画面内の遷移で開いた直後は location がまだ前の画面なので、控えの置き場はルーターのパスで決める
  const stored = useStoredOnce(persist, readPersistedFields, usePathname());
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
        <FormValidateContext.Provider value={fieldError}>
          <RestoredFieldsContext.Provider value={restored}>
            {/* 控えを戻したら中身を作り直し、入力欄と中の部品の state を控えの値から始め直す */}
            <Fragment key={saved === null ? "blank" : "restored"}>{children}</Fragment>
          </RestoredFieldsContext.Provider>
        </FormValidateContext.Provider>
      </FormResetContext.Provider>
    </BaseForm>
  );
}

/**
 * 送信のクリックで先頭のエラー欄へフォーカスが移ると、画面がその欄まで動き、ダブルクリックの2回目が
 * 動いた先の別の欄に当たってフォーカスを奪う。送信した押し操作に続く2回目以降の押し操作（detail が2以上）は、
 * フォーカスの移動もクリックもどこにも届けない。
 */
function useSubmitClickGuard(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const form = formRef.current;
    if (form === null) return;
    let submitted = false;
    let swallowing = false;
    const arm = () => {
      submitted = true;
    };
    const press = (event: MouseEvent) => {
      swallowing = submitted && event.detail > 1;
      submitted = false;
      swallow(event);
    };
    const swallow = (event: MouseEvent) => {
      if (!swallowing) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const followingEvents = ["mouseup", "click", "dblclick"] as const;
    form.addEventListener("submit", arm);
    window.addEventListener("mousedown", press, true);
    for (const type of followingEvents) window.addEventListener(type, swallow, true);
    return () => {
      form.removeEventListener("submit", arm);
      window.removeEventListener("mousedown", press, true);
      for (const type of followingEvents) window.removeEventListener(type, swallow, true);
    };
  }, [formRef]);
}

const NO_ERRORS: BaseErrors = {};

function presentErrors(errors: FieldErrors): BaseErrors {
  const present: BaseErrors = {};
  for (const [name, message] of Object.entries(errors)) {
    if (message !== undefined) present[name] = message;
  }
  // Base UI は送信後に errors が初めて変わったときにだけ最初のエラーの欄へフォーカスを移す。
  // 送信中の再描画で作り直された空のエラーをそこで使わせず、サーバーの結果まで取っておく
  return Object.keys(present).length === 0 ? NO_ERRORS : present;
}
