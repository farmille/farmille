"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Admin Articles CMS hero アップロード (ADR-0014)。
// - バケット: articles-hero (public read / admin+AAL2 write)
// - path 規約: articles-hero/{articleId}/{uuid}.{ext} (新規は articleId="_new")
// - 圧縮: 長辺 1600px / JPEG q0.8 を Canvas API で実施 (新規依存を足さない方針)。
//   browser-image-compression は未導入のため canvas で代替 (PNG の透過は保持しないが
//   hero 画像は写真前提で許容、ADR-0014 §2.1 の MIME 制約とも整合)。
// - upload は §1.3 例外 (Supabase Storage 直叩き) に該当。frontend からは
//   storage.remove() を呼ばない (旧画像はバケットに残す、ADR-0014 §2.4)。

const MAX_SOURCE_BYTES = 8 * 1024 * 1024; // 圧縮前ソースの上限 (UX 先行検証)
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const isAcceptedMime = (v: string): boolean =>
  (ACCEPTED_MIME as readonly string[]).includes(v);

async function compressToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas_unavailable");
  }
  // 透過 PNG を JPEG 化する際に黒くならないよう白背景で塗る。
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("compress_failed");
  return blob;
}

type Props = {
  /** 既存記事の id。新規作成時は "_new" を渡す (ADR-0014 §2.5)。 */
  articleId: string;
  /** 現在の hero URL (DB 由来 or 直前アップロード)。 */
  value: string | null;
  /** アップロード完了 (URL) / クリア (null) 時に呼ばれる。 */
  onChange: (heroUrl: string | null) => void;
  disabled?: boolean;
};

export function HeroImageUpload({
  articleId,
  value,
  onChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = useCallback(
    async (file: File) => {
      setError(null);
      if (!isAcceptedMime(file.type)) {
        setError("JPEG / PNG / WebP のみアップロードできます");
        return;
      }
      if (file.size > MAX_SOURCE_BYTES) {
        setError("元画像は 8MB 以下にしてください");
        return;
      }

      setUploading(true);
      try {
        let blob: Blob;
        try {
          blob = await compressToJpeg(file);
        } catch {
          setError("画像の圧縮に失敗しました。別の画像をお試しください");
          return;
        }

        const supabase = createClient();
        const nonce =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}`;
        const path = `${articleId}/${nonce}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("articles-hero")
          .upload(path, blob, { upsert: false, contentType: "image/jpeg" });
        if (uploadError) {
          setError(`アップロードに失敗しました: ${uploadError.message}`);
          return;
        }
        const { data } = supabase.storage
          .from("articles-hero")
          .getPublicUrl(path);
        onChange(data.publicUrl);
      } finally {
        setUploading(false);
      }
    },
    [articleId, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-28 w-44 rounded object-cover bg-muted border border-border flex-shrink-0"
          />
        ) : (
          <div
            aria-hidden
            className="h-28 w-44 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center flex-shrink-0"
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
        )}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIME.join(",")}
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePick(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            loading={uploading}
            loadingText="アップロード中…"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="mr-1 h-4 w-4" aria-hidden />
            画像を選択
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => {
                setError(null);
                onChange(null);
              }}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-4 w-4" aria-hidden />
              hero を外す
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            JPEG / PNG / WebP、長辺 1600px に自動圧縮。公開バケット (誰でも閲覧可)。
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
