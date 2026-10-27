"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";

import { Checkbox, Input, Notice, SearchInput, Select } from "@/components/form";
import { DialogClose, Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { TextLink } from "@/components/TextLink";
import { ToggleGroup } from "@/components/ToggleGroup";
import {
  findOtherReportForMaterialAction,
  getReportMaterialClassificationsAction,
  searchReportMaterialsAction,
} from "@/app/materials/[id]/report/new/actions";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import { withSingleVariety, type UsageReportInput } from "@/lib/usage-report";
import { reportPlotEdits, withAutoPlotNames } from "@/lib/usage-report-plots";
import type { PostingMaterial } from "@/server/queries/materials";
import type { CropOption } from "@/server/queries/usage-report-form";

import { css, cva } from "../../../../../../styled-system/css";

import { ReportPdfReadingMark } from "./ReportPdfReadingMark";
import {
  latestRequests,
  REPORT_SHORT_MAX,
  type ReportMarkField,
  type ReportMaterialSummary,
} from "./report-page-state";

export type ReportEffectOption = { id: string; name: string; categoryName: string };

type Picker = "" | "material" | "crop" | "purpose" | "stages";

const list = css({ display: "grid", gap: "1.5" });

const row = css({
  display: "grid",
  gridTemplateColumns: "[6.5em minmax(0, 1fr)]",
  columnGap: "2.5",
  alignItems: "center",
  scrollMarginTop: "20",
});

const key = css({
  fontWeight: "bold",
  textStyle: "body",
  color: "text.default",
  whiteSpace: "nowrap",
});

const mark = css({ ml: "0.5", color: "accent.danger", fontWeight: "normal" });

const readMark = css({ gridColumn: "2" });

const valueRecipe = cva({
  base: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: "1",
    columnGap: "2.5",
    minW: "0",
    minH: "10",
    px: "3",
    py: "1.5",
    borderRadius: "input",
    bg: "surface.panel",
    textStyle: "body",
    color: "text.default",
    textAlign: "start",
  },
  variants: {
    kind: {
      button: {
        w: "full",
        pr: "8",
        border: "none",
        cursor: "pointer",
        _hover: { bg: "border.default" },
        _focusVisible: { outlineWidth: "2px", outlineStyle: "solid", outlineColor: "primary.700" },
      },
      field: {},
      fixed: { bg: "transparent", px: "0.5" },
    },
    missing: {
      true: { boxShadow: "[inset 0 0 0 1.5px {colors.accent.danger}]" },
      false: {},
    },
  },
  defaultVariants: { kind: "button", missing: false },
});

const chevron = css({
  position: "absolute",
  right: "2",
  top: "[50%]",
  transform: "translateY(-50%)",
  color: "text.muted",
});

const empty = css({ color: "text.muted" });

const sub = css({ textStyle: "supporting", color: "text.muted" });

const line = css({ display: "block", flexBasis: "full" });

// 折り返す幅の 7em を、欄の文字の大きさで測る（行の文字より大きいので、外枠にも同じ大きさを置く）
const inlineField = css({
  flex: "[1 1 7em]",
  minW: "0",
  fontSize: "md",
  _touch: { fontSize: "lg" },
});

