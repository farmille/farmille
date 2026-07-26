"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, EmptyState, MaterialCard } from "@/components";
import { COMPARE_MATERIAL_LIMITS } from "@/lib/compare-limits";
import type { SavedMaterialItem } from "@/server/queries/saved-materials";
import { css } from "../../../../styled-system/css";

import { unsaveMaterialAction } from "./actions";

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
});

const row = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  p: "3",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
});

const footer = css({
  position: "sticky",
  bottom: "0",
  mt: "4",
  py: "3",
  bg: "surface.panel",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});

const checkboxLabel = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  fontSize: "sm",
  fontWeight: "700",
  color: "text.muted",
  cursor: "pointer",
});

type SavedListProps = {
  items: readonly SavedMaterialItem[];
};

export function SavedList({ items }: SavedListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selected.length;
  const canCompare =
    selectedCount >= COMPARE_MATERIAL_LIMITS.min && selectedCount <= COMPARE_MATERIAL_LIMITS.max;

  const hint = useMemo(() => {
    if (items.length === 0) return null;
    if (selectedCount === 0) {
      return `比較する資材を${COMPARE_MATERIAL_LIMITS.min}〜${COMPARE_MATERIAL_LIMITS.max}件選んでください。`;
    }
    if (selectedCount < COMPARE_MATERIAL_LIMITS.min) {
      return `あと${COMPARE_MATERIAL_LIMITS.min - selectedCount}件選ぶと比較できます。`;
    }
    if (selectedCount > COMPARE_MATERIAL_LIMITS.max) {
      return `比較は最大${COMPARE_MATERIAL_LIMITS.max}件までです。`;
    }
    return `${selectedCount}件を比較できます。`;
  }, [items.length, selectedCount]);

  function toggle(materialId: string): void {
    setError(null);
    setSelected((current) => {
      if (current.includes(materialId)) {
        return current.filter((id) => id !== materialId);
      }
      if (current.length >= COMPARE_MATERIAL_LIMITS.max) {
        setError(`比較は最大${COMPARE_MATERIAL_LIMITS.max}件までです。`);
        return current;
      }
      return [...current, materialId];
    });
  }

  function goCompare(): void {
    if (!canCompare) return;
    const params = new URLSearchParams();
    params.set("ids", selected.join(","));
    router.push(`/me/saved/compare?${params.toString()}`);
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="保存した資材はまだありません"
        description="資材詳細の保存ボタンから検討リストへ追加できます。"
      />
    );
  }

  return (
    <div>
      <div className={stack}>
        {items.map((item) => (
          <div key={item.savedId} className={row}>
            <label className={checkboxLabel}>
              <input
                checked={selected.includes(item.materialId)}
                onChange={() => toggle(item.materialId)}
                type="checkbox"
              />
              比較に含める
            </label>
            <MaterialCard
              variant="list"
              name={item.name}
              maker={item.manufacturerName}
              rating={item.avgRating ?? 0}
              reviewCount={item.reviewCount}
              official={item.official}
              description={item.description ?? undefined}
              href={`/materials/${item.materialId}`}
              imageSrc={item.primaryImageUrl ?? undefined}
            />
            <form action={unsaveMaterialAction.bind(null, item.materialId)}>
              <Button type="submit" variant="danger" size="sm">
                リストから外す
              </Button>
            </form>
          </div>
        ))}
      </div>

      <div className={footer}>
        {hint !== null ? (
          <p
            className={css({
              m: "0",
              mb: "2",
              fontSize: "sm",
              color: "text.muted",
              textAlign: "center",
            })}
          >
            {hint}
          </p>
        ) : null}
        {error !== null ? (
          <p
            className={css({
              m: "0",
              mb: "2",
              fontSize: "sm",
              color: "accent.warn",
              fontWeight: "700",
              textAlign: "center",
            })}
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button type="button" disabled={!canCompare} onClick={goCompare}>
          比較する
        </Button>
      </div>
    </div>
  );
}
