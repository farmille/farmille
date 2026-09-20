"use client";
import { useRef, useState, useTransition } from "react";
import { buttonRecipe } from "@/components";
import { Field, controlStyle } from "@/components/auth/Fields";
import { PREFECTURES } from "@/lib/prefectures";
import { findPostalAddress } from "./postal-action";

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
  return (
    <>
      <Field
        error={fieldErrors.postalCode}
        htmlFor="postalCode"
        label="郵便番号"
        visibility="private"
        guide="7桁で入力すると都道府県と市区町村を自動入力します。公開されません。"
        requirement="required"
      >
        <input
          className={controlStyle}
          id="postalCode"
          name="postalCode"
          autoComplete="postal-code"
          inputMode="numeric"
          value={postal}
          onChange={(event) => {
            requestVersion.current++;
            setPostal(event.target.value);
          }}
          onBlur={() => {
            if (/^\d{7}$/.test(postal.normalize("NFKC").replace(/-/g, ""))) lookup();
          }}
          placeholder="123-4567"
          maxLength={8}
          required
        />
        <button
          type="button"
          className={buttonRecipe({ variant: "ghost", size: "sm" })}
          disabled={pending}
          onClick={lookup}
        >
          {pending ? "住所を検索中…" : "住所を自動入力"}
        </button>
        <p role="status">{message}</p>
      </Field>
      <Field
        error={fieldErrors.prefectureCode}
        htmlFor="prefectureCode"
        label="都道府県"
        visibility="public"
        guide="公開されます"
        requirement="required"
      >
        <select
          className={controlStyle}
          id="prefectureCode"
          name="prefectureCode"
          autoComplete="address-level1"
          value={prefecture}
          onChange={(event) => {
            requestVersion.current++;
            setPrefecture(event.target.value);
          }}
          required
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
      </Field>
      <Field
        error={fieldErrors.city}
        htmlFor="city"
        label="市区町村"
        visibility="private"
        guide="公開されません"
        requirement="required"
      >
        <input
          className={controlStyle}
          id="city"
          name="city"
          autoComplete="address-level2"
          value={city}
          onChange={(event) => {
            requestVersion.current++;
            setCity(event.target.value);
          }}
          maxLength={100}
          required
        />
      </Field>
      {[
        { name: "streetAddress", label: "番地", autoComplete: "address-line1", required: true },
        {
          name: "buildingName",
          label: "建物名・部屋番号",
          autoComplete: "address-line2",
          required: false,
        },
      ].map((field) => (
        <Field
          key={field.name}
          error={fieldErrors[field.name]}
          htmlFor={field.name}
          label={field.label}
          visibility="private"
          guide={
            field.required ? "町名・丁目・番地を入力してください。公開されません" : "公開されません"
          }
          requirement={field.required ? "required" : "optional"}
        >
          <input
            className={controlStyle}
            id={field.name}
            name={field.name}
            autoComplete={field.autoComplete}
            defaultValue={values[field.name]}
            maxLength={200}
            required={field.required}
          />
        </Field>
      ))}
    </>
  );
}
