import * as v from "valibot";

const FormDataStringSchema = v.string();
const FormDataStringsSchema = v.array(FormDataStringSchema);

/** FormData の値を文字列として検証し、File と欠損値を明示的に除外する。 */
export function formDataString(value: FormDataEntryValue | null): string | null {
  const result = v.safeParse(FormDataStringSchema, value);
  return result.success ? result.output : null;
}

/** 入力欄の文字列を検証してから前後の空白を除く。 */
export function trimmedFormDataString(value: FormDataEntryValue | null): string {
  return formDataString(value)?.trim() ?? "";
}

export function formDataStrings(values: FormDataEntryValue[]): string[] {
  const result = v.safeParse(FormDataStringsSchema, values);
  return result.success ? result.output : [];
}
