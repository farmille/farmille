import type { InputHTMLAttributes } from "react";
import { css, cx } from "../../styled-system/css";

const radioStyle = css({
  appearance: "none",
  w: "4.5",
  h: "4.5",
  flexShrink: "0",
  rounded: "pill",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "border.strong",
  bg: "surface.card",
  cursor: "pointer",
  _checked: {
    borderColor: "primary.600",
    bg: "primary.600",
    boxShadow: "inset 0 0 0 3px {colors.surface.card}",
  },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
  _disabled: { opacity: "disabled", cursor: "not-allowed" },
});

export function Radio({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return <input {...props} type="radio" className={cx(radioStyle, className)} />;
}

const groupStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  borderWidth: "0",
  p: "0",
  m: "0",
  minW: "0",
});

const optionStyle = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "2.5",
  fontSize: "md",
  lineHeight: "normal",
  cursor: "pointer",
});

// 1行目の文字の中心に丸を合わせる
const optionRadioStyle = css({ mt: "0.5" });

const descriptionStyle = css({
  display: "block",
  mt: "0.5",
  color: "text.muted",
  fontSize: "sm",
});

type RadioOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type RadioGroupProps<T extends string> = {
  name: string;
  /** グループの見出しにする要素の id（`Field` の `labelId` など）。 */
  "aria-labelledby": string;
  options: readonly RadioOption<T>[];
  required?: boolean;
} & (
  | { value: T; onChange: (value: T) => void; defaultValue?: never }
  | { value?: never; onChange?: (value: T) => void; defaultValue?: T }
);

/**
 * 単一選択のラジオ一覧（縦並び）。見出しは外の要素から `aria-labelledby` で結ぶ。
 * `value` + `onChange` で制御、`defaultValue` だけならフォーム送信用の非制御で使う。
 * `onChange` には `options` の値がそのまま渡るので、`T` は選択肢の値の和になる。
 */
export function RadioGroup<T extends string>({
  name,
  options,
  required,
  value,
  defaultValue,
  onChange,
  "aria-labelledby": labelledBy,
}: RadioGroupProps<T>) {
  return (
    <fieldset aria-labelledby={labelledBy} className={groupStyle}>
      {options.map((option) => (
        <label className={optionStyle} key={option.value}>
          <Radio
            {...(value === undefined
              ? { defaultChecked: option.value === defaultValue }
              : { checked: option.value === value })}
            className={optionRadioStyle}
            name={name}
            // 関数を渡せないサーバーコンポーネントの非制御利用でも描画できるよう、渡されたときだけ付ける
            onChange={onChange === undefined ? undefined : () => onChange(option.value)}
            required={required}
            value={option.value}
          />
          <span>
            {option.label}
            {option.description === undefined ? null : (
              <span className={descriptionStyle}>{option.description}</span>
            )}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