const listHead = css({
  px: "1",
  pt: "3.5",
  pb: "1",
  textStyle: "supporting",
  fontWeight: "bold",
  color: "text.muted",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

const itemRecipe = cva({
  base: {
    display: "block",
    w: "full",
    px: "1",
    py: "2.5",
    border: "none",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.default",
    bg: "transparent",
    textAlign: "start",
    textStyle: "body",
    color: "text.default",
    cursor: "pointer",
    _hover: { bg: "surface.panel" },
  },
  variants: { current: { true: { color: "text.brand", fontWeight: "bold" }, false: {} } },
});

const note = css({ m: "0", mt: "1.5", textStyle: "supporting", color: "text.muted" });

const group = css({
  mt: "3.5",
  mb: "1.5",
  textStyle: "supporting",
  fontWeight: "bold",
  color: "text.muted",
});

const searchBox = css({
  position: "sticky",
  top: "0",
  zIndex: "local.1",
  bg: "surface.card",
  pb: "1",
});

const stages = css({ pt: "1" });

const doneButton = css({ w: "auto", minW: "button.sm" });

function Row({
  id,
  label,
  required,
  marks = [],
  children,
}: {
  id: string;
  label: string;
  required: boolean;
  /** PDF読み取りの印を出す欄。 */
  marks?: ReportMarkField[];
  children: ReactNode;
}) {
  return (
    <div className={row} id={id}>
      <div className={key}>
        {label}
        {required && (
          <span className={mark} aria-label="必須">
            *
          </span>
        )}
      </div>
      {children}
      <div className={readMark}>
        <ReportPdfReadingMark fields={marks} />
      </div>
    </div>
  );
}

function cropMatches(crop: CropOption, query: string) {
  const q = query.normalize("NFKC").trim().toLocaleLowerCase("ja");
  return (
    crop.name.toLocaleLowerCase("ja").includes(q) ||
    crop.aliases.some((alias) => alias.toLocaleLowerCase("ja").includes(q))
  );
}

/** 属性：「項目　値」の行。選ぶものは押すと画面中央のポップアップが開く。 */
export function ReportPageProperties({
  input,
  onChange,
  missing,
  material,
  pageMaterialId,
  onMaterialChange,
  crops,
  favoriteCropIds,
  materialCropIds,
  effects,
  materialEffectNames,
  authorName,
  onMessage,
}: {
  input: UsageReportInput;
  onChange: (next: (current: UsageReportInput) => UsageReportInput) => void;
  missing: ReadonlySet<string>;
  material: ReportMaterialSummary;
  pageMaterialId: string;
  onMaterialChange: (material: ReportMaterialSummary) => void;
  crops: CropOption[];
  favoriteCropIds: string[];
  materialCropIds: string[];
  effects: ReportEffectOption[];
  materialEffectNames: string[];
  authorName: string;
  onMessage: (message: string) => void;
}) {
  const [picker, setPicker] = useState<Picker>("");
  const [query, setQuery] = useState("");
  const [materials, setMaterials] = useState<PostingMaterial[]>([]);
  const [materialChecks] = useState(latestRequests);
  const closeMaterialPicker = () => {
    materialChecks.cancel();
    setPicker("");
  };
  // 選んだ資材に同じ利用者の下書きか確認中のレポートがあって、切り替えなかった資材
  const [blocked, setBlocked] = useState<{
    material: PostingMaterial;
    report: "draft" | "pending";
  } | null>(null);
  // 資材ごとの登録作物と効果。資材を選び直したら、その資材の分を読み込んで足す
  const [classes, setClasses] = useState(
    () =>
      new Map([[pageMaterialId, { cropIds: materialCropIds, effectNames: materialEffectNames }]]),
  );
  const [, startSearch] = useTransition();

  useEffect(() => {
    const text = query.trim();
    if (picker !== "material" || !text) return;
    let active = true;
    const timer = setTimeout(() => {
      startSearch(async () => {
        try {
          const result = await searchReportMaterialsAction(text);
          if (!active) return;
          if (result.ok) setMaterials(result.data.slice(0, 20));
          else onMessage("資材を検索できませんでした。");
        } catch {
          if (active) onMessage("資材を検索できませんでした。通信状態を確認してください。");
        }
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [picker, query, onMessage]);

  async function loadClasses(materialId: string) {
    if (classes.has(materialId)) return;
    try {
      const result = await getReportMaterialClassificationsAction(materialId);
      if (result.ok) setClasses((current) => new Map(current).set(materialId, result.data));
      else onMessage("選んだ資材の登録作物と効果を読み込めませんでした。");
    } catch {
      onMessage("選んだ資材の登録作物と効果を読み込めませんでした。通信状態を確認してください。");
    }
  }

  async function pickMaterial(item: PostingMaterial) {
    // 確かめている間に別の資材を押すと応答が前後するので、最後に押した資材の応答だけを使う
    const request = materialChecks.start();
    setBlocked(null);
    try {
      const result = await findOtherReportForMaterialAction(item.id, input.reportId);
      if (!materialChecks.isLatest(request)) return;
      if (!result.ok) {
        onMessage("選んだ資材のレポートを確かめられませんでした。");
        return;
      }
      if (result.data !== null) {
        setBlocked({ material: item, report: result.data });
        return;
      }
    } catch {
      if (materialChecks.isLatest(request))
        onMessage("選んだ資材のレポートを確かめられませんでした。通信状態を確認してください。");
      return;
    }
    onMaterialChange({ id: item.id, name: item.name, manufacturerName: item.manufacturer_name });
    setPicker("");
    void loadClasses(item.id);
  }

  function open(next: Picker) {
    // 控えから戻した資材は、まだ登録作物と効果を読んでいないので、候補を開くときに読む
    if (next === "crop" || next === "purpose") void loadClasses(input.materialId);
    setBlocked(null);
    setQuery("");
    setMaterials([]);
    setPicker(next);
  }

  const crop = crops.find((item) => item.id === input.cropId);
  const own = classes.get(input.materialId);
  const fromMaterial = crops.filter((item) => own !== undefined && own.cropIds.includes(item.id));
  const mine = crops.filter(
    (item) => favoriteCropIds.includes(item.id) && !fromMaterial.some((x) => x.id === item.id),
  );
  const ownEffects = own?.effectNames ?? [];
  const effectGroups = [...new Set(effects.map((effect) => effect.categoryName))];
  const effectOption = (name: string) => ({ value: name, label: name });
  // 組ごとの ToggleGroup が返すのはその組の選択だけなので、ほかの組の選択は残して入れ替える
  const toggleEffects = (names: string[], selected: string[]) => {
    onChange((current) => ({
      ...current,
      purposeTags: [...current.purposeTags.filter((tag) => !names.includes(tag)), ...selected],
    }));
  };
  const cropRow = (item: CropOption, group = "") => (
    <button
      key={`${group}:${item.id}`}
      type="button"
      className={itemRecipe({ current: item.id === input.cropId })}
      onClick={() => {
        onChange((current) => ({ ...current, cropId: item.id }));
        setPicker("");
      }}
    >
      {item.name}
      {item.id === input.cropId ? <Icon name="check" size="xs" /> : null}
      {item.aliases.length > 0 && (
        <span className={css({ display: "block", textStyle: "supporting", color: "text.muted" })}>
          {item.aliases.join("・")}
        </span>
      )}
    </button>
  );

  return (
    <div className={list}>
      <Row id="report-prop-material" label="資材" required>
        <button
          type="button"
          className={valueRecipe({ missing: missing.has("materialId") })}
          aria-label={`資材：${material.name}`}
          onClick={() => open("material")}
        >
          <span>{material.name}</span>
          <span className={sub}>{material.manufacturerName}</span>
          <Icon name="chevron_right" className={chevron} />
        </button>
      </Row>
      <Row id="report-prop-crop" label="作物" required marks={[{ key: "cropId" }]}>
        <button
          type="button"
          className={valueRecipe({ missing: missing.has("cropId") })}
          aria-label={`作物：${crop?.name ?? "未選択"}`}
          onClick={() => open("crop")}
        >
          {crop ? <span>{crop.name}</span> : <span className={empty}>作物を選ぶ</span>}
          <Icon name="chevron_right" className={chevron} />
        </button>
      </Row>
      <Row
        id="report-prop-variety"
        label="品種"
        required
        marks={input.varieties.map(({ id, name }) => ({
          key: `varieties.${id}.name`,
          label: name.trim() || "品種",
        }))}
      >
        <div className={valueRecipe({ kind: "field", missing: missing.has("variety") })}>
          {!input.varietyUnknown &&
            (input.varieties.length > 0 ? input.varieties : [null]).map((variety, index) => (
              <Input
                key={variety?.id ?? "new"}
                label={input.varieties.length > 1 ? `品種${index + 1}` : "品種"}
                hideLabel
                size="inline"
                fieldClassName={inlineField}
                maxLength={REPORT_SHORT_MAX}
                placeholder="例）アイコ"
                value={variety?.name ?? ""}
                onChange={(event) => {
                  const name = event.target.value;
                  onChange((current) =>
                    variety === null
                      ? withAutoPlotNames(
                          current,
                          withSingleVariety(current, name, false),
                          material.name,
                        )
                      : reportPlotEdits.renameVariety(current, variety.id, name, material.name),
                  );
                }}
              />
            ))}
          {input.varieties.length <= 1 && (
            <Checkbox
              size="sm"
              checked={input.varietyUnknown}
              onCheckedChange={(varietyUnknown) =>
                onChange((current) =>
                  reportPlotEdits.setVarietyUnknown(current, varietyUnknown, material.name),
                )
              }
            >
              不明・なし
            </Checkbox>
          )}
        </div>
      </Row>
      <Row id="report-prop-purpose" label="使用目的" required marks={[{ key: "purposeTags" }]}>
        <button
          type="button"
          className={valueRecipe({ missing: missing.has("purposeTags") })}
          aria-label={`使用目的：${input.purposeTags.join("、") || "未選択"}`}
          onClick={() => open("purpose")}
        >
          {input.purposeTags.length > 0 ? (
            <>
              {input.purposeTags.map((tag) => (
                <span key={tag} className={line}>
                  {tag}
                </span>
              ))}
              {input.purposeNote.trim() && (
                <span className={`${line} ${sub}`}>補足：{input.purposeNote}</span>
              )}
            </>
          ) : (
            <span className={empty}>期待した効果を選ぶ</span>
          )}
          <Icon name="chevron_right" className={chevron} />
        </button>
      </Row>
      <Row id="report-prop-region" label="地域" required marks={[{ key: "prefectureCode" }]}>
        <div className={valueRecipe({ kind: "field", missing: missing.has("prefectureCode") })}>
          <Select
            label="都道府県"
            hideLabel
            size="sm"
            placeholder="都道府県"
            options={PREFECTURES.map((item) => ({ value: String(item.code), label: item.name }))}
            value={input.prefectureCode === null ? null : String(input.prefectureCode)}
            onValueChange={(value) =>
              onChange((current) => ({
                ...current,
                prefectureCode: value === null ? null : Number(value),
              }))
            }
          />
          {input.showCity && (
            <Input
              label="市区町村"
              hideLabel
              size="inline"
              fieldClassName={inlineField}
              maxLength={REPORT_SHORT_MAX}
              placeholder="市区町村"
              value={input.city}
              onChange={(event) =>
                onChange((current) => ({ ...current, city: event.target.value }))
              }
            />
          )}
          <Checkbox
            size="sm"
            checked={input.showCity}
            onCheckedChange={(showCity) => onChange((current) => ({ ...current, showCity }))}
          >
            市区町村も表示
          </Checkbox>
        </div>
      </Row>
      <Row id="report-prop-stages" label="施用時期" required marks={[{ key: "timingStages" }]}>
        <button
          type="button"
          className={valueRecipe({ missing: missing.has("timingStages") })}
          aria-label={`施用時期：${input.timingStages.length > 0 ? `${input.timingStages.length}段階` : "未選択"}`}
          onClick={() => open("stages")}
        >
          {input.timingStages.length > 0 ? (
            input.timingStages
              .toSorted((a, b) => a - b)
              .map((stage) => (
                <span key={stage} className={line}>
                  {APPLICATION_TIMINGS[stage]}
                </span>
              ))
          ) : (
            <span className={empty}>資材を使った段階を選ぶ</span>
          )}
          <Icon name="chevron_right" className={chevron} />
        </button>
      </Row>
      <Row id="report-prop-author" label="投稿者名" required={false}>
        <div className={valueRecipe({ kind: "fixed" })}>
          <span>{authorName}</span>
          <span className={sub}>アカウントのニックネーム。変更はマイページから</span>
        </div>
      </Row>

      <Dialog
        open={picker === "material"}
        onOpenChange={(next) => !next && closeMaterialPicker()}
        size="sheet"
        title="資材を選ぶ"
      >
        <div className={searchBox}>
          <SearchInput
            aria-label="資材を検索"
            placeholder="資材名・メーカー名で検索"
            value={query}
            onValueChange={setQuery}
          />
          <p className={note}>
            資材ページの「実証詳細レポートを書く」から来た場合は、その資材が入っています。
          </p>
        </div>
        {blocked !== null && (
          <Notice tone="warn" className={css({ mt: "2" })}>
            {blocked.report === "draft"
              ? `「${blocked.material.name}」には、書きかけの実証詳細レポートがあります。切り替えると同じ資材の下書きが2つになるため、資材は切り替えていません。`
              : `「${blocked.material.name}」には、運営が確認中の実証詳細レポートがあります。確認が終わるまで、この資材のレポートは新しく書けないため、資材は切り替えていません。`}
            <br />
            <TextLink href={`/materials/${blocked.material.id}/report/new`}>
              {blocked.report === "draft" ? "その下書きを開く" : "確認中のレポートを見る"}
            </TextLink>
          </Notice>
        )}
        <div className={listHead}>{query.trim() ? "検索結果" : "選んでいる資材"}</div>
        {!query.trim() && (
          <button
            type="button"
            className={itemRecipe({ current: true })}
            onClick={closeMaterialPicker}
          >
            {material.name} <Icon name="check" size="xs" />
            <span
              className={css({ display: "block", textStyle: "supporting", color: "text.muted" })}
            >
              {material.manufacturerName}
            </span>
          </button>
        )}
        {query.trim() !== "" && materials.length === 0 && (
          <p className={note}>見つかりません。資材名かメーカー名の一部で検索してください。</p>
        )}
        {materials.map((item) => (
          <button
            key={item.id}
            type="button"
            className={itemRecipe({ current: item.id === input.materialId })}
            onClick={() =>
              item.id === input.materialId ? closeMaterialPicker() : void pickMaterial(item)
            }
          >
            {item.name}
            <span
              className={css({ display: "block", textStyle: "supporting", color: "text.muted" })}
            >
              {item.manufacturer_name}
            </span>
          </button>
        ))}
      </Dialog>

      <Dialog
        open={picker === "crop"}
        onOpenChange={(next) => !next && setPicker("")}
        size="sheet"
        title="作物を選ぶ"
      >
        <div className={searchBox}>
          <SearchInput
            aria-label="作物を検索"
            placeholder="作物名で検索　例）トマト、みかん"
            value={query}
            onValueChange={setQuery}
          />
          <p className={note}>
            1つ選びます。複数の作物で使った場合は、作物ごとに別のレポートにしてください。
          </p>
        </div>
        {query.trim() ? (
          <>
            {crops.filter((item) => cropMatches(item, query)).map((item) => cropRow(item))}
            {!crops.some((item) => cropMatches(item, query)) && (
              <p className={note}>
                「{query.trim()}」に一致する作物がありません。別の呼び方でも検索できます。
              </p>
            )}
          </>
        ) : (
          <>
            {fromMaterial.length > 0 && <div className={listHead}>この資材の登録作物</div>}
            {fromMaterial.map((item) => cropRow(item, "material"))}
            {mine.length > 0 && <div className={listHead}>あなたの作物</div>}
            {mine.map((item) => cropRow(item, "mine"))}
            <div className={listHead}>すべての作物</div>
            {crops.map((item) => cropRow(item, "all"))}
          </>
        )}
      </Dialog>

      <Dialog
        open={picker === "purpose"}
        onOpenChange={(next) => !next && setPicker("")}
        size="sheet"
        title="使用目的を選ぶ"
        footer={
          <DialogClose variant="primary" className={doneButton}>
            完了
          </DialogClose>
        }
      >
        {ownEffects.length > 0 && (
          <>
            <div className={group}>この資材に登録されている効果</div>
            <ToggleGroup
              multiple
              variant="checks"
              aria-label="この資材に登録されている効果"
              options={ownEffects.map(effectOption)}
              value={input.purposeTags.filter((tag) => ownEffects.includes(tag))}
              onValueChange={(selected) => toggleEffects(ownEffects, selected)}
            />
          </>
        )}
        {effectGroups.map((name) => {
          const names = effects
            .filter((effect) => effect.categoryName === name && !ownEffects.includes(effect.name))
            .map((effect) => effect.name);
          if (names.length === 0) return null;
          return (
            <div key={name}>
              <div className={group}>{name}</div>
              <ToggleGroup
                multiple
                variant="checks"
                aria-label={name}
                options={names.map(effectOption)}
                value={input.purposeTags.filter((tag) => names.includes(tag))}
                onValueChange={(selected) => toggleEffects(names, selected)}
              />
            </div>
          );
        })}
        <Input
          fieldClassName={css({ mt: "4" })}
          label="補足"
          requirement="optional"
          placeholder="例）高温期の萎れを軽くしたかった"
          maxLength={REPORT_SHORT_MAX}
          value={input.purposeNote}
          onChange={(event) =>
            onChange((current) => ({ ...current, purposeNote: event.target.value }))
          }
        />
      </Dialog>

      <Dialog
        open={picker === "stages"}
        onOpenChange={(next) => !next && setPicker("")}
        size="sheet"
        wide
        fit
        title="施用時期を選ぶ"
        footer={
          <DialogClose variant="primary" className={doneButton}>
            完了
          </DialogClose>
        }
      >
        <ToggleGroup
          multiple
          variant="stages"
          className={stages}
          aria-label="施用時期"
          options={APPLICATION_TIMINGS.map((label, index) => ({ value: String(index), label }))}
          value={input.timingStages.map(String)}
          onValueChange={(selected) =>
            onChange((current) => ({ ...current, timingStages: selected.map(Number) }))
          }
        />
        <p className={note}>栽培の順に並んでいます。複数選べます。</p>
      </Dialog>
    </div>
  );
}
