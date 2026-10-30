"use client";

import { useActionState, useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";

import { Button, EmptyState, MaterialCard } from "@/components";
import { Checkbox, Notice } from "@/components/form";
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

type SavedListProps = {
  items: readonly SavedMaterialItem[];
};

function SavedRow({
  item,
  selected,
  onToggle,
}: {
  item: SavedMaterialItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const [, unsave, pending] = useActionState(async (_previous: null, formData: FormData) => {
    await unsaveMaterialAction(item.materialId, formData);

    return null;
  }, null);

  return (
    <div className={row}>
      <Checkbox checked={selected} onCheckedChange={onToggle}>
        比較に含める
      </Checkbox>
      <MaterialCard
        variant="list"
        name={item.name}
        maker={item.manufacturerName}
        rating={item.avgRating}
        reviewCount={item.reviewCount}
        description={item.description ?? undefined}
        href={`/materials/${item.materialId}`}
        imageSrc={item.primaryImageUrl ?? undefined}
      />
      <form action={unsave}>
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          リストから外す
        </Button>
      </form>
    </div>
  );
}

export function SavedList({ items }: SavedListProps) {
  const router = useRouter();

  const [{ selected, error }, toggle] = useReducer(
    (state: { selected: string[]; error: string | null }, materialId: string) => {
      if (state.selected.includes(materialId)) {
        return { selected: state.selected.filter((id) => id !== materialId), error: null };
      }

      if (state.selected.length >= COMPARE_MATERIAL_LIMITS.max) {
        return { ...state, error: `比較は最大${COMPARE_MATERIAL_LIMITS.max}件までです。` };
      }

      return { selected: [...state.selected, materialId], error: null };
    },
    { selected: [], error: null },
  );

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
        description="資材詳細の保存ボタンからお気に入りへ追加できます。"
      />
    );
  }

  return (
    <div>
      <div className={stack}>
        {items.map((item) => (
          <SavedRow
            key={item.savedId}
            item={item}
            selected={selected.includes(item.materialId)}
            onToggle={() => toggle(item.materialId)}
          />
        ))}
      </div>

      <div className={footer}>
        {hint !== null ? (
          <p
            className={css({
              m: "0",
              mb: "2",
              textStyle: "supporting",
              color: "text.muted",
              textAlign: "center",
            })}
          >
            {hint}
          </p>
        ) : null}
        {error !== null ? (
          <Notice className={css({ mb: "2", textAlign: "center" })} tone="error">
            {error}
          </Notice>
        ) : null}
        <Button type="button" disabled={!canCompare} onClick={goCompare}>
          比較する
        </Button>
      </div>
    </div>
  );
}
