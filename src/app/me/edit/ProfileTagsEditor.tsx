"use client";

import { useForm, useStore } from "@tanstack/react-form";

import { useReducer } from "react";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import {
  Autocomplete,
  Combobox,
  Fieldset,
  Notice,
  useRestoredField,
  type Option,
} from "@/components/form";
import { fieldRecipe } from "@/components/form/recipes";
import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";
import { css } from "../../../../styled-system/css";

const AFFILIATION_LIMIT = 20;
const CROP_LIMIT = 50;
const CROP_SUGGESTION_LIMIT = 20;

const affiliationStack = css({ display: "flex", flexDirection: "column", gap: "2.5" });

const chipRow = css({ display: "flex", flexWrap: "wrap", gap: "2" });

const addRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  "& > :first-child": { flex: "1", minW: "0" },
  "& > :last-child": { flexShrink: "0" },
});

const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase();

type ProfileTagSelection = {
  cropQuery: string;
  crops: readonly Option[];
  affiliation: string;
  affiliations: readonly string[];
};

export function ProfileTagsEditor({
  details,
  options,
}: {
  details: ProfileDetails;
  options: ProfileOptions;
}) {
  const restoredCropIds = useRestoredField("cropIds");
  const restoredAffiliations = useRestoredField("affiliations");
  // TanStack Formは未編集のdefaultValues変更を取り込むため、復元した初期値を固定する。
  const [initialValues] = useReducer(
    (current: ProfileTagSelection) => current,
    null,
    (): ProfileTagSelection => ({
      cropQuery: "",
      crops:
        restoredCropIds === undefined
          ? details.crops.map((crop) => ({ value: crop.id, label: crop.name }))
          : restoredCropIds.flatMap((id) =>
              options.crops
                .filter((crop) => crop.id === id)
                .map((crop) => ({ value: crop.id, label: crop.name })),
            ),
      affiliation: "",
      affiliations: restoredAffiliations ?? details.affiliations,
    }),
  );
  const form = useForm({ defaultValues: initialValues });
  const { cropQuery, crops, affiliation, affiliations } = useStore(
    form.store,
    (state) => state.values,
  );
  const [message, setMessage] = useReducer((_state: string, next: string) => next, "");
  const query = normalize(cropQuery);
  const available = options.crops.filter(
    (crop) =>
      !crops.some((option) => option.value === crop.id) &&
      [crop.name, ...crop.aliases].some((name) => normalize(name).includes(query)),
  );
  const affiliationFull = affiliations.length >= AFFILIATION_LIMIT;

  function addAffiliation(name: string) {
    const value = name.trim();
    if (!value) return;
    if (affiliationFull) {
      setMessage(`所属は${AFFILIATION_LIMIT}件まで登録できます。`);
      return;
    }
    if (!affiliations.includes(value)) form.setFieldValue("affiliations", [...affiliations, value]);
    form.setFieldValue("affiliation", "");
    setMessage("");
  }

  return (
    <>
      {/* 初回ログインの案内が光らせる欄（docs/rebuild/onboarding-tour-SPEC.md）。
          中の Field は先頭の子になって上の余白を失うので、包む側に欄どうしの余白を付ける */}
      <div data-tour="profile-crops" className={fieldRecipe({ spacing: "stack" })}>
        <Combobox
          description={`作物名や別名で検索して選んでください。複数選べます（${CROP_LIMIT}件まで）。公開されます。${
            available.length > CROP_SUGGESTION_LIMIT
              ? `${available.length}件中${CROP_SUGGESTION_LIMIT}件を表示しています。`
              : `${available.length}件の候補があります。`
          }`}
          label="栽培作目"
          name="cropIds"
          requirement="optional"
          emptyMessage="一致する作物がありません"
          filterMode="preFiltered"
          inputValue={cropQuery}
          max={CROP_LIMIT}
          multiple
          onInputValueChange={(value) => form.setFieldValue("cropQuery", value)}
          onValueChange={(value) => form.setFieldValue("crops", value)}
          options={available.slice(0, CROP_SUGGESTION_LIMIT).map((crop) => ({
            value: crop.id,
            label: crop.name,
            description: crop.crop_groups?.name,
          }))}
          placeholder="作物名を入力（例：みかん、デコポン）"
          value={crops}
        />
      </div>

      <Fieldset
        legend="所属"
        lead={`所属名を入力し、候補から選んでください（複数可）。候補にない所属も追加できます（${AFFILIATION_LIMIT}件まで）。公開されます。`}
        requirement="optional"
      >
        <div className={affiliationStack}>
          {affiliations.length === 0 ? null : (
            <div className={chipRow}>
              {affiliations.map((name) => (
                <Chip
                  category="所属"
                  key={name}
                  onRemove={() =>
                    form.setFieldValue(
                      "affiliations",
                      affiliations.filter((value) => value !== name),
                    )
                  }
                  removeLabel={`${name}を削除`}
                >
                  {name}
                </Chip>
              ))}
            </div>
          )}
          {affiliations.map((name) => (
            <input key={name} type="hidden" name="affiliations" value={name} />
          ))}
          <div className={addRow}>
            <Autocomplete
              hideLabel
              label="所属"
              disabled={affiliationFull}
              filterMode="preFiltered"
              maxLength={100}
              onPick={(option) => addAffiliation(option.value)}
              onSubmitText={addAffiliation}
              onValueChange={(value) => form.setFieldValue("affiliation", value)}
              options={options.affiliations
                .filter(
                  (name) =>
                    affiliation.trim() !== "" &&
                    !affiliations.includes(name) &&
                    normalize(name).includes(normalize(affiliation.trim())),
                )
                .map((name) => ({ value: name, label: name }))}
              placeholder="〇〇市トマト生産部会"
              value={affiliation}
            />
            <Button onClick={() => addAffiliation(affiliation)} size="sm" variant="ghost">
              所属を追加
            </Button>
          </div>
          {message === "" ? null : <Notice tone="error">{message}</Notice>}
        </div>
      </Fieldset>
    </>
  );
}
