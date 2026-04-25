"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ReviewImageUpload } from "./review-image-upload";

const BODY_MAX = 2000;
const BODY_MIN = 1;

type Mode = "create" | "edit";

type ExistingImage = {
  url: string;
  path: string;
};

type InitialValues = {
  reviewId: string;
  rating: number;
  body: string;
  existingImages?: ExistingImage[];
};

type Props = {
  productId: string;
  mode?: Mode;
  initialValues?: InitialValues;
  onCancel?: () => void;
};

type ErrorCode =
  | "invalid_body"
  | "unauthorized"
  | "forbidden"
  | "review_already_exists"
  | "image_upload_failed"
  | "review_not_found"
  | "not_owner"
  | "unknown";

function errorMessage(code: ErrorCode): string {
  switch (code) {
    case "invalid_body":
      return "入力内容を確認してください";
    case "unauthorized":
      return "ログインが必要です";
    case "forbidden":
    case "not_owner":
      return "この操作を行う権限がありません";
    case "review_already_exists":
      return "この資材には既にレビューを投稿済みです";
    case "review_not_found":
      return "対象のレビューが見つかりませんでした";
    case "image_upload_failed":
      return "画像のアップロードに失敗しました。時間をおいて再度お試しください";
    default:
      return "保存に失敗しました。時間をおいて再度お試しください";
  }
}

export function ReviewForm({
  productId,
  mode = "create",
  initialValues,
  onCancel,
}: Props) {
  const router = useRouter();
  const isEdit = mode === "edit" && initialValues !== undefined;

  const [rating, setRating] = useState(isEdit ? initialValues!.rating : 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState(isEdit ? initialValues!.body : "");
  const [files, setFiles] = useState<File[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const existingImages = isEdit ? (initialValues!.existingImages ?? []) : [];

  const toggleRemove = (path: string) => {
    setRemovedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const bodyLen = body.length;
  const canSubmit =
    rating >= 1 && rating <= 5 && bodyLen >= BODY_MIN && bodyLen <= BODY_MAX;

  async function uploadImages(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    reviewId: string,
  ) {
    for (const [idx, file] of files.entries()) {
      const path = `${userId}/${reviewId}/${idx}_${file.name}`;
      const { error } = await supabase.storage
        .from("review-images")
        .upload(path, file, { upsert: false });
      if (error) throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErrorCode(null);

    try {
      if (isEdit) {
        const reviewId = initialValues!.reviewId;
        const supabase = createClient();

        if (files.length > 0) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            setErrorCode("unauthorized");
            setSubmitting(false);
            return;
          }
          const nonce = crypto.randomUUID();
          try {
            for (const [idx, file] of files.entries()) {
              const path = `${user.id}/${reviewId}/${nonce}_${idx}_${file.name}`;
              const { error } = await supabase.storage
                .from("review-images")
                .upload(path, file, { upsert: false });
              if (error) throw error;
            }
          } catch {
            setErrorCode("image_upload_failed");
            setSubmitting(false);
            return;
          }
        }

        const res = await fetch(`/api/reviews/${reviewId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, body, remove_paths: removedPaths }),
        });
        if (res.status === 401) {
          router.push("/login?expired=1");
          return;
        }
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setErrorCode(mapStatus(res.status, data.error));
          setSubmitting(false);
          return;
        }
        setFiles([]);
        setRemovedPaths([]);
        router.refresh();
        onCancel?.();
        return;
      }

      const reviewId = crypto.randomUUID();
      const supabase = createClient();

      if (files.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setErrorCode("unauthorized");
          setSubmitting(false);
          return;
        }
        try {
          await uploadImages(supabase, user.id, reviewId);
        } catch {
          setErrorCode("image_upload_failed");
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          review_id: reviewId,
          rating,
          body,
        }),
      });

      if (res.status === 401) {
        router.push("/login?expired=1");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorCode(mapStatus(res.status, data.error));
        setSubmitting(false);
        return;
      }

      setRating(0);
      setBody("");
      setFiles([]);
      router.refresh();
    } catch {
      setErrorCode("unknown");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-md border border-border bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="review-rating">評価</Label>
        <div
          id="review-rating"
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="評価"
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hoverRating || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} 点`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={submitting}
                className="p-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    active
                      ? "fill-primary text-primary"
                      : "text-muted-foreground",
                  )}
                />
              </button>
            );
          })}
          <span className="ml-2 text-sm text-muted-foreground">
            {rating > 0 ? `${rating} / 5` : "未選択"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-body">本文</Label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="使用感・効果・散布条件などを共有してください"
          rows={6}
          disabled={submitting}
          maxLength={BODY_MAX}
        />
        <p
          className={cn(
            "text-xs text-right",
            bodyLen > BODY_MAX
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {bodyLen} / {BODY_MAX}
        </p>
      </div>

      <div className="space-y-2">
        <Label>画像(任意)</Label>
        <ReviewImageUpload
          files={files}
          onChange={setFiles}
          disabled={submitting}
          existingImages={existingImages}
          removedPaths={removedPaths}
          onToggleRemove={isEdit ? toggleRemove : undefined}
        />
      </div>

      {errorCode && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage(errorCode)}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {isEdit && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            キャンセル
          </Button>
        )}
        <Button
          type="submit"
          loading={submitting}
          loadingText={isEdit ? "更新中…" : "投稿中…"}
          disabled={!canSubmit}
        >
          {isEdit ? "更新" : "レビューを投稿"}
        </Button>
      </div>
    </form>
  );
}

function mapStatus(status: number, error?: string): ErrorCode {
  if (status === 409) return "review_already_exists";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "review_not_found";
  if (status === 400 || status === 422) return "invalid_body";
  return (error as ErrorCode) ?? "unknown";
}
