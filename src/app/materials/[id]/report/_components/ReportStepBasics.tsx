"use client";

import { useEffect, useState, useTransition } from "react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
import { Checkbox, Field, Fieldset, Input, Notice } from "@/components/form";
import { OptimizedImage } from "@/components/OptimizedImage";
import { searchReportMaterialsAction } from "@/app/materials/[id]/report/new/actions";
import type { UsageReportFieldErrors, UsageReportInput } from "@/lib/usage-report";
import type { PostingMaterial } from "@/server/queries/materials";
import type { CropOption } from "@/server/queries/usage-report-form";

import { css, cx } from "../../../../../../styled-system/css";

import { ReportSearchField } from "./ReportSearchField";
import { chipRecipe, chips, pillButtonRecipe } from "./ReportFormParts";

export type ReportMaterialSummary = {
  id: string;
  name: string;
  manufacturerName: string;
  imageUrl: string | null;
};

function cropMatches(crop: CropOption, query: string) {
  const q = query.trim().toLocaleLowerCase("ja");
  const alias = crop.aliases.find((item) => item.toLocaleLowerCase("ja").includes(q));
  return crop.name.toLocaleLowerCase("ja").includes(q) || alias !== undefined
    ? { crop, alias: crop.name.toLocaleLowerCase("ja").includes(q) ? undefined : alias }
    : null;
}

const materialCard = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  px: "3.5",
  py: "3",
});

const thumb = css({
  flex: "0 0 auto",
  display: "grid",
  placeItems: "center",
  w: "12",
  h: "12",
  overflow: "hidden",
  borderRadius: "button",
  bg: "surface.panel",
  fontSize: "2xs",
  color: "text.subtle",
});

const thumbImage = css({ objectFit: "cover" });

const materialText = css({ flex: "1", minW: "0" });

const manufacturer = css({ fontSize: "sm", color: "text.subtle" });

const chipCategory = css({
  mr: "1.5",
  borderRadius: "pill",
  bg: "surface.card",
  px: "1.5",
  fontSize: "xs",
  color: "primary.800",
});

const removeButton = css({
  ml: "2",
  border: "none",
  bg: "transparent",
  p: "0",
  color: "primary.800",
  opacity: "0.7",
  cursor: "pointer",
});

const tree = css({
  mt: "2",
  maxH: "96",
  overflow: "auto",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
});

const treeGroup = css({
  px: "3",
  "&:not(:first-child)": {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
  },
});

const treeCount = css({ fontSize: "sm", fontWeight: "normal", color: "text.subtle" });

const treeBody = css({ pt: "0.5", pb: "2.5" });

