"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

type ProductType = { id: string; name: string };

type Props = {
  types: ProductType[];
  selectedTypeId: string | null;
};

export function TypeFilter({ types, selectedTypeId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const select = (typeId: string | null) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (typeId) params.set("type_id", typeId);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const baseBtn =
    "rounded-sm border px-4 py-2 text-sm font-medium transition-colors";
  const activeBtn = "bg-primary text-primary-foreground border-primary";
  const inactiveBtn =
    "bg-card text-foreground border-border hover:bg-muted";

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        isPending && "opacity-60 pointer-events-none",
      )}
      role="group"
      aria-label="製品タイプフィルタ"
    >
      <button
        type="button"
        onClick={() => select(null)}
        className={cn(baseBtn, selectedTypeId === null ? activeBtn : inactiveBtn)}
      >
        すべて
      </button>
      {types.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => select(t.id)}
          className={cn(
            baseBtn,
            selectedTypeId === t.id ? activeBtn : inactiveBtn,
          )}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
