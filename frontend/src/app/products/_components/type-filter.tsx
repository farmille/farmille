"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type ProductType = { id: string; name: string };

type Props = {
  types: ProductType[];
  selectedTypeId: string | null;
};

// design-tokens v2: pill-style filter chips. Selected = solid green,
// unselected = soft green-subtle background. Preserves other URL params
// (q / crop_id) when toggling so search and crop filters survive.
export function TypeFilter({ types, selectedTypeId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const select = (typeId: string | null) => {
    if (typeId) {
      trackEvent({ name: "filter_apply", params: { filter_type: "type" } });
    }
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (typeId) {
        params.set("type_id", typeId);
      } else {
        params.delete("type_id");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        isPending && "opacity-60 pointer-events-none",
      )}
      role="group"
      aria-label="製品タイプフィルタ"
    >
      <span className="text-xs font-medium text-muted-foreground pr-1">
        タイプ:
      </span>
      <PillButton
        active={selectedTypeId === null}
        onClick={() => select(null)}
        label="すべて"
      />
      {types.map((t) => (
        <PillButton
          key={t.id}
          active={selectedTypeId === t.id}
          onClick={() => select(t.id)}
          label={t.name}
        />
      ))}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-1.5 text-sm font-medium"
      style={{
        borderRadius: "var(--radius-full)",
        transition: "var(--transition-fast)",
        backgroundColor: active
          ? "var(--green-primary)"
          : "var(--green-subtle)",
        color: active ? "#ffffff" : "var(--green-dark)",
        border: active
          ? "1px solid var(--green-primary)"
          : "1px solid transparent",
      }}
    >
      {label}
    </button>
  );
}
