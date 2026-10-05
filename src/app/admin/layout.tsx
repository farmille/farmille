import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { requireAdmin } from "@/server/auth";

/**
 * metadata は描画と独立に解決されるため、page のガードで 404 にしても page のタイトル
 * （「資材の編集」等）が残り、運営画面の存在が分かってしまう。admin 以外のログインユーザーは
 * ここで notFound() を投げ、page の metadata を使わせない。未ログインと AAL1 の admin は
 * page 側のガードがリダイレクトする。
 */
export async function generateMetadata(): Promise<Metadata> {
  const session = await requireAdmin();
  if (!session.ok && session.error !== "unauthorized" && session.error !== "aal2_required") {
    notFound();
  }

  return { robots: NO_INDEX_ROBOTS };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
