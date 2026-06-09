// 2026-06-07 根本さん指示（Slack）: メーカー公式サイト等から取得した商品画像は、
// 出典を表示していても無許諾転載に見えるリスクがあるため、公開画面では一括非表示にする。
// 画像データ自体（product_images / Storage）は保持しており、個別判定で掲載可と
// なったらこのフラグを true に戻すだけで復活する。
// 対象外: maker 自身のダッシュボード (/maker/products)・admin 画面・記事ヒーロー画像。
//
// 2026-06-10 役員デモ向けに再表示（根本さん指示・桑江/奥田さん承認）。
// 「画像がないと未完成感がある」ためデモ当日用に true へ戻す。中長期は自社撮影/
// メーカー提供画像へ差し替える方針は不変。再度伏せる場合は false に戻すだけで足りる。
export const PRODUCT_IMAGES_ENABLED = true;

// 2026-06-10 根本さん指示: レビュー投稿を Google フォームに一本化する（ログイン不要で
// 誰でも投稿可）。製品ページの「レビューを投稿」欄を Google フォーム埋め込みに切替える。
// false に戻すと従来のサイト内フォーム（ログイン+farmer権限+プロフィール必須）が復活する。
// 埋め込み URL は src/components/google-form-review-embed.tsx を参照。
export const REVIEW_VIA_GOOGLE_FORM = true;
