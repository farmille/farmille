"use client";

import { createContext } from "react";

/** スマホの絞り込みシートで、開いた状態で出す区分の名前。null はどの区分も閉じて出す。 */
export const FilterFocusContext = createContext<string | null>(null);
