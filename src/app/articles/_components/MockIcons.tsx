/*
 * 完成見本（farmille-demo/index.html）の線画アイコン（THUMB・EYE・SEED・CHEV・IMGP・SEARCH_ICON）を JSX にしたもの。
 * 色は currentColor か見本の変数を使う。
 */

/** 見本の THUMB（参考になった）。 */
export function MockThumbIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4-8a2 2 0 012 2v3h5a2 2 0 012 2.3l-1.2 7A2 2 0 0117.8 21H7" />
    </svg>
  );
}

/** 見本の EYE（閲覧数）。 */
export function MockEyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** 見本の SEED（資材の印）。 */
export function MockSeedIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--green)"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M7 20c0-5 2-8 5-9M17 6c0 5-2 8-5 9M5 8c3 0 5 2 5 5M19 14c-3 0-5-1-6-4" />
    </svg>
  );
}

/** 見本の CHEV（右向きの矢印）。 */
export function MockChevronIcon() {
  return (
    <svg
      className="chev"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** 見本の IMGP（画像が無いときの印）。 */
export function MockImagePlaceholderIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--green)"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M21 16l-5-5-7 7" />
    </svg>
  );
}

/** 見本の SEARCH_ICON（検索窓の虫眼鏡）。 */
export function MockSearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

/** 見本の vc(n)。閲覧数（読み上げは「N回閲覧」）。 */
export function MockViewCount({ count }: { count: number }) {
  return (
    <span className="view-count" aria-label={`${count}回閲覧`}>
      <MockEyeIcon /> <span className="tnum">{count.toLocaleString("ja-JP")}</span>
    </span>
  );
}
