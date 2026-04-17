export async function GET() {
  try {
    await fetch(`${process.env.API_URL}/health`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
