// 2026-06-07 根本さん指示（Slack）: メーカー公式サイト等から取得した商品画像は、
// 出典を表示していても無許諾転載に見えるリスクがあるため、公開画面では一括非表示にする。
// 画像データ自体（product_images / Storage）は保持しており、個別判定で掲載可と
// なったらこのフラグを true に戻すだけで復活する。
// 対象外: maker 自身のダッシュボード (/maker/products)・admin 画面・記事ヒーロー画像。
export const PRODUCT_IMAGES_ENABLED = false;
