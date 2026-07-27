export type SellerFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
    };

export const initialSellerFormState: SellerFormState = { status: "idle" };

export function sellerFieldErrors(state: SellerFormState): Record<string, string> {
  return state.status === "error" ? (state.fieldErrors ?? {}) : {};
}
