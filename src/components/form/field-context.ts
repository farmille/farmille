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
