"use client";

import * as Sentry from "@sentry/nextjs";
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from "react";
import * as v from "valibot";

import type { Option } from "./types";

/** 名前ごとの入力値。チェックやラジオは選んだ値だけが並び、何も選ばなければ空配列になる。 */
export type RestoredFields = ReadonlyMap<string, readonly string[]>;

const FieldsSchema = v.pipe(
  v.record(v.string(), v.array(v.string())),
  v.transform((record): RestoredFields => new Map(Object.entries(record))),
);

/** 入力の控えはタブを閉じるまで残す。ページの URL ごとに分け、同じページの複数のフォームは名前で分ける。 */
export function persistKey(name: string): string {
  return `farmille:input:${window.location.pathname}#${name}`;
}

export function readPersisted<T>(key: string, schema: v.GenericSchema<unknown, T>): T | null {
  let raw: string | null;
  try {
    raw = window.sessionStorage.getItem(key);
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
  if (raw === null) return null;
  const parsed = v.safeParse(v.pipe(v.string(), v.parseJson(), schema), raw);
  if (parsed.success) return parsed.output;
  // 画面の改修で形が変わった古い控えは戻せないので捨てる
  removePersisted(key);
  return null;
}

export function writePersisted<T>(key: string, value: T): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    Sentry.captureException(error);
  }
}

export function removePersisted(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    Sentry.captureException(error);
  }
}

export function readPersistedFields(key: string): RestoredFields | null {
  return readPersisted(key, FieldsSchema);
}

/** 控えに残さない入力欄。パスワードは表示切替で type が text になっても data-persist で外す。 */
function persistable(
  element: Element,
): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (
    !(
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    )
  ) {
    return false;
  }
  if (element.name === "" || element.disabled || element.dataset.persist === "never") return false;
  return !(
    element instanceof HTMLInputElement &&
    (element.type === "file" || element.type === "password")
  );
}

/** フォームの今の入力を名前ごとに読む。チェックを外した欄も空配列で残し、戻したときに初期値のチェックを打ち消す。 */
export function snapshotFields(form: HTMLFormElement): Map<string, string[]> {
  const fields = new Map<string, string[]>();
  for (const element of Array.from(form.elements)) {
    if (!persistable(element)) continue;
    const values = fields.get(element.name) ?? [];
    fields.set(element.name, values);
    if (
      element instanceof HTMLInputElement &&
      (element.type === "checkbox" || element.type === "radio")
    ) {
      if (element.checked) values.push(element.value);
    } else if (element instanceof HTMLSelectElement) {
      values.push(...Array.from(element.selectedOptions, (option) => option.value));
    } else {
      values.push(element.value);
    }
  }
  return fields;
}

/** 囲む Form が控えから戻した入力値。戻していなければ null。 */
export const RestoredFieldsContext = createContext<RestoredFields | null>(null);

export function useRestoredField(name: string | undefined): readonly string[] | undefined {
  const restored = useContext(RestoredFieldsContext);
  return name === undefined ? undefined : restored?.get(name);
}

/** 1つの入力欄に戻す文字列。同じ名前が複数ある欄はどれに戻すか決まらないので戻さない。 */
export function useRestoredText(name: string | undefined): string | undefined {
  const values = useRestoredField(name);
  return values?.length === 1 ? values[0] : undefined;
}

/** 戻した値のうち、今の選択肢にあるものを選択肢の型で返す。 */
export function restoredChoices<V extends string>(
  options: readonly Option<V>[],
  restored: readonly string[],
): V[] {
  return options.filter((option) => restored.includes(option.value)).map((option) => option.value);
}

type Stored<T> = { key: string; saved: T | null };

const subscribeNothing = () => () => {};
const notReadOnServer = () => undefined;

/**
 * 控えの置き場と中身を、ハイドレーションの後に一度だけ読む。サーバーの描画とハイドレーション中は undefined。
 * 置き場は最初に読んだ URL で決め、送信後のページ移動で別の URL の控えを書き換えないようにする。
 */
export function useStoredOnce<T>(
  name: string | false,
  read: (key: string) => T | null,
): Stored<T> | undefined {
  const [snapshot] = useState(() => {
    let stored: Stored<T> | undefined;
    return () => {
      if (name === false) return undefined;
      if (stored === undefined) {
        const key = persistKey(name);
        stored = { key, saved: read(key) };
      }
      return stored;
    };
  });
  return useSyncExternalStore(subscribeNothing, snapshot, notReadOnServer);
}

/**
 * Form を使わない画面の入力を、リロード後も戻せるように控える。
 * unsaved は保存していない入力で、null のあいだは控えを消す。
 * 控えが残っていれば、表示した直後に restore へ一度だけ渡す。
 */
export function usePersistedInput<T>({
  name,
  schema,
  unsaved,
  restore,
}: {
  name: string;
  schema: v.GenericSchema<unknown, T>;
  unsaved: T | null;
  restore: (saved: T) => void;
}): void {
  const stored = useStoredOnce(name, (key) => readPersisted(key, schema));
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
