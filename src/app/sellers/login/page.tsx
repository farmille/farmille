import type { Metadata } from "next";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { SellerLoginPanel } from "@/app/sellers/login/SellerLoginPanel";
import { safeNextPath } from "@/lib/auth/safe-next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "メーカーログイン",
  robots: NO_INDEX_ROBOTS,
};

function destinationLabelOf(destination: string | null): string | null {
  if (destination === null) return null;
  if (destination.startsWith("/dashboard/applications/new/registration"))
    return "資材掲載・資材オーナー権限申請";
  if (destination.startsWith("/dashboard/applications/new/transfer_out"))
    return "資材オーナー権限の移行申請（現資材オーナー企業）";
  if (destination.startsWith("/dashboard/applications/new/transfer_in"))
    return "資材オーナー権限の移行申請（引き継ぎ先企業）";
  if (destination.startsWith("/dashboard/applications")) return "各種お手続き";
  if (destination.startsWith("/dashboard/materials")) return "製品情報の管理";
  if (destination.startsWith("/dashboard/profile")) return "メーカープロフィールの編集";
  if (destination.startsWith("/dashboard")) return "企業会員ダッシュボード";
  return null;
}

export default async function SellerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; password?: string }>;
}) {
  const { next, password } = await searchParams;
  const destination = safeNextPath(next);
  const destinationLabel = destinationLabelOf(destination);

  return (
    <MockPageShell title="メーカーログイン" backHref="/sellers">
      <SellerLoginPanel
        destinationLabel={destinationLabel}
        next={destination}
        passwordChanged={password === "changed"}
      />
    </MockPageShell>
  );
}
