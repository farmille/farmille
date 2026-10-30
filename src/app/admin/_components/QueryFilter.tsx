"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FilterPills } from "@/components";

/**
 * 一覧の絞り込みをクエリ文字列で持つためのラッパー。
 * 見た目はキットの FilterPills のまま、選択時に URL を書き換えてサーバー側で絞り込む。
 */
export function QueryFilter({
  ariaLabel,
  options,
  param,
  value,
}: {
  ariaLabel: string;
  options: readonly { value: string; label: string }[];
  param: string;
  value: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <FilterPills
      aria-label={ariaLabel}
      items={options.map((option) => {
        const params = new URLSearchParams(searchParams);
        params.set(param, option.value);

        return {
          href: `${pathname}?${params.toString()}`,
          label: option.label,
          current: option.value === value,
        };
      })}
    />
  );
}
