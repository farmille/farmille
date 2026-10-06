import { OptimizedImage as Image } from "@/components/OptimizedImage";

/*
 * 完成見本（farmille-demo/index.html）の共通部品（stars・avatarHtml・CK・EXT・bottleImg・chip）を JSX にしたもの。
 * クラス名とインラインスタイルは見本のまま。スタイルの正は src/app/_mock/mock.css。
 */

/** 見本の stars(n)。★を n 個、☆を残りで並べる。 */
export function MockStars({ value }: { value: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span className="stars" role="img" aria-label={`5段階中${filled}`}>
      {"★".repeat(filled)}
      {"☆".repeat(5 - filled)}
    </span>
  );
}

/** 見本の initials()。法人格を外した先頭1文字。 */
function initials(name: string): string {
  const text = name.trim();
  if (!text) return "?";
  const body = text.replace(/^(株式会社|有限会社|農事組合法人|一般社団法人)/, "").trim();
  return (body || text).slice(0, 1).toUpperCase();
}

/** 見本の avatarHtml()。画像があれば画像、無ければ頭文字。 */
export function MockAvatar({
  name,
  src,
  size,
  extraSmall = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  extraSmall?: boolean;
}) {
  const style =
    size === undefined
      ? undefined
      : { width: size, height: size, fontSize: Math.round(size * 0.42), overflow: "hidden" };
  return (
    <span className={extraSmall ? "avatar xs" : "avatar"} style={style} aria-hidden="true">
      {src ? (
        <Image
          alt=""
          src={src}
          width={size ?? 36}
          height={size ?? 36}
          sizes={`${size ?? 36}px`}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/** 見本の bottleImg()。画像が無いときの置き場。 */
export function MockNoImage({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 46,
        display: "grid",
        placeItems: "center",
        color: "var(--ink-3)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: ".08em",
        background: "var(--bg)",
        borderRadius: 8,
      }}
    >
      NO IMAGE
    </div>
  );
}

/** 見本の chip()。style を渡すと色を差し替える（資材ジャンルは灰色）。 */
export function MockChip({ children, tone }: { children: React.ReactNode; tone?: "grey" }) {
  return (
    <span
      className="chip"
      style={
        tone === "grey"
          ? { background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line)" }
          : undefined
      }
    >
      {children}
    </span>
  );
}

/** 見本の CK（チェックの線画）。 */
export function MockCheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

/** 見本の EXT（外部リンク）。 */
export function MockExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
    </svg>
  );
}
