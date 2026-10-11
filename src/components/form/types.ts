export type Requirement = "required" | "optional";

export type Visibility = "public" | "private";

export type Option<V extends string = string> = {
  value: V;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
};

export type FieldErrors = Readonly<Partial<Record<string, string>>>;
