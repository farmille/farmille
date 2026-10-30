"use client";

import { useEffect, type EffectCallback } from "react";

/** マウント時に外部システムと同期し、アンマウント時に後片付けする。 */
export function useMountEffect(effect: EffectCallback): void {
  // マウント時だけ動かすので、依存配列は常に空にする
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
