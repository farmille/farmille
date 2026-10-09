"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";

import { buttonRecipe } from "@/components/Button";
import { css, cx } from "../../../styled-system/css";
import { useFieldRequired } from "./field-context";

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
    outlineOffset: "2px",
  },
});

const hiddenInputStyle = css({ srOnly: true });

const selectionStyle = css({
  m: "0",
  color: "text.subtle",
  fontSize: "sm",
  lineHeight: "relaxed",
  overflowWrap: "anywhere",
});

type FileInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "required" | "aria-invalid"
>;

function selectionText(fileNames: readonly string[]): string {
  if (fileNames.length === 0) return "ファイルが選択されていません";
  if (fileNames.length === 1) return `選択中：${fileNames[0]}`;
  return `${fileNames.length}件選択中：${fileNames.join("、")}`;
}

/**
 * ブラウザ固有の英語表示を出さず、選択状態を日本語で伝えるファイル入力。
 * Field の中では、隠した input が Field の見出しで読み上げられる。
 */
export function FileInput({ onChange, disabled, className, ...inputProps }: FileInputProps) {
  const required = useFieldRequired();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (form === null || form === undefined) return;

    function handleReset(): void {
      setFileNames([]);
    }

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, []);

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
