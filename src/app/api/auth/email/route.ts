import { deliverAuthEmail, verifyAuthEmail } from "@/server/accounts/auth-email";

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();

  if (body.length > 100_000)
    return Response.json({ ok: false, error: "invalid_body" }, { status: 413 });
  let input;

  try {
    input = verifyAuthEmail(body, request.headers);
  } catch {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    await deliverAuthEmail(input);
  } catch {
    // 配送エラーにも宛先やトークンが含まれ得るため、例外本文は記録しない。
    console.error("[auth-email] 認証メールを配送できませんでした。");

    return Response.json({ ok: false, error: "internal" }, { status: 500 });
  }

  return Response.json({});
}
