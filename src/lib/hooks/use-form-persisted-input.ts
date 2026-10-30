"use client";

import { useEffect, useEffectEvent } from "react";
import * as v from "valibot";
import {
  useStoredOnce,
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/components/form/persisted-input";

/**
 * Form を使わない画面の入力を、リロード後も戻せるように控える。
 * unsaved は保存していない入力で、null のあいだは控えを消す。
 * 控えが残っていれば、表示した直後に restore へ一度だけ渡す。
 */
export function usePersistedInput<T>({
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
}): void {
  const stored = useStoredOnce(name, (key) => readPersisted(key, schema), path);
  const restoreSaved = useEffectEvent(restore);

  useEffect(() => {
    if (stored?.saved != null) restoreSaved(stored.saved);
  }, [stored]);

  useEffect(() => {
    if (stored === undefined) return;
    if (unsaved === null) removePersisted(stored.key);
    else writePersisted(stored.key, unsaved);
  }, [stored, unsaved]);
}
