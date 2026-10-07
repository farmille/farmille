"use client";

import { useEffect, useState, useTransition } from "react";

import { Checkbox } from "@/components/Checkbox";
import { inputRecipe } from "@/components/Input";
import { OptimizedImage } from "@/components/OptimizedImage";
import { searchReportMaterialsAction } from "@/app/materials/[id]/report/new/actions";
import type { UsageReportFieldErrors, UsageReportInput } from "@/lib/usage-report";
import type { PostingMaterial } from "@/server/queries/materials";
import type { CropOption } from "@/server/queries/usage-report-form";

import { css, cva, cx } from "../../../../../../styled-system/css";

import { ReportSearchField } from "./ReportSearchField";
import {
  Badge,
  Example,
  Need,
  checkNote,
  checkRow,
  checkRowWithNote,
  chipRecipe,
  chips,
  field,
  fieldLabel,
  guide,
  pillButtonRecipe,
  subLabel,
} from "./ReportFormParts";

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
  "&:not(:first-child)": {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
  },
});

const treeHead = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  w: "full",
  border: "none",
  bg: "transparent",
  px: "3",
  py: "2",
  fontSize: "md",
  textAlign: "left",
  cursor: "pointer",
});

const treeArrow = cva({
  base: {
    fontSize: "xs",
    color: "primary.700",
    transitionProperty: "transform",
    transitionDuration: "fast",
  },
  variants: { open: { true: { transform: "rotate(90deg)" }, false: {} } },
});

const treeCount = css({ ml: "auto", fontSize: "sm", color: "text.subtle" });

const treeBody = css({ pt: "0.5", pr: "3", pb: "2.5", pl: "6.5" });

/** 「資材・作物」のステップ */
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
    const timer = setTimeout(() => {
      startSearch(async () => {
        try {
          const result = await searchReportMaterialsAction(query);
          if (result.ok) setMaterials(result.data.slice(0, 8));
          else onMessage("資材を検索できませんでした。");
        } catch {
          onMessage("資材を検索できませんでした。通信状態を確認してください。");
        }
      });
    }, 250);
    return () => clearTimeout(timer);
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
      <div>
        <div className={fieldLabel}>
          対象資材 <Badge required />
        </div>
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
              if (!value.trim()) setMaterials([]);
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
      </div>

      <div className={field}>
        <div className={fieldLabel}>
          使用作物 <Badge required />
          <Need message={errors.cropId} />
        </div>
        <div className={guide}>
          1つ選んでください。複数の作物で使った場合は、作物ごとに別のレポートにしてください。
        </div>
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
        {suggestions.length > 0 && (
          <div className={css({ mt: "2.5" })}>
            {suggestions.map((group) => (
              <div key={group.title}>
                <div className={subLabel}>{group.title}</div>
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
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className={cx(pillButtonRecipe(), css({ mt: "2.5" }))}
          aria-expanded={treeOpen}
          onClick={() => setTreeOpen(!treeOpen)}
        >
          {treeOpen ? "－ 作物一覧を閉じる" : "＋ 作物一覧から選択"}
        </button>
        {treeOpen && (
          <div className={tree}>
            {groups.map((group) => {
              const members = crops.filter((crop) => crop.groupName === group);
              const open = openGroups.has(group);
              return (
                <div key={group} className={treeGroup}>
                  <button
                    type="button"
                    className={treeHead}
                    aria-expanded={open}
                    onClick={() =>
                      setOpenGroups((current) => {
                        const next = new Set(current);
                        if (open) next.delete(group);
                        else next.add(group);
                        return next;
                      })
                    }
                  >
                    <span className={treeArrow({ open })}>▸</span>
                    <b>{group}</b>
                    <span className={treeCount}>{members.length}品目</span>
                  </button>
                  {open && (
                    <div className={treeBody}>
                      <div className={chips}>
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={field}>
        <label className={fieldLabel} htmlFor="report-variety">
          品種 <Badge required />
        </label>
        <Need message={errors.variety} block />
        <input
          id="report-variety"
          className={inputRecipe()}
          placeholder="品種名"
          disabled={input.varietyUnknown}
          value={input.variety}
          onChange={(event) => onChange({ ...input, variety: event.target.value })}
        />
        <Example>
          ・アイコ
          <br />
          ・桃太郎
          <br />
          ・とちおとめ
        </Example>
        <label className={cx(checkRow, checkRowWithNote, css({ mt: "2" }))}>
          <Checkbox
            checked={input.varietyUnknown}
            onChange={(event) =>
              onChange({
                ...input,
                varietyUnknown: event.target.checked,
                variety: event.target.checked ? "" : input.variety,
              })
            }
          />
          品種が不明、または品種がない
          <span className={checkNote}>チェックすると品種の記入は不要です</span>
        </label>
      </div>
    </>
  );
}
