"use client";

import { Button, FormPageShell, SurfaceCard } from "@/components";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function DashboardError({ unstable_retry }: DashboardErrorProps) {
  return (
    <FormPageShell backHref="/" title="出品者ダッシュボード">
      <SurfaceCard
        description="時間をおいてから、もう一度お試しください。"
        title="ダッシュボードを表示できませんでした"
      >
        <Button onClick={unstable_retry} type="button" variant="ghost">
          もう一度試す
        </Button>
      </SurfaceCard>
    </FormPageShell>
  );
}
