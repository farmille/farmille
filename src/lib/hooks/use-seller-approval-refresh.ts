"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SellerActionState } from "@/app/admin/_lib/action-state";

export function useSellerApprovalRefresh(status: SellerActionState["status"]) {
  const router = useRouter();
  useEffect(() => {
    // RSCだけを更新し、初期パスワードを持つクライアント状態を保持する。
    if (status === "approved") router.refresh();
  }, [router, status]);
}
