// 認証フォームと server action のやり取り（useActionState の state）。
// エラーコード → 文言の変換は server action 側で行い、画面には表示文言だけを渡す。
// values は再表示のために送信値を返すもの。パスワードは入れない。
export type AuthFormValues = Record<string, string>;

export type AuthFormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
      values?: AuthFormValues;
    }
  | { status: "done"; message: string };

export const initialAuthFormState: AuthFormState = { status: "idle" };

export function fieldErrorsOf(state: AuthFormState): Record<string, string> {
  return state.status === "error" ? (state.fieldErrors ?? {}) : {};
}

/** エラー後の再表示用。action が返した値を拾う（初回表示は空）。 */
export function submittedValuesOf(state: AuthFormState): Record<string, string> {
  return state.status === "error" ? (state.values ?? {}) : {};
}
