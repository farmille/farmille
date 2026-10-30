"use client";

import { useEffectEvent, useReducer } from "react";
import * as v from "valibot";

import { useMountEffect } from "@/lib/hooks/use-mount-effect";

import { persistKey, readPersisted, removePersisted, writePersisted } from "./persisted-input";

/**
 * Form を使わない画面の入力を、リロード後も戻せるように控える。
 * unsaved は保存していない入力で、null のあいだは控えを消す。
 * 控えが残っていれば、表示した直後に restore へ一度だけ渡す。
 * 早期 return で描画する木を切り替える画面では、どの分岐でも同じ位置に置き、作り直しで控えを戻し直さないようにする。
 */
export function PersistedInput<T>({
  name,
  path,
  schema,
  unsaved,
  restore,
}: {
  name: string;
  /** 控えを分けるページの URL。省くと表示したときの URL。 */
  path?: string;
  schema: v.GenericSchema<unknown, T>;
  unsaved: T | null;
  restore: (saved: T) => void;
}) {
  // 置き場は最初に読んだ URL で決め、送信後のページ移動で別の URL の控えを書き換えないようにする
  const [storageKey, settle] = useReducer((_current: string | null, next: string) => next, null);
  const restoreSaved = useEffectEvent(restore);

  useMountEffect(() => {
    const opened = persistKey(name, path);
    const saved = readPersisted(opened, schema);

    if (saved !== null) restoreSaved(saved);
    settle(opened);
  });

  // 控えを読んで戻すまでは書かない（戻す前の空の入力で控えを消さない）
  if (storageKey === null) return null;

  // 入力が変わるたびに作り直して書き直す
  return (
    <PersistedCopy
      key={unsaved === null ? "" : JSON.stringify(unsaved)}
      storageKey={storageKey}
      unsaved={unsaved}
    />
  );
}

function PersistedCopy<T>({ storageKey, unsaved }: { storageKey: string; unsaved: T | null }) {
  useMountEffect(() => {
    if (unsaved === null) removePersisted(storageKey);
    else writePersisted(storageKey, unsaved);
  });

  return null;
}
