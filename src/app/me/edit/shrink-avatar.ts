import { AVATAR_MAX_BYTES } from "@/lib/avatar-rules";

/** アイコンとして保存する画像の長辺。高精細な画面で拡大しても粗く見えない大きさに留める。 */
export const AVATAR_MAX_EDGE = 1600;

/** 画質を高い順に試し、上限に収まった最初のものを使う。 */
const JPEG_QUALITIES = [0.92, 0.85, 0.75];

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 長辺を AVATAR_MAX_EDGE に収めた幅と高さ。小さい画像は拡大しない。 */
export function shrunkAvatarSize(width: number, height: number) {
  const scale = Math.min(1, AVATAR_MAX_EDGE / Math.max(width, height));

  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * スマートフォンで撮った写真は数MBあり、送信の上限を超えるので、送る前にブラウザで JPEG に縮める。
 * 上限内で受け付ける形式の小さな画像は、PNG の透過などを保つためそのまま送る。
 * ブラウザが読めない画像もそのまま送り、サーバー側の検査に任せる。
 */
export async function shrinkAvatar(file: File): Promise<File> {
  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const size = shrunkAvatarSize(bitmap.width, bitmap.height);
    const fits = size.width === bitmap.width && file.size <= AVATAR_MAX_BYTES;

    if (fits && ACCEPTED_TYPES.has(file.type)) return file;

    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");

    if (context === null) return file;
    // JPEG は透過を持てないので、透過部分は白にする
    context.fillStyle = "#fff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(bitmap, 0, 0, size.width, size.height);

    for (const quality of JPEG_QUALITIES) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );

      if (blob === null) return file;

      if (blob.size <= AVATAR_MAX_BYTES) {
        return new File([blob], `${file.name.replace(/\.[^.]*$/, "")}.jpg`, {
          type: "image/jpeg",
        });
      }
    }

    return file;
  } finally {
    bitmap.close();
  }
}

/** フォームの avatar を縮めた画像に差し替える。 */
export async function shrinkAvatarIn(formData: FormData): Promise<void> {
  const avatar = formData.get("avatar");

  if (!(avatar instanceof File) || avatar.size === 0) return;
  formData.set("avatar", await shrinkAvatar(avatar));
}
