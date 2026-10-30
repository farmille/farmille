"use client";

import { useEffect, useEffectEvent } from "react";

import type { ReviewActionState } from "@/app/materials/[id]/review/actions";
import type { createAuthBrowserClient } from "@/lib/auth/browser";

export function useReviewPhotoCleanup(
  state: ReviewActionState,
  supabase: ReturnType<typeof createAuthBrowserClient>,
  onFailure: (message: string) => void,
) {
  const reportFailure = useEffectEvent(onFailure);
  useEffect(() => {
    if (state.status === "idle") return;
    const settledState = state;
    let cancelled = false;
    async function finishAction() {
      if (settledState.cleanupPaths !== undefined && settledState.cleanupPaths.length > 0) {
        const { error } = await supabase.storage
          .from("review-photos")
          .remove(settledState.cleanupPaths);
        if (error !== null && !cancelled) {
          reportFailure(
            "一時アップロードした写真を削除できませんでした。再送信せずお待ちください。",
          );
        }
      }
    }
    void finishAction();
    return () => {
      cancelled = true;
    };
  }, [state, supabase]);
}

export function useReviewPhotoPreviews(previewUrls: string) {
  useEffect(() => {
    const urls = previewUrls.length === 0 ? [] : previewUrls.split("\n");
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);
}
