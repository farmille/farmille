import type { NextRequest } from "next/server";

/**
 * ブラウザが実際に使ったオリジンで絶対 URL を組む。
 * `request.url` は開発サーバーで localhost に正規化されるため、Cookie を張った直後の
 * リダイレクト先が別オリジンになりうる。Host ヘッダを優先して同一オリジンを保つ。
 */
export function sameOriginUrl(request: NextRequest, path: string): URL {
  const host = request.headers.get("host");

  // Host が無いのは HTTP/1.0 の直接接続のみ。その場合は Next の解決結果に委ねる。
  if (host === null) return new URL(path, request.url);

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(":", "");

  return new URL(path, `${protocol}://${host}`);
}
