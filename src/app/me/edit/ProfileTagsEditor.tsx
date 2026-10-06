"use client";

import { useState } from "react";
import { buttonRecipe } from "@/components";
import { Combobox } from "@/components/Combobox";
import { TagChip } from "@/components/TagChip";
import { Field } from "@/components/auth/Fields";
import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";
import { css } from "../../../../styled-system/css";

const chipStyle = css({ maxW: "full", whiteSpace: "normal", overflowWrap: "anywhere" });
const choices = css({ display: "flex", flexWrap: "wrap", gap: "2", my: "2" });

/** 選択済みタグは検索語に関係なく残し、自由入力した所属も同じ形式で保存する。 */
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
  function addAffiliation(name = affiliation) {
    const value = name.trim();
    if (!value) return;
    if (affiliations.length >= 20) {
      setMessage("所属は20件まで登録できます。");
      return;
    }
    if (!affiliations.includes(value)) setAffiliations([...affiliations, value]);
    setAffiliation("");
    setMessage("");
  }
  return (
    <>
      <Field
        htmlFor="crop-search"
        label="主な作目"
        requirement="optional"
        guide="作物名や別名で検索して選んでください。複数選べます（50件まで）。公開されます。"
      >
        <Combobox
          id="crop-search"
          aria-label="主な作目"
          value={cropQuery}
          onValueChange={setCropQuery}
          placeholder="作物名・別名を検索"
          disabled={cropIds.length >= 50}
          options={available.slice(0, 20).map((crop) => ({
            value: crop.id,
            label: crop.name,
            description: crop.crop_groups?.name,
          }))}
          onSelect={(id) => {
            setCropIds([...cropIds, id]);
            setCropQuery("");
          }}
        />
        <div className={choices} aria-label="選択済みの作目">
          {cropIds.map((id) => {
            const crop = cropById.get(id);
            if (!crop) throw new Error("選択済みの作目が見つかりません。");
            return (
              <span key={id}>
                <input type="hidden" name="cropIds" value={id} />
                <TagChip
                  className={chipStyle}
                  label={crop.name}
                  showCategoryLabel={false}
                  onRemove={() => setCropIds(cropIds.filter((value) => value !== id))}
                />
              </span>
            );
          })}
        </div>
        <p className={css({ fontSize: "xs", color: "text.subtle" })}>
          {available.length > 20
            ? `${available.length}件中20件を表示しています。検索語を入力して絞り込めます。`
            : `${available.length}件の候補があります。`}
        </p>
      </Field>
      <Field
        htmlFor="affiliation"
        label="所属"
        requirement="optional"
        guide="候補から選ぶか、所属名を入力して追加してください。複数登録できます（20件まで）。公開されます。"
      >
        <Combobox
          id="affiliation"
          aria-label="所属"
          value={affiliation}
          maxLength={100}
          onValueChange={setAffiliation}
          onSubmitValue={() => addAffiliation()}
          disabled={affiliations.length >= 20}
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
          emptyMessage="所属名を入力して追加できます。"
        />
        <button
          type="button"
          className={buttonRecipe({ variant: "ghost", size: "sm" })}
          onClick={() => addAffiliation()}
        >
          所属を追加
        </button>
        <div className={choices}>
          {affiliations.map((name) => (
            <span key={name}>
              <input type="hidden" name="affiliations" value={name} />
              <TagChip
                className={chipStyle}
                label={name}
                category="maker"
                showCategoryLabel={false}
                onRemove={() => setAffiliations(affiliations.filter((value) => value !== name))}
              />
            </span>
          ))}
        </div>
        {message && <p role="alert">{message}</p>}
      </Field>
    </>
  );
}
