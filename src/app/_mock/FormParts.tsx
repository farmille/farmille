import type { ReactNode } from "react";

/*
 * 完成見本（farmille-demo/index.html）の入力フォームの共通部品（badge・pubTag・privTag・SEARCH_ICON・CK）を JSX にしたもの。
 * クラス名とインラインスタイルは見本のまま。スタイルの正は src/app/_mock/mock.css と forms.css。
 */

/** 見本の `<span class="badge badge-req">必須</span>`。 */
export function RequiredBadge() {
  return <span className="badge badge-req">必須</span>;
}

/** 見本の `<span class="badge badge-opt">任意</span>`。 */
export function OptionalBadge({ children = "任意" }: { children?: ReactNode }) {
  return <span className="badge badge-opt">{children}</span>;
}

/** 見本の ICO_PUB（地球儀）。 */
function PublicIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z" />
    </svg>
  );
}

/** 見本の ICO_PRIV（鍵）。 */
function PrivateIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

/**
 * 見本の pubTag()／privTag()。画面には「公開」「非公開」と出し、
 * 読み上げでは「公開されます」「公開されません」と文で伝える。
 */
export function VisibilityTag({ visibility }: { visibility: "public" | "private" }) {
  return visibility === "public" ? (
    <span className="vis-tag vis-pub">
      <PublicIcon />
      公開<span className="sr-only">されます</span>
    </span>
  ) : (
    <span className="vis-tag vis-priv">
      <PrivateIcon />
      <span aria-hidden="true">非公開</span>
      <span className="sr-only">公開されません</span>
    </span>
  );
}

/** 見本の SEARCH_ICON。 */
export function SearchIcon() {
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

/** 見本の IMGP（写真の置き場）。 */
export function ImagePlaceholderIcon() {
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

/** 入力欄の下に出すエラー。入力欄の aria-describedby から id で参照する。 */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (message === undefined) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}

/** 画面上部に出すフォーム全体の通知（エラー・お知らせ）。 */
export function FormNotice({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <p className={tone === "error" ? "form-notice error" : "form-notice info"} role="alert">
      {children}
    </p>
  );
}

/** aria-describedby に渡す id を、存在するものだけ空白区切りでつなぐ。 */
export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const joined: string[] = [];
  for (const id of ids) {
    if (id) joined.push(id);
  }
  return joined.length > 0 ? joined.join(" ") : undefined;
}
