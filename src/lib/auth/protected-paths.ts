// proxy（Next 16 の middleware 相当）で使うパス方針。
// ここではログイン済みかどうかだけを見る。ロール判定は src/server/auth.ts が行う（第一防御）。

/** 要ログイン。一般ユーザーの画面（02 §2「要ログイン」）。 */
const GENERAL_PROTECTED_PREFIXES = ["/me", "/post", "/account"];

/** 要ログインの配下でも、ログインなしで開ける画面。退会の完了画面は、退会でログアウトした後に開く。 */
const PUBLIC_PATHS = ["/account/withdrawn"];

/** 要ログイン。メーカーダッシュボード（02 §2「メーカーダッシュボード」）。 */
const SELLER_PROTECTED_PREFIXES = ["/dashboard"];

/** 要ログイン。運営管理（AAL2 の判定は requireAdmin が行う）。 */
const ADMIN_PROTECTED_PREFIXES = ["/admin"];

/** ログイン済みなら見せない画面。完了画面（/signup/done 等）は対象外にする。 */
const GUEST_ONLY_PATHS = ["/login", "/signup", "/signup/general"];

export const GENERAL_LOGIN_PATH = "/login";
export const SELLER_LOGIN_PATH = "/sellers/login";

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return false;

  return (
    matchesPrefix(pathname, GENERAL_PROTECTED_PREFIXES) ||
    matchesPrefix(pathname, SELLER_PROTECTED_PREFIXES) ||
    matchesPrefix(pathname, ADMIN_PROTECTED_PREFIXES)
  );
}

export function loginPathFor(pathname: string): string {
  return matchesPrefix(pathname, SELLER_PROTECTED_PREFIXES)
    ? SELLER_LOGIN_PATH
    : GENERAL_LOGIN_PATH;
}

/**
 * 未ログイン／ログイン済みで飛ばす先を決める。飛ばさない場合は null。
 * @param pathnameWithQuery 戻り先として `?next=` に載せる path（クエリ込み）
 */
export function decideAuthRedirect(
  pathname: string,
  pathnameWithQuery: string,
  isSignedIn: boolean,
): string | null {
  if (!isSignedIn && isProtectedPath(pathname)) {
    const loginPath = loginPathFor(pathname);

    return `${loginPath}?next=${encodeURIComponent(pathnameWithQuery)}`;
  }

  if (isSignedIn && GUEST_ONLY_PATHS.includes(pathname)) {
    return "/";
  }

  return null;
}
