/**
 * Supabase Storage の public URL から bucket 以降の path を抽出する。
 *
 * URL 形式 (2026-04 時点):
 *   `https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>`
 *
 * 期待する bucket を渡し、URL が想定外の形式（別 host / 別 bucket / 想定外の
 * Supabase URL レイアウト）の場合は null を返す防衛実装。
 *
 * skill §3.2 バリデーション原則: BFF 側の `_image_path.py` と対で、フロントでも
 * 取れた path を送信前に最低限チェックできるようにする。
 *
 * 参照: docs/specs/image-edit-and-launch-ready.md §5.3 / §11.3
 */
export function publicUrlToPath(
  publicUrl: string,
  bucket: string,
): string | null {
  try {
    const url = new URL(publicUrl);
    if (!url.hostname.endsWith(".supabase.co")) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    const path = url.pathname.slice(idx + marker.length);
    if (!path || path.includes("..")) return null;
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}
