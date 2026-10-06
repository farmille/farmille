"use client";

import { useState } from "react";

import { OptionalBadge } from "@/app/_mock/FormParts";
import { MockCombobox } from "@/app/_mock/MockCombobox";
import type { ProfileDetails, ProfileOptions } from "@/server/queries/profile-details";

const AFFILIATION_LIMIT = 20;
const CROP_LIMIT = 50;

/**
 * 見本 S.profileEdit の「主な作目」（`.ts-chips`＋`.ts-box`）と「所属」（`.org-picker` の `.org-opt`）。
 * 選択済みタグは検索語に関係なく残し、自由入力した所属も同じ形式（affiliations）で保存する。
 * 見本は「その他（自分で記入）」を押すと入力欄が出るが、全欄を最初から見せる方針のため入力欄は常に出す。
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
      <div className="field">
        <label htmlFor="crop-search">
          主な作目
          <OptionalBadge />
        </label>
        <div
          className="ts-chips"
          aria-label="選択済みの作目"
          role="group"
          style={{ marginTop: 0, marginBottom: 8 }}
        >
          {cropIds.map((id) => {
            const crop = cropById.get(id);
            if (!crop) throw new Error("選択済みの作目が見つかりません。");
            return (
              <span key={id} className="chip-sel">
                <input type="hidden" name="cropIds" value={id} />
                <span className="cat-mini">作物</span>
                {crop.name}
                <button
                  type="button"
                  aria-label={`${crop.name}を削除`}
                  onClick={() => setCropIds(cropIds.filter((value) => value !== id))}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        <MockCombobox
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
        <div className="fguide" id="crop-search-guide" style={{ marginTop: 6, marginBottom: 0 }}>
          作物名や別名で検索して選んでください。複数選べます（{CROP_LIMIT}件まで）。公開されます。
          {available.length > 20
            ? `${available.length}件中20件を表示しています。`
            : `${available.length}件の候補があります。`}
        </div>
      </div>

      <div className="field">
        <label htmlFor="affiliation">
          所属
          <OptionalBadge />
        </label>
        <div className="fguide">
          当てはまるものを選んでください（複数可）。一覧にない所属は下の欄に入力して追加できます（
          {AFFILIATION_LIMIT}件まで）。公開されます。
        </div>
        <div className="org-picker">
          {options.affiliations.map((name) => {
            const on = affiliations.includes(name);
            return (
              <button
                key={name}
                type="button"
                className={on ? "org-opt on" : "org-opt"}
                aria-pressed={on}
                disabled={!on && affiliationFull}
                onClick={() => toggleAffiliation(name)}
              >
                {name}
              </button>
            );
          })}
          {customAffiliations.map((name) => (
            <span key={name} className="org-opt on custom">
              <span className="org-lab">その他</span>
              {name}
              <button
                type="button"
                className="org-x"
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
        <div className="org-add">
          <MockCombobox
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
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => addAffiliation()}>
            所属を追加
          </button>
        </div>
        {message ? (
          <p className="field-error" role="alert">
            {message}
          </p>
        ) : null}
      </div>
    </>
  );
}
