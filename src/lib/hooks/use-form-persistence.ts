"use client";

import { useEffect, useEffectEvent, useReducer, type RefObject } from "react";
import {
  readPersistedFields,
  removePersisted,
  snapshotFields,
  useStoredOnce,
  writePersisted,
  type RestoredFields,
} from "@/components/form/persisted-input";

export function useFormPersistence(
  formRef: RefObject<HTMLFormElement | null>,
  persist: string | false,
  pathname: string,
  onRestore: ((restored: RestoredFields) => void) | undefined,
  onReset: (() => void) | undefined,
) {
  useSubmitClickGuard(formRef);
  const [{ resetCount, discarded }, resetForm] = useReducer(
    (state: { resetCount: number; discarded: boolean }) => ({
      resetCount: state.resetCount + 1,
      discarded: true,
    }),
    { resetCount: 0, discarded: false },
  );
  // 画面内の遷移で開いた直後は location がまだ前の画面なので、控えの置き場はルーターのパスで決める
  const stored = useStoredOnce(persist, readPersistedFields, pathname);
  const saved = stored?.saved ?? null;
  // 送信後のresetでは控えを外し、サーバーが返した値を入力部品の初期値にする。
  const restored = discarded ? null : saved;
  const restoreOutside = useEffectEvent((fields: RestoredFields) => onRestore?.(fields));
  const resetOutside = useEffectEvent(() => onReset?.());
  const keepsRestored = useEffectEvent(() => restored !== null);

  // action の後の reset を React は commit 中に呼び、その間は onReset を配らないので、DOM の reset を直接聞く
  useEffect(() => {
    const form = formRef.current;
    if (form === null) return;
    const reset = () => {
      resetOutside();
      resetForm();
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [formRef]);

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
  }, [stored, formRef]);

  return { resetCount, saved, restored };
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
