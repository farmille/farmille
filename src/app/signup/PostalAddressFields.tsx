"use client";
import { useRef, useState, useTransition } from "react";

import {
  describedBy,
  FieldError,
  OptionalBadge,
  RequiredBadge,
  VisibilityTag,
} from "@/app/_mock/FormParts";
import { PREFECTURES } from "@/lib/prefectures";
import { findPostalAddress } from "./postal-action";

const ZIP_GUIDE = "郵便番号を入れると、都道府県と市区町村（町域まで）が自動で入ります。";

/** 見本 S.signup の「住所」欄（`.addr-grid`）。郵便番号からの自動入力は本番の仕組み（離れたとき＋ボタン）。 */
export function PostalAddressFields({
  values,
  fieldErrors,
}: {
  values: Record<string, string>;
  fieldErrors: Record<string, string>;
}) {
  const [postal, setPostal] = useState(values.postalCode ?? "");
  const [prefecture, setPrefecture] = useState(values.prefectureCode ?? "");
  const [city, setCity] = useState(values.city ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const requestVersion = useRef(0);
  function lookup() {
    const version = ++requestVersion.current;
    startTransition(async () => {
      const result = await findPostalAddress(postal.normalize("NFKC").replace(/-/g, ""));
      if (version !== requestVersion.current) return;
      if (!result.ok || !("addresses" in result) || result.addresses === undefined) {
        setMessage(result.message ?? "住所を検索できませんでした。");
        return;
      }
      if (result.addresses.length !== 1) {
        setMessage("複数の市区町村が該当します。お住まいの都道府県と市区町村を入力してください。");
        return;
      }
      const address = result.addresses[0];
      setPrefecture(String(address.prefectureCode));
      setCity(address.city);
      setMessage("都道府県と市区町村を入力しました。内容を確認してください。");
    });
  }
  const errorFor = (name: string) => (fieldErrors[name] ? `${name}-error` : undefined);
  const invalid = (name: string) => (fieldErrors[name] ? true : undefined);

  return (
    <fieldset className="field">
      <legend className="field-label">
        住所
        <RequiredBadge />
      </legend>
      <div
        className="fguide"
        style={{
          margin: "0 0 6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <VisibilityTag visibility="public" />
        都道府県 ／ <VisibilityTag visibility="private" />
        郵便番号・市区町村・番地・建物名
      </div>
      <div className="addr-grid">
        <label className="addr-lb" htmlFor="postalCode">
          郵便番号
        </label>
        <div>
          <div className="zip-row">
            <input
              aria-describedby={describedBy("postalCode-note", errorFor("postalCode"))}
              aria-invalid={invalid("postalCode")}
              autoComplete="postal-code"
              className="input"
              id="postalCode"
              inputMode="numeric"
              maxLength={8}
              name="postalCode"
              onBlur={() => {
                if (/^\d{7}$/.test(postal.normalize("NFKC").replace(/-/g, ""))) lookup();
              }}
              onChange={(event) => {
                requestVersion.current++;
                setPostal(event.target.value);
              }}
              placeholder="例）3100011"
              required
              value={postal}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={pending}
              onClick={lookup}
            >
              {pending ? "住所を検索中…" : "住所を自動入力"}
            </button>
          </div>
          <div
            className="fguide"
            id="postalCode-note"
            role="status"
            style={{
              margin: "4px 0 0",
              color: message ? "var(--green-deep)" : undefined,
            }}
          >
            {message || ZIP_GUIDE}
          </div>
          <FieldError id="postalCode-error" message={fieldErrors.postalCode} />
        </div>

        <label className="addr-lb" htmlFor="prefectureCode">
          都道府県
        </label>
        <div>
          <select
            aria-describedby={errorFor("prefectureCode")}
            aria-invalid={invalid("prefectureCode")}
            autoComplete="address-level1"
            className="input"
            id="prefectureCode"
            name="prefectureCode"
            onChange={(event) => {
              requestVersion.current++;
              setPrefecture(event.target.value);
            }}
            required
            style={{ maxWidth: 220 }}
            value={prefecture}
          >
            <option value="" disabled>
              選択してください
            </option>
            {PREFECTURES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <FieldError id="prefectureCode-error" message={fieldErrors.prefectureCode} />
        </div>

        <label className="addr-lb" htmlFor="city">
          市区町村
        </label>
        <div>
          <input
            aria-describedby={errorFor("city")}
            aria-invalid={invalid("city")}
            autoComplete="address-level2"
            className="input"
            id="city"
            maxLength={100}
            name="city"
            onChange={(event) => {
              requestVersion.current++;
              setCity(event.target.value);
            }}
            placeholder="例）水戸市笠原町"
            required
            value={city}
          />
          <FieldError id="city-error" message={fieldErrors.city} />
        </div>

        <label className="addr-lb" htmlFor="streetAddress">
          番地
        </label>
        <div>
          <input
            aria-describedby={errorFor("streetAddress")}
            aria-invalid={invalid("streetAddress")}
            autoComplete="address-line1"
            className="input"
            defaultValue={values.streetAddress}
            id="streetAddress"
            maxLength={200}
            name="streetAddress"
            placeholder="例）978-6"
            required
          />
          <FieldError id="streetAddress-error" message={fieldErrors.streetAddress} />
        </div>

        <label className="addr-lb" htmlFor="buildingName">
          建物名・部屋番号 <OptionalBadge />
        </label>
        <div>
          <input
            aria-describedby={errorFor("buildingName")}
            aria-invalid={invalid("buildingName")}
            autoComplete="address-line2"
            className="input"
            defaultValue={values.buildingName}
            id="buildingName"
            maxLength={200}
            name="buildingName"
            placeholder="例）〇〇マンション101"
          />
          <FieldError id="buildingName-error" message={fieldErrors.buildingName} />
        </div>
      </div>
      <div className="fguide" style={{ marginTop: 6, marginBottom: 0 }}>
        ※
        市区町村は、プロフィール設定で「市区町村も表示する」を選んだ場合のみ公開されます。郵便番号・番地・建物名は公開されません。
      </div>
    </fieldset>
  );
}
