export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_body"
  | "conflict"
  | "aal2_required"
  | "internal"
  // 認証（T-13）
  | "handle_taken"
  | "email_unavailable"
  | "invalid_credentials"
  | "seller_invalid_credentials"
  | "weak_password"
  | "rate_limited"
  | "expired_link"
  // 通報（T-34）
  | "already_reported";

// 機能固有のエラーコードは、利用箇所と表示文言を同時に追加する。
export const errorMessageJa = {
  unauthorized: "ログインが必要です。",
  forbidden: "この操作を行う権限がありません。",
  not_found: "対象のデータが見つかりません。",
  invalid_body: "入力内容を確認してください。",
  conflict: "すでに同じ内容が登録されています。",
  aal2_required: "2要素認証を完了してください。",
  internal: "処理中に問題が発生しました。時間をおいて再度お試しください。",
  handle_taken: "このハンドルネームはすでに使われています。",
  // 登録済みかどうかを断定しない文言にする（アカウントの存在を推測させない）。
  email_unavailable:
    "このメールアドレスでは登録できません。登録済みの場合はログインをお試しください。",
  // ID とパスワードのどちらが誤りかを判別させない文言にする。
  invalid_credentials: "メールアドレスまたはパスワードが正しくありません。",
  seller_invalid_credentials: "ログイン ID またはパスワードが正しくありません。",
  weak_password: "パスワードは8文字以上で入力してください。",
  rate_limited: "リクエストが多すぎます。しばらく待ってから再度お試しください。",
  expired_link: "リンクが無効か、有効期限が切れています。もう一度やり直してください。",
  already_reported: "この投稿はすでに通報済みで、対応中です。",
} satisfies Record<ErrorCode, string>;

/** 出品者ダッシュボードの Server Action が返す成功文言。 */
export const sellerDashboardMessageJa = {
  primaryInformationSaved: "一次情報を保存しました。",
  evidenceAdded: "エビデンスを追加しました。",
  evidenceDeleted: "エビデンスを削除しました。",
  editRequestSubmitted: "分類変更を申請しました。",
} as const;
