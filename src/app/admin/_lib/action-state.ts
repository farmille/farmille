import type { MaterialFieldErrors } from "@/server/admin/materials";
import type { TotpEnrollment } from "@/server/admin/mfa";
import type { SellerCredentials } from "@/server/admin/sellers";

// Server Action の戻り値（useActionState の state）。
// "use server" ファイルは async 関数しか export できないため、型と初期値はここに置く。

/** 単純な実行結果だけを返す操作（タグ・作物マスタ、資材変更申請）。 */
export type AdminActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; message: string };

export const initialAdminActionState: AdminActionState = { status: "idle" };

/** メーカー確認。承認と招待コード発行は一度だけ表示する値を持ち帰る。 */
export type SellerActionState =
  | AdminActionState
  /** 発行した共有ログイン。パスワードは保存していないので、この表示が唯一の受け渡し機会。 */
  | { status: "approved"; credentials: SellerCredentials }
  | { status: "invited"; inviteCode: string };

export const initialSellerActionState: SellerActionState = { status: "idle" };

/**
 * 資材フォームの送信値。React 19 の form action は送信後に未制御フィールドを
 * リセットするため、エラー時は入力内容を返して再表示する。
 */
export type MaterialFormValues = {
  fields: Record<string, string>;
  cropIds: string[];
  effectIds: string[];
  ingredientCategoryIds: string[];
  ingredientIds: string[];
  productTypeIds: string[];
  searchTagIds: string[];
};

/** 資材フォーム。項目単位のエラーと送信値を返す。 */
export type MaterialFormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: MaterialFieldErrors;
      values?: MaterialFormValues;
    }
  | { status: "done"; message: string };

export const initialMaterialFormState: MaterialFormState = { status: "idle" };

/** MFA 登録。開始に成功したら QR とシークレットを持ち帰る。 */
export type MfaEnrollState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ready"; enrollment: TotpEnrollment };

export const initialMfaEnrollState: MfaEnrollState = { status: "idle" };
