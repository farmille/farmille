// Google フォームによるレビュー受付（2026-06-10 根本さん指示）。
//
// 方針:
//   - 根本さんから共有される Google フォームの「埋め込み iframe URL」
//     （フォーム編集画面 → 送信 → < > タブ の src=... の URL。末尾 `?embedded=true`）を
//     下の GOOGLE_FORM_EMBED_URL に貼り、製品ページ等で <GoogleFormReviewEmbed /> を
//     有効化（コメント解除）するだけで表示できる。
//   - URL 未設定の現状は何も描画しない（= サイトの現挙動を一切変えない）。
//     「Form 埋め込みは今はコメントアウトで現状キープ」という指示に合わせた挙動。
//
// フォームが収集する項目（根本さん指定）:
//   - 氏名 / メールアドレス
//   - レビュー表示名（または匿名の選択）
//   - 都道府県
//   - 対象資材
//   - 星評価
//   - 本文
//   - 画像
//   - 農薬取締法関連のチェックボックス
//
// 注意: 既存のサイト内レビュー投稿フロー（/products/[id] のレビューフォーム）は
//   そのまま残す。本コンポーネントは併設の Google フォーム導線用。

// 2026-06-10 根本さん提供フォーム（埋め込み用 = viewform?embedded=true）。
// 差し替えるときはここを更新するだけ。空文字に戻すと何も描画しない。
const GOOGLE_FORM_EMBED_URL: string =
  "https://docs.google.com/forms/d/e/1FAIpQLSdZbNt8vdzB_9c8MYKNk676y0cJKP4Fo-RohRkV0A-iucVNVw/viewform?embedded=true";

export function GoogleFormReviewEmbed() {
  // URL 未設定: 現状維持のため何も表示しない。
  if (!GOOGLE_FORM_EMBED_URL) {
    return null;
  }

  // URL 設定後に有効化される表示。トーンはサイトに合わせた最小実装。
  return (
    <section aria-label="レビューを投稿（Googleフォーム）" className="space-y-3">
      <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-3">
        レビューを投稿
      </h2>
      <div
        className="overflow-hidden border border-border bg-card"
        style={{
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <iframe
          src={GOOGLE_FORM_EMBED_URL}
          title="Farmille レビュー投稿フォーム"
          className="w-full"
          style={{ height: 1800, border: 0 }}
          loading="lazy"
        >
          読み込んでいます…
        </iframe>
      </div>
    </section>
  );
}
