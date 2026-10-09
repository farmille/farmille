"use client";
import { useRef, useState, useTransition } from "react";

import { buttonRecipe } from "@/components/Button";
import { Field, Fieldset, Input, Select } from "@/components/form";
import { PREFECTURES } from "@/lib/prefectures";

import { css, cva } from "../../../styled-system/css";
import { findPostalAddress } from "./postal-action";

const ZIP_GUIDE = "郵便番号を入れると、都道府県と市区町村（町域まで）が自動で入ります。";

const PREFECTURE_OPTIONS = PREFECTURES.map((item) => ({
  value: String(item.code),
  label: item.name,
}));

const lookupButton = css(buttonRecipe.raw({ variant: "ghost", size: "sm" }), {
  flex: "0 0 auto",
  minW: "0",
  px: "4",
});

const postalRowStyle = css({ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2" });

const postalInputStyle = css({ flex: "1 1 token(sizes.44)", maxW: "80" });

const zipNoteRecipe = cva({
  variants: {
    announced: {
      true: { color: "primary.800" },
      false: {},
    },
  },
});

export function PostalAddressFields({ values }: { values: Record<string, string> }) {
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
    <Fieldset
      description="※ 市区町村は、プロフィール設定で「市区町村も表示する」を選んだ場合のみ公開されます。郵便番号・番地・建物名は公開されません。"
      legend="住所"
      requirement="required"
    >
      <Field
        description={
          <span className={zipNoteRecipe({ announced: message !== "" })} role="status">
            {message || ZIP_GUIDE}
          </span>
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
              if (/^\d{7}$/.test(postal.normalize("NFKC").replace(/-/g, ""))) lookup();
            }}
            onChange={(event) => {
              requestVersion.current++;
              setPostal(event.target.value);
            }}
            placeholder="例）3100011"
            value={postal}
          />
          <button type="button" className={lookupButton} disabled={pending} onClick={lookup}>
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

      <Field label="市区町村" labelSize="sm" name="city" visibility="private">
        <Input
          autoComplete="address-level2"
          maxLength={100}
          onChange={(event) => {
            requestVersion.current++;
            setCity(event.target.value);
          }}
          placeholder="例）水戸市笠原町"
          value={city}
        />
      </Field>

      <Field label="番地" labelSize="sm" name="streetAddress" visibility="private">
        <Input
          autoComplete="address-line1"
          defaultValue={values.streetAddress}
          maxLength={200}
          placeholder="例）978-6"
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
          placeholder="例）〇〇マンション101"
        />
      </Field>
    </Fieldset>
  );
}
