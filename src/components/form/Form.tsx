"use client";

import { Form as BaseForm } from "@base-ui/react/form";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useEffectEvent,
  useMemo,
  useRef,
  type FormEventHandler,
  type ReactNode,
  type RefObject,
} from "react";

import { FormResetContext, FormValidateContext } from "./field-context";
import { RestoredFieldsContext, type RestoredFields } from "./persisted-input";
import { keepFields, useFormPersistence } from "@/lib/hooks/use-form-persistence";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";
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
  /** DOMのresetに合わせて、所有するTanStack Formの入力を戻す。 */
  onReset?: () => void;
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

export function Form({
  persist,
  onRestore,
  onReset,
  errors,
  validate,
  children,
  ...rest
}: FormProps) {
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

  const { resetCount, stored, restored } = useFormPersistence(
    formRef,
    persist,
    usePathname(),
    onReset,
  );

  const saved = stored?.saved ?? null;

  return (
    <BaseForm errors={baseErrors} ref={formRef} {...rest}>
      {/* 控えはハイドレーションの後に読むので、読み終えてから控えの同期を始める */}
      {stored === undefined ? null : (
        <KeepInput
          formRef={formRef}
          keepsRestored={restored !== null}
          onRestore={onRestore}
          saved={saved}
          storeKey={stored.key}
        />
      )}
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

/** 控えから戻した値を Form の外へ渡し、ページを離れるときの入力を控える。 */
function KeepInput({
  formRef,
  storeKey,
  saved,
  keepsRestored,
  onRestore,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  storeKey: string;
  saved: RestoredFields | null;
  keepsRestored: boolean;
  onRestore: ((restored: RestoredFields) => void) | undefined;
}) {
  const restoreOutside = useEffectEvent((fields: RestoredFields) => onRestore?.(fields));
  const readKeepsRestored = useEffectEvent(() => keepsRestored);
  useMountEffect(() => {
    if (saved !== null) restoreOutside(saved);
    const form = formRef.current;

    if (form === null) return;

    return keepFields(form, storeKey, readKeepsRestored);
  });

  return null;
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
