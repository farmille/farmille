"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { useReducer, useRef, type ChangeEvent, type InputHTMLAttributes } from "react";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";

import { buttonRecipe } from "@/components/Button";
import { css, cx } from "../../../styled-system/css";
import { useFieldRequired } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";

const rootStyle = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "2",
});

const pickerLabelStyle = css({
  display: "inline-flex",
  cursor: "pointer",
  "&:has(input:disabled)": {
    cursor: "not-allowed",
    opacity: "disabled",
  },
  "&:has(input:focus-visible) > span": {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "0.5",
  },
});

const hiddenInputStyle = css({ srOnly: true });

const selectionStyle = css({
  m: "0",
  color: "text.subtle",
  textStyle: "supporting",
  overflowWrap: "anywhere",
});

type FileInputBodyProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "required" | "aria-invalid"
>;

type FileInputProps = FileInputBodyProps & Labeling;

function selectionText(fileNames: readonly string[]): string {
  if (fileNames.length === 0) return "ファイルが選択されていません";

  if (fileNames.length === 1) return `選択中：${fileNames[0]}`;

  return `${fileNames.length}件選択中：${fileNames.join("、")}`;
}

/** ブラウザ固有の英語表示を出さず、選択状態を日本語で伝えるファイル入力。 */
export function FileInput(props: FileInputProps) {
  const [labeling, inputProps] = splitLabeling(props);

  return (
    <Labeled disabled={inputProps.disabled} labeling={labeling} name={inputProps.name}>
      <FileInputBody {...inputProps} />
    </Labeled>
  );
}

function FileInputBody({ onChange, disabled, className, ...inputProps }: FileInputBodyProps) {
  const required = useFieldRequired();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useReducer((_current: string[], next: string[]) => next, []);

  // フォームの reset はファイル入力を空にするが change を出さないので、表示中の選択も空にする
  useMountEffect(() => {
    const form = inputRef.current?.form;

    if (form === null || form === undefined) return;
    const clear = () => setFileNames([]);
    form.addEventListener("reset", clear);

    return () => form.removeEventListener("reset", clear);
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange?.(event);
    setFileNames(Array.from(event.currentTarget.files ?? [], (file) => file.name));
  }

  return (
    <div className={cx(rootStyle, className)}>
      <label className={pickerLabelStyle}>
        <span className={buttonRecipe({ size: "sm", variant: "ghost" })}>ファイルを選択</span>
        <BaseInput
          {...inputProps}
          className={hiddenInputStyle}
          disabled={disabled}
          onChange={handleChange}
          ref={inputRef}
          required={required}
          type="file"
        />
      </label>
      <p aria-live="polite" className={selectionStyle}>
        {selectionText(fileNames)}
      </p>
    </div>
  );
}
