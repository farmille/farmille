"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, UserCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Phase 19 アバターアップロード UI (spec §6.3)。
// 制約:
//   - 2MB 上限 (バケット側でも 2MB / MIME 制約あり、ここはクライアント先行検証)
//   - JPEG / PNG / WebP のみ
//   - path 形式: {userId}/avatar/{nonce}_{filename}
//     - 第 1 階層 UID と 第 2 階層 'avatar' は Storage RLS でも強制 (ADR-0003 同パターン)
//   - upload は §1.3 例外 2 (Supabase Storage 直叩き) に該当。frontend からは
//     `supabase.storage.remove()` を一切呼ばない (削除は BFF 経由)。

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedMime = (typeof ACCEPTED_MIME)[number];

const isAcceptedMime = (v: string): v is AcceptedMime =>
  (ACCEPTED_MIME as readonly string[]).includes(v);

type Props = {
  userId: string;
  /** 現在の avatar 公開 URL (DB 由来)。null なら placeholder。 */
  currentAvatarUrl: string | null;
  /** upload 完了時に呼ばれる。null は「削除を選んだ」 */
  onChange: (avatarUrl: string | null) => void;
  /** 親フォームから渡される pending な avatar URL (state 二重管理を避ける)。 */
  value: string | null;
  disabled?: boolean;
};

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onChange,
  value,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const previewUrl = value ?? currentAvatarUrl;

  const handlePick = useCallback(
    async (file: File) => {
      setError(null);

      if (!isAcceptedMime(file.type)) {
        setError("JPEG / PNG / WebP のみアップロードできます");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError("画像は 2MB 以下にしてください");
        return;
      }

      const supabase = createClient();
      const nonce =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`;
      const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
      const path = `${userId}/avatar/${nonce}_${safeName}`;

      setUploading(true);
      try {
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, {
            upsert: false,
            contentType: file.type,
          });
        if (uploadError) {
          setError(`アップロードに失敗しました: ${uploadError.message}`);
          return;
        }
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        onChange(data.publicUrl);
      } finally {
        setUploading(false);
      }
    },
    [userId, onChange],
  );

  const handleClear = useCallback(() => {
    setError(null);
    onChange(null);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            width={96}
            height={96}
            unoptimized={previewUrl.startsWith("blob:")}
            className="h-24 w-24 rounded-full object-cover bg-muted flex-shrink-0"
          />
        ) : (
          <div
            aria-hidden
            className="h-24 w-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
          >
            <UserCircle className="h-16 w-16 text-muted-foreground" aria-hidden />
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
              if (f) {
                void handlePick(f);
              }
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
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || uploading}
              onClick={handleClear}
              className={cn("text-muted-foreground")}
            >
              <X className="mr-1 h-4 w-4" aria-hidden />
              アバターを削除
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            JPEG / PNG / WebP、2MB まで
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
