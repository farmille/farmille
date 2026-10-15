"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS, type SlotProps } from "input-otp";
import { useContext, useState } from "react";

import { css, cva } from "../../../styled-system/css";
import { useFieldRequired } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";

const CODE_LENGTH = 6;

// 透明な1つの入力欄が枠の上に重なる。枠の外まで押せないよう、幅は枠の並びに合わせる
const containerStyle = css({ w: "fit-content", maxW: "100%" });

const slotsStyle = css({ display: "flex", gap: "2" });

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

const caretStyle = css({ w: "0.5", h: "6", bg: "text.default" });

type OtpInputBodyProps = {
  /** 送信名。囲む Field に name があればそちらが優先される。 */
  name?: string;
  disabled?: boolean;
};

type OtpInputProps = OtpInputBodyProps & Labeling;

/**
 * 認証アプリの6桁のコード。見た目は6つの枠だが、入力欄は1つ（貼り付け・SMS の自動入力・読み上げが効く）。
 * label がこの入力欄の名前になり、必須かどうかは requirement で決まる。
 */
export function OtpInput(props: OtpInputProps) {
  const [labeling] = splitLabeling(props);
  return (
    <Labeled disabled={props.disabled} labeling={labeling} name={props.name}>
      <OtpInputBody {...props} />
    </Labeled>
  );
}

function OtpInputBody({ name, disabled }: OtpInputBodyProps) {
  const required = useFieldRequired();
  const [code, setCode] = useState("");

  return (
    <BaseField.Control
      disabled={disabled}
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
}

function Slots({ invalid, disabled }: { invalid: boolean; disabled: boolean }) {
  const { slots } = useContext(OTPInputContext);
  return (
    <div className={slotsStyle}>
      {slots.map((slot, index) => (
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
