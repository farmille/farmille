"use client";

import { useState } from "react";
import { buttonRecipe } from "@/components";
import { controlStyle, Field } from "@/components/auth/Fields";
import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";
import { css } from "../../../../styled-system/css";

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
  function addAffiliation() {
    const value = affiliation.trim();
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
        <input
          className={controlStyle}
          id="crop-search"
          type="search"
          value={cropQuery}
          onChange={(event) => setCropQuery(event.target.value)}
          placeholder="作物名・別名を検索"
        />
        <div className={choices} aria-label="選択済みの作目">
          {cropIds.map((id) => (
            <span key={id}>
              <input type="hidden" name="cropIds" value={id} />
              <button
                type="button"
                className={buttonRecipe({ variant: "primary", size: "sm" })}
                onClick={() => setCropIds(cropIds.filter((value) => value !== id))}
              >
                {options.crops.find((crop) => crop.id === id)?.name} ×
              </button>
            </span>
          ))}
        </div>
        <div className={choices}>
          {found
            .slice(0, 20)
            .filter((crop) => !cropIds.includes(crop.id))
            .map((crop) => (
              <button
                key={crop.id}
                type="button"
                disabled={cropIds.length >= 50}
                className={buttonRecipe({ variant: "ghost", size: "sm" })}
                onClick={() => setCropIds([...cropIds, crop.id])}
              >
                {crop.name}（{crop.crop_groups?.name}）
              </button>
            ))}
        </div>
        <p className={css({ fontSize: "xs", color: "text.subtle" })}>
          {found.length > 20
            ? `${found.length}件中20件を表示しています。検索語を入力して絞り込めます。`
            : `${found.length}件の候補があります。`}
        </p>
      </Field>
      <Field
        htmlFor="affiliation"
        label="所属"
        requirement="optional"
        guide="候補から選ぶか、所属名を入力して追加してください。複数登録できます（20件まで）。公開されます。"
      >
        <input
          className={controlStyle}
          id="affiliation"
          list="affiliation-options"
          value={affiliation}
          maxLength={100}
          onChange={(event) => setAffiliation(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              addAffiliation();
            }
          }}
        />
        <datalist id="affiliation-options">
          {options.affiliations.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button
          type="button"
          className={buttonRecipe({ variant: "ghost", size: "sm" })}
          onClick={addAffiliation}
        >
          所属を追加
        </button>
        <div className={choices}>
          {affiliations.map((name) => (
            <span key={name}>
              <input type="hidden" name="affiliations" value={name} />
              <button
                type="button"
                className={buttonRecipe({ variant: "primary", size: "sm" })}
                onClick={() => setAffiliations(affiliations.filter((value) => value !== name))}
              >
                {name} ×
              </button>
            </span>
          ))}
        </div>
        {message && <p role="alert">{message}</p>}
      </Field>
    </>
  );
}
