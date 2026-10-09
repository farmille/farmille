import * as v from "valibot";
import { ApplicationError } from "@/server/company-application-auth";
import { randomBytes } from "node:crypto";
import { clientEnv } from "@/env";
import { confirmReceiptAccess } from "@/server/company-application-access";

export async function GET() {
  const nonce = randomBytes(16).toString("base64");
  return new Response(
    `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>申請用メールアドレスの確認</title><main><h1>申請用メールアドレスの確認</h1><p>確認後、申請フォームまたは受付票を開きます。メールアドレスの確認は、法人の申請権限を確認するものではありません。</p><form method="post"><input type="hidden" name="token" id="token"><button type="submit">メールアドレスを確認する</button></form></main><script nonce="${nonce}">document.getElementById('token').value=location.hash.slice(1);history.replaceState(null,'',location.pathname);</script></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const sameOriginForm =
    origin === "null" && request.headers.get("sec-fetch-site") === "same-origin";
  if (origin !== new URL(clientEnv.siteUrl).origin && !sameOriginForm)
    return new Response("この操作は許可されていません。", { status: 403 });
  const form = await request.formData();
  const token = v.safeParse(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)), form.get("token"));
  if (!token.success) return new Response("確認リンクを開き直してください。", { status: 400 });
  try {
    const destination = await confirmReceiptAccess(token.output);
    return Response.redirect(new URL(destination, clientEnv.siteUrl), 303);
  } catch (error) {
    if (!(error instanceof ApplicationError) || error.code === "internal")
      return new Response("確認処理に失敗しました。時間をおいて再度お試しください。", {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      });
    return new Response(
      "確認リンクが無効か、有効期限が切れています。受付ページから確認メールを再発行してください。",
      { status: 400, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } },
    );
  }
}
