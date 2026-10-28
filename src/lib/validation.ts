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

/** フォームの欄ごとの検証結果。エラーは欄の名前ごとに最初の1件だけ持つ。 */
export type FieldsValidation<TEntries extends v.ObjectEntries> =
  | { ok: true; input: v.InferOutput<v.ObjectSchema<TEntries, undefined>> }
  | { ok: false; fieldErrors: Partial<Record<keyof TEntries, string>> };

/** スキーマの欄ごとに受け取る FormData の値。 */
export type FormFieldValues<TEntries extends v.ObjectEntries> = {
  [Key in keyof TEntries]: FormDataEntryValue | null;
};

/** FormData の値をオブジェクトのスキーマで検証し、欄ごとのエラー文言に分ける。 */
export function validateFields<TEntries extends v.ObjectEntries>(
  schema: v.ObjectSchema<TEntries, undefined>,
  raw: FormFieldValues<TEntries>,
): FieldsValidation<TEntries> {
  const result = v.safeParse(schema, raw);
  if (result.success) return { ok: true, input: result.output };
  const fieldErrors: Partial<Record<keyof TEntries, string>> = {};
  const keys = v.custom<keyof TEntries>(
    (value) => v.is(v.string(), value) && Object.hasOwn(schema.entries, value),
  );
  for (const issue of result.issues) {
    const key = v.safeParse(keys, issue.path?.[0]?.key);
    if (key.success && fieldErrors[key.output] === undefined)
      fieldErrors[key.output] = issue.message;
  }
  return { ok: false, fieldErrors };
}
