import * as v from "valibot";

export const ERROR_CODES = [
  "unauthorized",
  "forbidden",
  "not_found",
  "invalid_body",
  "conflict",
  "active_report_exists",
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
  // PDF読み取り
  "pdf_reading_limit",
  "captcha_failed",
  "pdf_invalid",
  "pdf_too_large",
  "pdf_too_many_pages",
  "pdf_reading_failed",
  "pdf_reading_no_match",
  "pdf_reading_incomplete",
  "pdf_reading_material_changed",
  "pdf_reading_unrecorded",
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
  active_report_exists:
    "この資材には下書きまたは確認中のレポートがあります。入力内容は残っています。マイページから既存のレポートを確認してください。",
  aal2_required: "2要素認証を完了してください。",
  internal: "処理中に問題が発生しました。時間をおいて再度お試しください。",
  handle_taken: "このニックネームはすでに使われています。別のニックネームを入力してください。",
  // 登録済みかどうかを断定しない文言にする（アカウントの存在を推測させない）。
  email_unavailable:
    "このメールアドレスでは登録できません。登録済みの場合はログインをお試しください。",
  // ID とパスワードのどちらが誤りかを判別させない文言にする。
  invalid_credentials: "メールアドレスまたはパスワードが正しくありません。",
  seller_invalid_credentials: "Farmille企業会員IDまたはパスワードが正しくありません。",
  weak_password: "パスワードは8文字以上で入力してください。",
  rate_limited: "リクエストが多すぎます。しばらく待ってから再度お試しください。",
  expired_link: "リンクが無効か、有効期限が切れています。もう一度やり直してください。",
  already_reported: "この投稿はすでに通報済みで、対応中です。",
  login_id_taken: "このFarmille企業会員IDはすでに使われています。別のIDを指定してください。",
  invalid_invite_code: "招待コードが正しくありません。",
  pdf_reading_limit:
    "今月のPDF読み取りの回数の上限に達しました。来月1日から再び使えます。入力した内容はそのまま残っています。手入力で続けられます。",
  captcha_failed:
    "ロボットによる操作ではないことを確認できませんでした。ページを再読み込みして、もう一度お試しください。入力した内容はそのまま残っています。手入力で続けられます。",
  pdf_invalid:
    "PDFを開けませんでした。パスワードの付いていないPDFファイルを選んでください。入力した内容はそのまま残っています。手入力で続けられます。",
  pdf_too_large:
    "PDFが大きすぎます。20MB以下のファイルを選んでください。入力した内容はそのまま残っています。手入力で続けられます。",
  pdf_too_many_pages:
    "PDFのページが多すぎます。40ページ以下のファイルを選んでください。入力した内容はそのまま残っています。手入力で続けられます。",
  pdf_reading_failed:
    "PDFを読み取れませんでした。入力した内容はそのまま残っています。手入力で続けられます。",
  pdf_reading_no_match:
    "PDFの中に、投稿する資材を使った試験が見つかりませんでした。読み取る試験に、PDFでの資材の呼び名と試験の番号を書いてお試しいただくか、手入力で記入してください。入力した内容はそのまま残っています。",
  pdf_reading_incomplete:
    "PDFの内容が多く、最後まで読み取れませんでした。読み取る試験で作物・品種・試験をしぼって、もう一度お試しください。入力した内容はそのまま残っています。手入力で続けられます。",
  pdf_reading_material_changed:
    "読み取りの間に、別の画面でこの下書きの資材が変わったため、読み取った内容を入れませんでした。入力した内容はそのまま残っています。手入力で続けられます。",
  // 値は下書きに入っているので、ほかの PDF読み取りの文言と違い「入力はそのまま」とは書かない
  pdf_reading_unrecorded:
    "読み取った値は下書きに入りましたが、根拠の記録に失敗したため、「PDF読み取り」の印と引用を出せません。入った値は、元のPDFと照らし合わせて確かめてください。",
} satisfies Record<ErrorCode, string>;

/** メーカーダッシュボードの Server Action が返す成功文言。 */
export const sellerDashboardMessageJa = {
  articleDraftSaved: "下書きを保存しました。",
  articlePublished: "記事を公開しました。",
  articleUnpublished: "記事を非公開にしました。",
  articleDeleted: "記事を削除しました。",
  articleUpdated: "記事を更新しました。",
} as const;
