"use client";

import { useEffect, useState, useTransition } from "react";

import { OptimizedImage } from "@/components/OptimizedImage";
import { searchReportMaterialsAction } from "@/app/materials/[id]/report/new/actions";
import type { UsageReportFieldErrors, UsageReportInput } from "@/lib/usage-report";
import type { PostingMaterial } from "@/server/queries/materials";
import type { CropOption } from "@/server/queries/usage-report-form";

import { MockSearch } from "./MockSearch";
import { Badge, Need } from "./ReportFormParts";

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

/** 見本の pane 1「資材・作物」 */
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
  const suggestionGroups = [
    {
      title: "この資材に登録されている主な作物",
      ids: input.materialId === pageMaterialId ? materialCropIds.slice(0, 8) : [],
    },
    {
      title: "主な作物として登録している作物",
      ids: favoriteCropIds.filter((id) => !materialCropIds.includes(id)),
    },
  ].map((group) => ({
    ...group,
    crops: crops.filter((crop) => group.ids.includes(crop.id) && crop.id !== input.cropId),
  }));
  const groups = [...new Set(crops.map((crop) => crop.groupName))];
  function pickCrop(cropId: string) {
    onChange({ ...input, cropId });
    setCropQuery("");
    setTreeOpen(false);
  }

  return (
    <>
      <div className="field" style={{ marginTop: 0 }}>
        <label>
          対象資材 <Badge required />
        </label>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: "var(--panel)",
              display: "grid",
              placeItems: "center",
              fontSize: 9,
              color: "var(--ink-3)",
              flex: "0 0 auto",
              overflow: "hidden",
            }}
          >
            {material.imageUrl ? (
              <OptimizedImage
                src={material.imageUrl}
                alt=""
                width={48}
                height={48}
                sizes="48px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              "NO IMAGE"
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{material.name}</b>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{material.manufacturerName}</div>
          </div>
          <button
            type="button"
            className="mini"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen(!searchOpen)}
          >
            変更
          </button>
        </div>
        {searchOpen && (
          <MockSearch
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
              content: (
                <>
                  <span className="nm">{item.name}</span>
                  <span className="al">{item.manufacturer_name}</span>
                </>
              ),
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

      <div className="field">
        <label>
          使用作物 <Badge required />
          <Need message={errors.cropId} />
        </label>
        <div className="guide">
          1つ選んでください。複数の作物で使った場合は、作物ごとに別のレポートにしてください。
        </div>
        <div className="chips" style={{ marginBottom: 8 }} aria-live="polite">
          {selectedCrop && (
            <span className="chip sel">
              <span className="cat-mini">作物</span>
              {selectedCrop.name}
              <button
                type="button"
                className="rm"
                aria-label={`${selectedCrop.name}を外す`}
                onClick={() => onChange({ ...input, cropId: null })}
              >
                ×
              </button>
            </span>
          )}
        </div>
        <MockSearch
          ariaLabel="作目"
          placeholder="作物名で検索　例）トマト、みかん"
          value={cropQuery}
          onValueChange={setCropQuery}
          items={cropHits.map(({ crop, alias }) => ({
            value: crop.id,
            label: `${crop.name} ${crop.groupName}`,
            content: (
              <>
                <span className="cat">{crop.groupName}</span>
                <span className="nm">{crop.name}</span>
                {alias && <span className="al">別名: {alias}</span>}
              </>
            ),
          }))}
          emptyMessage={`「${cropQuery.trim()}」に一致する作物がありません`}
          onSelect={pickCrop}
        />
        <div className="sug">
          {suggestionGroups
            .filter((group) => group.crops.length > 0)
            .map((group) => (
              <div key={group.title}>
                <div className="sl">{group.title}</div>
                <div className="chips">
                  {group.crops.map((crop) => (
                    <button
                      key={crop.id}
                      type="button"
                      className="chip"
                      onClick={() => pickCrop(crop.id)}
                    >
                      {crop.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <button
            type="button"
            className="mini"
            aria-expanded={treeOpen}
            onClick={() => setTreeOpen(!treeOpen)}
          >
            {treeOpen ? "－ 作物一覧を閉じる" : "＋ 作物一覧から選択"}
          </button>
        </div>
        {treeOpen && (
          <div className="tree">
            {groups.map((group) => {
              const members = crops.filter((crop) => crop.groupName === group);
              const open = openGroups.has(group);
              return (
                <div key={group} className="tr-g">
                  <button
                    type="button"
                    className={open ? "tr-gh open" : "tr-gh"}
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
                    <span className="tr-arrow">▸</span>
                    <b>{group}</b>
                    <span className="muted">{members.length}品目</span>
                  </button>
                  {open && (
                    <div className="tr-gb">
                      <div className="chips">
                        {members.map((crop) => (
                          <button
                            key={crop.id}
                            type="button"
                            className="chip"
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

      <div className="field">
        <label htmlFor="report-variety">
          品種 <Badge />
        </label>
        <input
          id="report-variety"
          className="input"
          placeholder="品種名"
          disabled={input.varietyUnknown}
          value={input.variety}
          onChange={(event) => onChange({ ...input, variety: event.target.value })}
        />
        <div className="example">
          <b>記入例</b>・アイコ
          <br />
          ・桃太郎
          <br />
          ・とちおとめ
        </div>
        <label className="check" style={{ marginTop: 8 }}>
          <input
            type="checkbox"
            checked={input.varietyUnknown}
            onChange={(event) =>
              onChange({
                ...input,
                varietyUnknown: event.target.checked,
                variety: event.target.checked ? "" : input.variety,
              })
            }
          />{" "}
          品種が不明、または品種がない
          <span className="muted">チェックすると品種の記入は不要です</span>
        </label>
      </div>
    </>
  );
}
