export type Requirement = "required" | "optional";

export type Visibility = "public" | "private";

/** Select・RadioGroup・CheckboxGroup などで選ぶ1件。 */
export type Option<V extends string = string> = {
  value: V;
  label: string;
  description?: string;
  disabled?: boolean;
  /** 連続する選択肢の group が変わる位置に小見出しを出す。 */
  group?: string;
};

/** Field の name をキーにしたサーバー側の項目エラー。 */
export type FieldErrors = Readonly<Partial<Record<string, string>>>;
