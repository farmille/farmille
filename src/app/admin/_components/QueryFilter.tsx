"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FilterPills, type FilterPillOption } from "@/components";

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
  options: FilterPillOption[];
  param: string;
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <FilterPills
      aria-label={ariaLabel}
      onChange={(next) => {
        const params = new URLSearchParams(searchParams);
        params.set(param, next);
        router.push(`${pathname}?${params.toString()}`);
      }}
      options={options}
      value={value}
    />
  );
}
