"use client";

import { useRouter } from "next/navigation";
import { useEffect, type RefObject } from "react";

import type { SellerArticleFormState } from "@/app/dashboard/articles/_components/form-state";
import type { SellerArticleMaterial } from "@/server/queries/seller-articles";

export function useArticleCreatedNavigation(
  state: SellerArticleFormState,
  mode: "create" | "edit",
) {
  const router = useRouter();
  useEffect(() => {
    if (state.status === "success" && state.articleId !== undefined && mode === "create") {
      router.replace(`/dashboard/articles/${state.articleId}/edit`);
    }
  }, [mode, router, state]);
}

export function useArticleSearchFocus(
  input: RefObject<HTMLInputElement | null>,
  hits: SellerArticleMaterial[],
  pending: boolean,
) {
  useEffect(() => {
    if (!pending && hits.length > 0) input.current?.focus();
  }, [hits, input, pending]);
}
