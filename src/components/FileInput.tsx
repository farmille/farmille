"use client";

import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";

import { buttonRecipe } from "@/components/Button";
import { css } from "../../styled-system/css";

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
  lineHeight: "1.6",
  overflowWrap: "anywhere",
});

type FileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function selectionText(fileNames: readonly string[]): string {
  if (fileNames.length === 0) return "ファイルが選択されていません";
  if (fileNames.length === 1) return `選択中：${fileNames[0]}`;
  return `${fileNames.length}件選択中：${fileNames.join("、")}`;
}

/** ブラウザ固有の英語表示を出さず、選択状態を日本語で伝えるファイル入力。 */
export function FileInput({ onChange, disabled, ...inputProps }: FileInputProps) {
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
    <div className={rootStyle}>
      <label className={pickerLabelStyle}>
        <span className={buttonRecipe({ size: "sm", variant: "ghost" })}>ファイルを選択</span>
        <input
          {...inputProps}
          className={hiddenInputStyle}
          disabled={disabled}
          onChange={handleChange}
          ref={inputRef}
          type="file"
        />
      </label>
      <p aria-live="polite" className={selectionStyle}>
        {selectionText(fileNames)}
      </p>
    </div>
  );
}
