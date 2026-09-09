import * as v from "valibot";

export const ERROR_CODES = [
  "unauthorized",
  "forbidden",
  "not_found",
  "invalid_body",
  "conflict",
  "aal2_required",
  "internal",
  // 認証（T-13）
  "handle_taken",
  "email_unavailable",
  "invalid_credentials",
  "seller_invalid_credentials",
  "weak_password",
  "rate_limited",
  "expired_link",
  "passkey_failed",
  "passkey_unavailable",
  // 通報（T-34）
  "already_reported",
  // メーカー申請（T-41）
  "login_id_taken",
  "invalid_invite_code",
] as const;

export const ErrorCodeSchema = v.picklist(ERROR_CODES);
export type ErrorCode = v.InferOutput<typeof ErrorCodeSchema>;

// 機能固有のエラーコードは、利用箇所と表示文言を同時に追加する。
export const errorMessageJa = {
  passkey_failed:
    "パスキーの操作を完了できませんでした。登録済みのパスキーを選んで再度お試しください。認証の有効期限が切れた場合は再ログインしてください。",
  passkey_unavailable:
    "パスキー認証を利用できません。対応ブラウザで再度お試しいただくか、パスワード・認証アプリを利用してください。",
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
  login_id_taken: "このログイン ID はすでに使われています。別の ID を指定してください。",
  invalid_invite_code: "招待コードが正しくありません。",
} satisfies Record<ErrorCode, string>;

/** メーカーダッシュボードの Server Action が返す成功文言。 */
export const sellerDashboardMessageJa = {
  articleDraftSaved: "下書きを保存しました。",
  articlePublished: "記事を公開しました。",
  articleUnpublished: "記事を非公開にしました。",
  articleDeleted: "記事を削除しました。",
  articleUpdated: "記事を更新しました。",
} as const;
