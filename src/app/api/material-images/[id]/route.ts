import { readMaterialPageImage } from "@/server/material-page-image";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let image: Blob | null;
  try {
    image = await readMaterialPageImage(id);
  } catch (error) {
    console.error("[material-image] 画像の取得に失敗", error);
    return Response.json({ ok: false, error: "internal" }, { status: 500 });
  }
  if (!image) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  return new Response(image, {
    headers: {
      "Content-Type": image.type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
