"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS, type SlotProps } from "input-otp";
import { useContext, useState } from "react";

import { css, cva } from "../../../styled-system/css";
import { useFieldContext } from "./field-context";

const CODE_LENGTH = 6;

// 透明な1つの入力欄が枠の上に重なる。枠の外まで押せないよう、幅は枠の並びに合わせる
const containerStyle = css({ w: "fit-content", maxW: "100%" });

const slotsStyle = css({ display: "flex", gap: "2" });

/** 1桁ぶんの枠。見た目は入力欄（controlRecipe）と同じ枠・角丸・焦点の色にそろえる。 */
const slotRecipe = cva({
  base: {
    display: "grid",
    placeItems: "center",
    w: "11",
    h: "12",
    bg: "surface.card",
    color: "text.default",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "input",
    fontFamily: "sans",
    fontSize: "xl",
    fontWeight: "bold",
    fontVariantNumeric: "tabular-nums",
    lineHeight: "none",
  },
  variants: {
    active: {
      true: {
        borderColor: "primary.600",
        outlineWidth: "1px",
        outlineStyle: "solid",
        outlineColor: "primary.200",
      },
      false: {},
    },
    invalid: {
      true: { borderColor: "accent.danger" },
      false: {},
    },
    disabled: {
      true: { opacity: "disabled" },
      false: {},
    },
  },
});

// 本物のキャレットは透明なので、次に入る枠に縦線を出す
const caretStyle = css({ w: "0.5", h: "6", bg: "text.default" });

type OtpInputProps = {
  /** 送信名。囲む Field に name があればそちらが優先される。 */
  name?: string;
  disabled?: boolean;
  /** Field の見出しが無いときの名前。 */
  "aria-label"?: string;
};

/**
 * 認証アプリの6桁のコード。見た目は6つの枠だが、入力欄は1つ（貼り付け・SMS の自動入力・読み上げが効く）。
 * Field の見出しがこの入力欄の名前になり、必須かどうかは Field の requirement で決まる。
 */
export function OtpInput({ name, disabled, "aria-label": ariaLabel }: OtpInputProps) {
  const { required, inRoot } = useFieldContext();
  const [code, setCode] = useState("");

  const control = (
    <BaseField.Control
      aria-label={ariaLabel}
      disabled={disabled}
      // 6桁そろわない値は送信前に止める（空のままは requirement に従う）
      minLength={CODE_LENGTH}
      name={name}
      render={(props, state) => (
        // Base UI の onChange は event を受け取るが、input-otp は文字列を渡すので差し替える
        <OTPInput
          {...props}
          autoComplete="one-time-code"
          containerClassName={containerStyle}
          inputMode="numeric"
          maxLength={CODE_LENGTH}
          onChange={setCode}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
        >
          <Slots disabled={state.disabled} invalid={state.valid === false} />
        </OTPInput>
      )}
      required={required}
      value={code}
    />
  );

  // Field の外では自分の Field.Root を持ち、Form の検証と errors の対象にする
  return inRoot ? control : <BaseField.Root name={name}>{control}</BaseField.Root>;
}

function Slots({ invalid, disabled }: { invalid: boolean; disabled: boolean }) {
  const { slots } = useContext(OTPInputContext);
  return (
    <div className={slotsStyle}>
      {slots.map((slot, index) => (
        // 枠は位置そのものが識別子になる
        <Slot disabled={disabled} invalid={invalid} key={`slot-${index}`} slot={slot} />
      ))}
    </div>
  );
}

function Slot({
  slot,
  invalid,
  disabled,
}: {
  slot: SlotProps;
  invalid: boolean;
  disabled: boolean;
}) {
  return (
    <div className={slotRecipe({ active: slot.isActive, invalid, disabled })}>
      {slot.char}
      {slot.hasFakeCaret ? <span aria-hidden="true" className={caretStyle} /> : null}
    </div>
  );
}
