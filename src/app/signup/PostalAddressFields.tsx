"use client";
import { useRef, useState, useTransition } from "react";

import { buttonRecipe } from "@/components/Button";
import { Field, Fieldset, Input, Select } from "@/components/form";
import { postalFill } from "@/lib/postal-fill";
import { PREFECTURES } from "@/lib/prefectures";

import { css } from "../../../styled-system/css";
import { findPostalAddress } from "./postal-action";

const PREFECTURE_OPTIONS = PREFECTURES.map((item) => ({
  value: String(item.code),
  label: item.name,
}));

const lookupButton = css(buttonRecipe.raw({ variant: "primary", size: "sm" }), {
  flex: "0 0 auto",
  minW: "0",
  px: "4",
});

const postalRowStyle = css({ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2" });

const postalInputStyle = css({ flex: "1 1 token(sizes.44)", maxW: "80" });

const lookupStatusStyle = css({ color: "primary.800" });

function completePostalCode(value: string): string | null {
  const digits = value.normalize("NFKC").replace(/-/g, "");
  return /^\d{7}$/.test(digits) ? digits : null;
}

export function PostalAddressFields({ values }: { values: Record<string, string> }) {
  const [postal, setPostal] = useState(values.postalCode ?? "");
  const [prefecture, setPrefecture] = useState(values.prefectureCode ?? "");
  const [cityStreet, setCityStreet] = useState(values.cityStreet ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const requestVersion = useRef(0);
  const lastAutofill = useRef("");
  const postalCode = completePostalCode(postal);
  function lookup() {
    if (postalCode === null) return;
    const version = ++requestVersion.current;
    startTransition(async () => {
      const result = await findPostalAddress(postalCode);
      if (version !== requestVersion.current) return;
      if (!result.ok || !("addresses" in result) || result.addresses === undefined) {
        setMessage(result.message ?? "住所を検索できませんでした。");
        return;
      }
      const fill = postalFill(result.addresses);
      if (fill.status === "many-cities") {
        setMessage("複数の市区町村が該当します。都道府県と市区町村・番地を入力してください。");
        return;
      }
      setPrefecture(String(fill.prefectureCode));
      if (fill.status === "many-towns") {
        setMessage(
          "複数の町名が該当します。都道府県を入力しました。市区町村・番地を入力してください。",
        );
        return;
      }
      const next = fill.status === "town" ? fill.city + fill.town : fill.city;
      if (cityStreet === "" || cityStreet === lastAutofill.current) {
        lastAutofill.current = next;
        setCityStreet(next);
      }
      setMessage("");
    });
  }

  return (
    <Fieldset legend="住所" requirement="required">
      <Field
        description={
          message === "" ? undefined : (
            <span className={lookupStatusStyle} role="status">
              {message}
            </span>
          )
        }
        label="郵便番号"
        labelSize="sm"
        name="postalCode"
        visibility="private"
      >
        <div className={postalRowStyle}>
          <Input
            autoComplete="postal-code"
            className={postalInputStyle}
            inputMode="numeric"
            maxLength={8}
            onBlur={() => {
              lookup();
            }}
            onChange={(event) => {
              requestVersion.current++;
              const value = event.target.value.normalize("NFKC").replaceAll("-", "");
              setPostal(
                /^\d{7}$/.test(value)
                  ? `${value.slice(0, 3)}-${value.slice(3)}`
                  : event.target.value,
              );
            }}
            placeholder="310-0011"
            value={postal}
          />
          <button
            type="button"
            className={lookupButton}
            disabled={pending || postalCode === null}
            onClick={lookup}
          >
            {pending ? "住所を検索中…" : "住所を自動入力"}
          </button>
        </div>
      </Field>

      <Field label="都道府県" labelSize="sm" name="prefectureCode" visibility="public">
        <Select
          autoComplete="address-level1"
          className={css({ maxW: "56" })}
          onValueChange={(value) => {
            requestVersion.current++;
            setPrefecture(value ?? "");
          }}
          options={PREFECTURE_OPTIONS}
          placeholder="選択してください"
          value={prefecture === "" ? null : prefecture}
        />
      </Field>

      <Field label="市区町村・番地" labelSize="sm" name="cityStreet" visibility="private">
        <Input
          autoComplete="address-line1"
          maxLength={300}
          onChange={(event) => {
            requestVersion.current++;
            lastAutofill.current = "";
            setCityStreet(event.target.value);
          }}
          placeholder="水戸市久が原978-6"
          value={cityStreet}
        />
      </Field>

      <Field
        label="建物名・部屋番号"
        labelSize="sm"
        name="buildingName"
        requirement="optional"
        visibility="private"
      >
        <Input
          autoComplete="address-line2"
          defaultValue={values.buildingName}
          maxLength={200}
          placeholder="〇〇マンション101"
        />
      </Field>
    </Fieldset>
  );
}
