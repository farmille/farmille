import Image from "next/image";

// 2026-06-29 (stage1): レビューに添付された画像のサムネイルグリッド。
// 公開レビュー一覧 (page.tsx) と本人レビュー (my-review-row.tsx) の双方で使う
// presentational component。画像 URL は backend が ADR-0003 の Storage 規約から
// 解決した public URL 配列。各サムネは別タブで原寸を開ける。
export function ReviewImageGrid({ images }: { images?: string[] | null }) {
  if (!images || images.length === 0) return null;
  return (
    <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
      {images.map((url, i) => (
        <li
          key={url}
          className="relative aspect-square overflow-hidden rounded-sm border border-border bg-muted"
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`レビュー画像 ${i + 1} を別タブで開く`}
            className="block h-full w-full"
          >
            <Image
              src={url}
              alt={`レビュー画像 ${i + 1}`}
              fill
              sizes="(max-width: 640px) 33vw, 20vw"
              className="object-cover transition-opacity hover:opacity-90"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
