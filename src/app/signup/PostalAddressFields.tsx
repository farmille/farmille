"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useRef, useReducer, useTransition } from "react";

import { buttonRecipe } from "@/components/Button";
import { Field, Fieldset, Input, Select, useRestoredText } from "@/components/form";
import { useResetKey } from "@/components/form/field-context";
import { postalFill } from "@/lib/postal-fill";
import { PREFECTURES } from "@/lib/prefectures";

import { css } from "../../../styled-system/css";
import { findPostalAddress } from "./postal-action";

const PREFECTURE_OPTIONS = PREFECTURES.map((item) => ({
  value: String(item.code),
  label: item.name,
}));

const lookupButton = css(buttonRecipe.raw({ variant: "primary", size: "sm" }), {
  flex: "none",
  minW: "0",
  px: "4",
});

const postalRowStyle = css({ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2" });

const postalInputStyle = css({ flex: "[1 1 token(sizes.44)]", maxW: "80" });

const lookupStatusStyle = css({ color: "text.brand" });

function completePostalCode(value: string): string | null {
  const digits = value.normalize("NFKC").replace(/-/g, "");

  return /^\d{7}$/.test(digits) ? digits : null;
}

export function PostalAddressFields({ values }: { values: Record<string, string> }) {
  const resetKey = useResetKey("");

  return <PostalAddressInputs key={resetKey} values={values} />;
}

function PostalAddressInputs({ values }: { values: Record<string, string> }) {
  const restoredPostal = useRestoredText("postalCode");
  const restoredPrefecture = useRestoredText("prefectureCode");
  const restoredCityStreet = useRestoredText("cityStreet");
  const restoredBuildingName = useRestoredText("buildingName");

  const form = useForm({
    defaultValues: {
      postal: restoredPostal ?? values.postalCode ?? "",
      prefecture: restoredPrefecture ?? values.prefectureCode ?? "",
      cityStreet: restoredCityStreet ?? values.cityStreet ?? "",
      buildingName: restoredBuildingName ?? values.buildingName ?? "",
    },
  });

  const { postal, prefecture, cityStreet, buildingName } = useStore(
    form.store,
    (state) => state.values,
  );

  const [message, setMessage] = useReducer((_state: string, next: string) => next, "");
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

      form.setFieldValue("prefecture", String(fill.prefectureCode));

      if (fill.status === "many-towns") {
        setMessage(
          "複数の町名が該当します。都道府県を入力しました。市区町村・番地を入力してください。",
        );

        return;
      }

      const next = fill.status === "town" ? fill.city + fill.town : fill.city;

      if (cityStreet === "" || cityStreet === lastAutofill.current) {
        lastAutofill.current = next;
        form.setFieldValue("cityStreet", next);
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
            label={null}
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
              form.setFieldValue(
                "postal",
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

      <Select
        label="都道府県"
        labelSize="sm"
        name="prefectureCode"
        visibility="public"
        autoComplete="address-level1"
        className={css({ maxW: "56" })}
        onValueChange={(value) => {
          requestVersion.current++;
          form.setFieldValue("prefecture", value ?? "");
        }}
        options={PREFECTURE_OPTIONS}
        placeholder="選択してください"
        value={prefecture === "" ? null : prefecture}
      />

      <Input
        label="市区町村・番地"
        labelSize="sm"
        name="cityStreet"
        visibility="private"
        autoComplete="address-line1"
        maxLength={300}
        onChange={(event) => {
          requestVersion.current++;
          lastAutofill.current = "";
          form.setFieldValue("cityStreet", event.target.value);
        }}
        placeholder="水戸市久が原978-6"
        value={cityStreet}
      />

      <Input
        label="建物名・部屋番号"
        labelSize="sm"
        name="buildingName"
        requirement="optional"
        visibility="private"
        autoComplete="address-line2"
        value={buildingName}
        onChange={(event) => form.setFieldValue("buildingName", event.target.value)}
        maxLength={200}
        placeholder="〇〇マンション101"
      />
    </Fieldset>
  );
}
