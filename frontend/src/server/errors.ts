export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_body"
  | "conflict"
  | "aal2_required"
  | "internal";

// 機能固有のエラーコードは、利用箇所と表示文言を同時に追加する。
export const errorMessageJa = {
  unauthorized: "ログインが必要です。",
  forbidden: "この操作を行う権限がありません。",
  not_found: "対象のデータが見つかりません。",
  invalid_body: "入力内容を確認してください。",
  conflict: "すでに同じ内容が登録されています。",
  aal2_required: "2要素認証を完了してください。",
  internal: "処理中に問題が発生しました。時間をおいて再度お試しください。",
} satisfies Record<ErrorCode, string>;
