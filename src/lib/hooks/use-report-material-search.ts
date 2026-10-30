"use client";

import { useEffect, useEffectEvent, useReducer, useTransition } from "react";
import { searchReportMaterialsAction } from "@/app/materials/[id]/report/new/actions";
import type { PostingMaterial } from "@/server/queries/materials";

export function useReportMaterialSearch(
  open: boolean,
  query: string,
  onMessage: (message: string) => void,
) {
  const [materials, setMaterials] = useReducer(
    (_current: PostingMaterial[], next: PostingMaterial[]) => next,
    [],
  );
  const [, startSearch] = useTransition();
  const showMessage = useEffectEvent(onMessage);
  useEffect(() => {
    const text = query.trim();
    if (!open || !text) return;
    let active = true;
    const timer = setTimeout(() => {
      startSearch(async () => {
        try {
          const result = await searchReportMaterialsAction(text);
          if (!active) return;
          if (result.ok) setMaterials(result.data.slice(0, 20));
          else showMessage("資材を検索できませんでした。");
        } catch {
          if (active) showMessage("資材を検索できませんでした。通信状態を確認してください。");
        }
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query]);
  return { materials, clearMaterials: () => setMaterials([]) };
}