export function ReportStepBasics({
  input,
  onChange,
  errors,
  material,
  pageMaterialId,
  onMaterialChange,
  crops,
  favoriteCropIds,
  materialCropIds,
  onMessage,
}: {
  input: UsageReportInput;
  onChange: (input: UsageReportInput) => void;
  errors: UsageReportFieldErrors;
  material: ReportMaterialSummary;
  pageMaterialId: string;
  onMaterialChange: (material: ReportMaterialSummary) => void;
  crops: CropOption[];
  favoriteCropIds: string[];
  materialCropIds: string[];
  onMessage: (message: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [materialQuery, setMaterialQuery] = useState("");
  const [materials, setMaterials] = useState<PostingMaterial[]>([]);
  const [, startSearch] = useTransition();
  const [cropQuery, setCropQuery] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const query = materialQuery.trim();
    if (!query) return;
    let active = true;
    const timer = setTimeout(() => {
      startSearch(async () => {
        try {
          const result = await searchReportMaterialsAction(query);
          if (!active) return;
          if (result.ok) setMaterials(result.data.slice(0, 8));
          else onMessage("資材を検索できませんでした。");
        } catch {
          if (!active) return;
          onMessage("資材を検索できませんでした。通信状態を確認してください。");
        }
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [materialQuery, onMessage]);

  const selectedCrop = crops.find((crop) => crop.id === input.cropId);
  const cropHits = cropQuery.trim()
    ? crops
        .flatMap((crop) => cropMatches(crop, cropQuery) ?? [])
        .toSorted(
          (a, b) =>
            Number(!a.crop.name.startsWith(cropQuery.trim())) -
            Number(!b.crop.name.startsWith(cropQuery.trim())),
        )
        .slice(0, 10)
    : [];
  const suggestions = [
    {
      title: "この資材に登録されている主な作物",
      ids: input.materialId === pageMaterialId ? materialCropIds.slice(0, 8) : [],
    },
    {
      title: "主な作物として登録している作物",
      ids: favoriteCropIds.filter((id) => !materialCropIds.includes(id)),
    },
  ]
    .map((group) => ({
      ...group,
      crops: crops.filter((crop) => group.ids.includes(crop.id) && crop.id !== input.cropId),
    }))
    .filter((group) => group.crops.length > 0);
  const groups = [...new Set(crops.map((crop) => crop.groupName))];
  function pickCrop(cropId: string) {
    onChange({ ...input, cropId });
    setCropQuery("");
    setTreeOpen(false);
  }

  return (
    <>
      <Fieldset legend="対象資材" requirement="required">
        <div className={materialCard}>
          <div className={thumb}>
            {material.imageUrl ? (
              <OptimizedImage
                src={material.imageUrl}
                alt=""
                width={48}
                height={48}
                sizes="48px"
                className={thumbImage}
              />
            ) : (
              "NO IMAGE"
            )}
          </div>
          <div className={materialText}>
            <b>{material.name}</b>
            <div className={manufacturer}>{material.manufacturerName}</div>
          </div>
          <button
            type="button"
            className={pillButtonRecipe()}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen(!searchOpen)}
          >
            変更
          </button>
        </div>
        {searchOpen && (
          <ReportSearchField
            ariaLabel="資材を検索"
            placeholder="資材名・メーカー名で検索"
            value={materialQuery}
            onValueChange={(value) => {
              setMaterialQuery(value);
              setMaterials([]);
            }}
            items={materials.map((item) => ({
              value: item.id,
              label: `${item.name} ${item.manufacturer_name}`,
              name: item.name,
              note: item.manufacturer_name,
            }))}
            emptyMessage="見つかりません。"
            onSelect={(id) => {
              const item = materials.find((candidate) => candidate.id === id);
              if (!item) return;
              onMaterialChange({
                id: item.id,
                name: item.name,
                manufacturerName: item.manufacturer_name,
                imageUrl: null,
              });
              setSearchOpen(false);
              setMaterialQuery("");
            }}
          />
        )}
      </Fieldset>

      <Fieldset
        legend="使用作物"
        requirement="required"
        lead="1つ選んでください。複数の作物で使った場合は、作物ごとに別のレポートにしてください。"
        error={errors.cropId}
      >
        <div className={cx(chips, css({ mb: "2" }))} aria-live="polite">
          {selectedCrop && (
            <span className={chipRecipe({ state: "selected" })}>
              <span className={chipCategory}>作物</span>
              {selectedCrop.name}
              <button
                type="button"
                className={removeButton}
                aria-label={`${selectedCrop.name}を外す`}
                onClick={() => onChange({ ...input, cropId: null })}
              >
                ×
              </button>
            </span>
          )}
        </div>
        <ReportSearchField
          ariaLabel="作目"
          placeholder="作物名で検索　例）トマト、みかん"
          value={cropQuery}
          onValueChange={setCropQuery}
          items={cropHits.map(({ crop, alias }) => ({
            value: crop.id,
            label: `${crop.name} ${crop.groupName}`,
            name: crop.name,
            category: crop.groupName,
            note: alias && `別名: ${alias}`,
          }))}
          emptyMessage={`「${cropQuery.trim()}」に一致する作物がありません`}
          onSelect={pickCrop}
        />
        {suggestions.map((group) => (
          <Fieldset key={group.title} legend={group.title} labelSize="sm">
            <div className={chips}>
              {group.crops.map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  className={chipRecipe({ size: "sm" })}
                  onClick={() => pickCrop(crop.id)}
                >
                  {crop.name}
                </button>
              ))}
            </div>
          </Fieldset>
        ))}
        <Collapsible open={treeOpen} onOpenChange={setTreeOpen} className={css({ mt: "2.5" })}>
          <CollapsibleTrigger variant="link">作物一覧から選択</CollapsibleTrigger>
          <CollapsiblePanel>
            <div className={tree}>
              {groups.map((group) => {
                const members = crops.filter((crop) => crop.groupName === group);
                return (
                  <Collapsible
                    key={group}
                    className={treeGroup}
                    open={openGroups.has(group)}
                    onOpenChange={(open) =>
                      setOpenGroups((current) => {
                        const next = new Set(current);
                        if (open) next.add(group);
                        else next.delete(group);
                        return next;
                      })
                    }
                  >
                    <CollapsibleTrigger>
                      {group}
                      <span className={treeCount}>{members.length}品目</span>
                    </CollapsibleTrigger>
                    <CollapsiblePanel>
                      <div className={cx(chips, treeBody)}>
                        {members.map((crop) => (
                          <button
                            key={crop.id}
                            type="button"
                            className={chipRecipe({ size: "xs" })}
                            onClick={() => pickCrop(crop.id)}
                          >
                            {crop.name}
                          </button>
                        ))}
                      </div>
                    </CollapsiblePanel>
                  </Collapsible>
                );
              })}
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </Fieldset>

      <Field label="品種" requirement="required" error={errors.variety}>
        <Input
          placeholder="品種名"
          disabled={input.varietyUnknown}
          value={input.variety}
          onChange={(event) => onChange({ ...input, variety: event.target.value })}
        />
      </Field>
      <Notice tone="neutral" title="記入例" className={css({ mt: "2" })}>
        ・アイコ
        <br />
        ・桃太郎
        <br />
        ・とちおとめ
      </Notice>
      <Checkbox
        variant="row"
        className={css({ mt: "2" })}
        description="チェックすると品種の記入は不要です"
        checked={input.varietyUnknown}
        onCheckedChange={(varietyUnknown) =>
          onChange({ ...input, varietyUnknown, variety: varietyUnknown ? "" : input.variety })
        }
      >
        品種が不明、または品種がない
      </Checkbox>
    </>
  );
}
