"use client";

import { useState } from "react";

import { buttonRecipe } from "@/components/Button";
import {
  FieldError,
  formFieldStyle,
  formGuideRecipe,
  formLabelStyle,
  OptionalBadge,
} from "@/app/_site/FormParts";
import { SearchCombobox } from "@/app/_site/SearchCombobox";
import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";
import { css, cva } from "../../../../styled-system/css";

const AFFILIATION_LIMIT = 20;
const CROP_LIMIT = 50;

const focusRing = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary.700",
  outlineOffset: "2px",
} as const;

const selectedCrops = css({ display: "flex", flexWrap: "wrap", gap: "2", mb: "2" });

const selectedCrop = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  pl: "3",
  pr: "1.5",
  py: "1",
  bg: "primary.100",
  color: "primary.800",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "primary.700/30",
  borderRadius: "pill",
  fontSize: "sm",
  fontWeight: "semibold",
});

const selectedCropCategory = css({ color: "primary.800/65", fontSize: "2xs", fontWeight: "bold" });

const removeCrop = css({
  w: "4.5",
  h: "4.5",
  display: "grid",
  placeItems: "center",
  p: "0",
  border: "none",
  borderRadius: "pill",
  bg: "primary.700/18",
  color: "primary.800",
  fontSize: "sm",
  lineHeight: "none",
  _focusVisible: { ...focusRing, outlineOffset: "1px" },
});

const affiliationOptions = css({ display: "flex", flexWrap: "wrap", gap: "2", mt: "2" });

const affiliationOption = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    px: "3.5",
    py: "2",
    bg: "surface.card",
    color: "text.muted",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "pill",
    fontSize: "sm",
    fontWeight: "semibold",
    lineHeight: "tight",
    cursor: "pointer",
    _hover: { borderColor: "primary.700", color: "primary.800" },
    _focusVisible: focusRing,
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    state: {
      off: {},
      on: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        _hover: { borderColor: "primary.700", color: "text.inverse" },
        _before: { content: '"✓"', fontSize: "xs", fontWeight: "black" },
      },
      custom: {
        pr: "1.5",
        bg: "primary.100",
        borderColor: "primary.700",
        color: "primary.800",
        cursor: "default",
      },
    },
  },
});

const customLabel = css({
  px: "1.5",
  py: "0.5",
  bg: "surface.card",
  color: "primary.800",
  borderRadius: "pill",
  fontSize: "xs",
  fontWeight: "extrabold",
});

const removeAffiliation = css({
  w: "5",
  h: "5",
  display: "grid",
  placeItems: "center",
  p: "0",
  border: "none",
  borderRadius: "pill",
  bg: "scrim/8",
  color: "primary.800",
  fontSize: "sm",
  lineHeight: "none",
  cursor: "pointer",
  _hover: { bg: "scrim/16" },
});

const addRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  mt: "2",
  "& > :first-child": { flex: "1", minW: "0" },
});

const addButton = css(buttonRecipe.raw({ variant: "ghost", size: "sm" }), {
  flex: "0 0 auto",
  px: "4",
  _focusVisible: focusRing,
});

/**
 * 「主な作目」（選択済みの作目＋検索）と「所属」（候補の選択＋自由入力）。
 * 選択済みタグは検索語に関係なく残し、自由入力した所属も同じ形式（affiliations）で保存する。
 * 全欄を最初から見せる方針のため、自由入力の欄は常に出す。
 */
