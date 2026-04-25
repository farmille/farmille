"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { X, ImagePlus, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];

export type ExistingProductImage = {
  url: string;
  path: string;
};

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  /** 編集モードでの既存画像 (順序は表示順と一致) */
  existingImages?: ExistingProductImage[];
  onExistingOrderChange?: (images: ExistingProductImage[]) => void;
  removedPaths?: string[];
  onToggleRemove?: (path: string) => void;
};

export function ProductImageUpload({
  files,
  onChange,
  disabled,
  existingImages = [],
  onExistingOrderChange,
  removedPaths = [],
  onToggleRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keptExistingCount = existingImages.filter(
    (img) => !removedPaths.includes(img.path),
  ).length;
  const remaining = Math.max(0, MAX_FILES - keptExistingCount);

  const addFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const accepted: File[] = [];
      for (const f of incoming) {
        if (!ACCEPTED_MIME.includes(f.type)) {
          setError("JPEG / PNG / WebP のみアップロードできます");
          continue;
        }
        if (f.size > MAX_SIZE_BYTES) {
          setError("画像 1 枚あたり 5MB までです");
          continue;
        }
        accepted.push(f);
      }
      const next = [...files, ...accepted].slice(0, remaining);
      if (files.length + accepted.length > remaining) {
        setError(
          `画像は既存を含め最大 ${MAX_FILES} 枚までです (残り ${remaining} 枚)`,
        );
      }
      onChange(next);
    },
    [files, onChange, remaining],
  );

  const removeAt = useCallback(
    (idx: number) => {
      onChange(files.filter((_, i) => i !== idx));
    },
    [files, onChange],
  );

  const moveExisting = useCallback(
    (idx: number, delta: -1 | 1) => {
      if (!onExistingOrderChange) return;
      const next = [...existingImages];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return;
      [next[idx], next[target]] = [next[target], next[idx]];
      onExistingOrderChange(next);
    },
    [existingImages, onExistingOrderChange],
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "rounded-md border border-dashed border-border bg-muted/40 p-6 text-center cursor-pointer transition-colors",
          dragOver && "bg-muted",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIME.join(",")}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) {
              addFiles(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />
        <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-foreground">
          画像をドラッグ&ドロップ、またはクリックで選択
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG / PNG / WebP、1 枚あたり最大 5MB、最大 {MAX_FILES} 枚
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {(existingImages.length > 0 || files.length > 0) && (
        <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {existingImages.map((img, idx) => {
            const marked = removedPaths.includes(img.path);
            const canMoveUp = idx > 0 && !marked;
            const canMoveDown = idx < existingImages.length - 1 && !marked;
            return (
              <li
                key={img.path}
                className={cn(
                  "relative aspect-square rounded-sm border border-border overflow-hidden bg-muted",
                  marked && "opacity-40",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 33vw, 20vw"
                  className="object-cover"
                />
                {marked && (
                  <span className="absolute bottom-1 left-1 rounded-sm bg-destructive px-1 py-0.5 text-xs text-destructive-foreground">
                    削除予定
                  </span>
                )}
                {onToggleRemove && (
                  <Button
                    type="button"
                    size="icon"
                    variant={marked ? "outline" : "destructive"}
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRemove(img.path);
                    }}
                    disabled={disabled}
                    aria-label={marked ? "削除を取り消す" : "この画像を削除"}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {onExistingOrderChange && !marked && (
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-6 w-6 bg-background/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveExisting(idx, -1);
                      }}
                      disabled={disabled || !canMoveUp}
                      aria-label="前に移動"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-6 w-6 bg-background/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveExisting(idx, 1);
                      }}
                      disabled={disabled || !canMoveDown}
                      aria-label="後ろに移動"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
          {files.map((f, idx) => {
            const url = URL.createObjectURL(f);
            return (
              <li
                key={`${f.name}-${idx}`}
                className="relative aspect-square rounded-sm border border-border overflow-hidden bg-muted"
              >
                <Image
                  src={url}
                  alt={f.name}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 33vw, 20vw"
                  className="object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(idx);
                  }}
                  disabled={disabled}
                  aria-label="画像を削除"
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
