"use client";

import { createContext, useContext } from "react";

import type { Requirement } from "./types";

type FieldContextValue = {
  required: boolean;
  /** Base UI の Field.Root の内側か。Field.Item・Field.Label・Field.Description は Field.Root の外では使えない。 */
  inRoot: boolean;
  /** ラベルを持たない Field が、自分でラベルを持つ Checkbox に必須/任意の札を任せるときだけ入る。 */
  requirement?: Requirement;
};

export const FieldContext = createContext<FieldContextValue>({ required: false, inRoot: false });

export function useFieldContext(): FieldContextValue {
  return useContext(FieldContext);
}

/** 囲む Field・Fieldset の requirement が "required" なら true。Field の外では false。 */
export function useFieldRequired(): boolean {
  return useContext(FieldContext).required;
}

/** 囲む Form が reset された回数。React は action の送信後にフォームを reset する。 */
export const FormResetContext = createContext(0);

/**
 * Base UI のチェック・ラジオ・セレクトは値を自分の state に持ち、送信用の隠し input だけが reset で初期値へ戻る。
 * reset のたびと初期値が変わったときに作り直し、画面と送信値を今の初期値（再表示した送信値）にそろえる。
 */
export function useResetKey(defaultKey: string): string {
  return `${useContext(FormResetContext)}:${defaultKey}`;
}