export function ProfileTagsEditor({
  details,
  options,
}: {
  details: ProfileDetails;
  options: ProfileOptions;
}) {
  const [cropQuery, setCropQuery] = useState("");
  const [cropIds, setCropIds] = useState(details.crops.map((crop) => crop.id));
  const [affiliation, setAffiliation] = useState("");
  const [affiliations, setAffiliations] = useState(details.affiliations);
  const [message, setMessage] = useState("");
  const query = cropQuery.normalize("NFKC").toLocaleLowerCase();
  const found = options.crops.filter((crop) =>
    [crop.name, ...crop.aliases].some((name) =>
      name.normalize("NFKC").toLocaleLowerCase().includes(query),
    ),
  );
  const cropById = new Map([...details.crops, ...options.crops].map((crop) => [crop.id, crop]));
  const available = found.filter((crop) => !cropIds.includes(crop.id));
  const affiliationFull = affiliations.length >= AFFILIATION_LIMIT;
  const customAffiliations = affiliations.filter((name) => !options.affiliations.includes(name));

  function addAffiliation(name = affiliation) {
    const value = name.trim();
    if (!value) return;
    if (affiliationFull) {
      setMessage(`所属は${AFFILIATION_LIMIT}件まで登録できます。`);
      return;
    }
    if (!affiliations.includes(value)) setAffiliations([...affiliations, value]);
    setAffiliation("");
    setMessage("");
  }

  function toggleAffiliation(name: string) {
    if (affiliations.includes(name)) {
      setAffiliations(affiliations.filter((value) => value !== name));
      setMessage("");
      return;
    }
    addAffiliation(name);
  }

  return (
    <>
      <div className={formFieldStyle}>
        <label className={formLabelStyle} htmlFor="crop-search">
          主な作目
          <OptionalBadge />
        </label>
        <div className={selectedCrops} aria-label="選択済みの作目" role="group">
          {cropIds.map((id) => {
            const crop = cropById.get(id);
            if (!crop) throw new Error("選択済みの作目が見つかりません。");
            return (
              <span key={id} className={selectedCrop}>
                <input type="hidden" name="cropIds" value={id} />
                <span className={selectedCropCategory}>作物</span>
                {crop.name}
                <button
                  type="button"
                  className={removeCrop}
                  aria-label={`${crop.name}を削除`}
                  onClick={() => setCropIds(cropIds.filter((value) => value !== id))}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        <SearchCombobox
          id="crop-search"
          aria-label="主な作目"
          aria-describedby="crop-search-guide"
          value={cropQuery}
          onValueChange={setCropQuery}
          placeholder="作物名を入力（例：みかん、デコポン）"
          disabled={cropIds.length >= CROP_LIMIT}
          options={available.slice(0, 20).map((crop) => ({
            value: crop.id,
            label: crop.name,
            description: crop.crop_groups?.name,
          }))}
          onSelect={(id) => {
            setCropIds([...cropIds, id]);
            setCropQuery("");
          }}
          emptyMessage="一致する作物がありません"
        />
        <div className={formGuideRecipe({ placement: "below" })} id="crop-search-guide">
          作物名や別名で検索して選んでください。複数選べます（{CROP_LIMIT}件まで）。公開されます。
          {available.length > 20
            ? `${available.length}件中20件を表示しています。`
            : `${available.length}件の候補があります。`}
        </div>
      </div>

      <div className={formFieldStyle}>
        <label className={formLabelStyle} htmlFor="affiliation">
          所属
          <OptionalBadge />
        </label>
        <div className={formGuideRecipe()}>
          当てはまるものを選んでください（複数可）。一覧にない所属は下の欄に入力して追加できます（
          {AFFILIATION_LIMIT}件まで）。公開されます。
        </div>
        <div className={affiliationOptions}>
          {options.affiliations.map((name) => {
            const on = affiliations.includes(name);
            return (
              <button
                key={name}
                type="button"
                className={affiliationOption({ state: on ? "on" : "off" })}
                aria-pressed={on}
                disabled={!on && affiliationFull}
                onClick={() => toggleAffiliation(name)}
              >
                {name}
              </button>
            );
          })}
          {customAffiliations.map((name) => (
            <span key={name} className={affiliationOption({ state: "custom" })}>
              <span className={customLabel}>その他</span>
              {name}
              <button
                type="button"
                className={removeAffiliation}
                aria-label={`${name}を削除`}
                onClick={() => setAffiliations(affiliations.filter((value) => value !== name))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {affiliations.map((name) => (
          <input key={name} type="hidden" name="affiliations" value={name} />
        ))}
        <div className={addRow}>
          <SearchCombobox
            id="affiliation"
            aria-label="所属"
            value={affiliation}
            maxLength={100}
            placeholder="例）〇〇市トマト生産部会"
            onValueChange={setAffiliation}
            onSubmitValue={() => addAffiliation()}
            closeOnSubmit
            showEmptyState={false}
            disabled={affiliationFull}
            options={options.affiliations
              .filter(
                (name) =>
                  !affiliations.includes(name) &&
                  name
                    .normalize("NFKC")
                    .toLocaleLowerCase()
                    .includes(affiliation.normalize("NFKC").toLocaleLowerCase()),
              )
              .map((name) => ({ value: name, label: name }))}
            onSelect={addAffiliation}
          />
          <button type="button" className={addButton} onClick={() => addAffiliation()}>
            所属を追加
          </button>
        </div>
        <FieldError id="affiliation-error" message={message === "" ? undefined : message} />
      </div>
    </>
  );
}
