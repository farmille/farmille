// Resolve a post-login / post-MFA return path (?next=) without open-redirect (CWE-601).
//
// Fix for a vuln found in the 2026-06-15 deploy-readiness review:
//   the old check only blocked literal "//" and "/\\", letting "/%09/evil.com" through.
//   useSearchParams decodes the value, so the hidden field carries a raw TAB, and the
//   WHATWG URL parser (Next server redirect / the browser) resolves that to https://evil.com/
//   (verified: new URL("/<TAB>/evil.com", base).origin !== base.origin).
//
// Two layers of defense:
//   1. Reject any control char / whitespace / backslash up front (the raw material the URL
//      parser strips or normalizes into "//"). Done with charCodeAt to avoid fragile regex.
//   2. As a backstop, run it through the URL parser and confirm it resolves to the base origin.
//
// Returns a same-site relative path (with ?query/#hash). null when unsafe -> caller falls back.
function hasUnsafeChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    // control chars + space (<= 0x20), DEL (0x7F), backslash (0x5C):
    // the URL parser strips/normalizes these into "//" and escapes to an external origin.
    if (c <= 0x20 || c === 0x7f || c === 0x5c) return true;
  }
  return false;
}

export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  if (hasUnsafeChar(raw)) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  // Reject the auth pages themselves to avoid redirect loops.
  if (raw.startsWith("/login") || raw.startsWith("/signup")) return null;
  try {
    const u = new URL(raw, "http://localhost");
    if (u.origin !== "http://localhost") return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}
