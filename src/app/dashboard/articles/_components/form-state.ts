export type SellerArticleFormState =
  | { status: "idle" }
  | { status: "success"; message: string; articleId?: string; published?: boolean }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
    };

export const initialSellerArticleFormState: SellerArticleFormState = { status: "idle" };

export function sellerArticleFieldErrors(state: SellerArticleFormState): Record<string, string> {
  return state.status === "error" ? (state.fieldErrors ?? {}) : {};
}
