/** モック SVG を React 化した共通アイコン。色は currentColor／親のトークン色に従う。 */

type IconProps = {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

export function LeafIcon({ size = 24, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
      {...rest}
    >
      <path
        d="M26 5C14 5 6 12 6 22c0 2 .4 3.6 1 5 6-9 12-12 18-13-5 2.5-9 6.5-12 13 1 .3 2.3.5 4 .5 8 0 13-6 13-15 0-4-1-7-4-8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchIcon({ size = 17, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
      {...rest}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

export function BackIcon({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ShareIcon({ size = 19, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M4 12v8a1 1 0 001 1h14a1 1 0 001-1v-8M16 6l-4-4-4 4M12 2v14" />
    </svg>
  );
}

export function OfficialCheckIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...rest}
    >
      {/* モックの公式チェック（青の盾型） */}
      <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.7-.8 2.9.8 2.9-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15.9 4 13l-.8-2.9L5.6 8.4l1-2.8 3-.1L12 2z" />
      <path d="M10.1 12.6l-1.8-1.8-1.2 1.2 3 3 5.2-5.2-1.2-1.2-4 4z" fill="white" />
    </svg>
  );
}

export function PersonIcon({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...rest}
    >
      <circle cx="12" cy="9" r="3.4" />
      <path d="M5 20c0-3.5 3-5 7-5s7 1.5 7 5z" />
    </svg>
  );
}

export function ThumbIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4-8a2 2 0 012 2v3h5a2 2 0 012 2l-1 7a2 2 0 01-2 2H7" />
    </svg>
  );
}

export function ChevronIcon({ size = 16, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function HomeNavIcon({ size = 21, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1z" />
    </svg>
  );
}

export function ArticlesNavIcon({ size = 21, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

export function MeNavIcon({ size = 21, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={className}
      aria-hidden
      {...rest}
    >
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.5 3.6-5 7-5s6.2 1.5 7 5" />
    </svg>
  );
}

export function PlusIcon({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ImagePlaceholderIcon({ size = 24, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      aria-hidden
      {...rest}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M21 15l-5-5-8 8" />
    </svg>
  );
}

/** 農薬非断定の同意・コンプライアンス注記用チェック。 */
export function CheckIcon({ size = 16, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M5 12.5l5 5L20 7" />
    </svg>
  );
}
