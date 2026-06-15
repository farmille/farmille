"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ReviewForm } from "./review-form";

type Review = {
  id: string;
  user_name: string | null;
  rating: number;
  body: string;
  created_at: string;
};

type ExistingImage = {
  url: string;
  path: string;
};

type Props = {
  productId: string;
  review: Review;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

export function MyReviewRow({ productId, review }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startEditing() {
    setError(null);
    setLoadingImages(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const folder = `${user.id}/${review.id}`;
        const { data: files } = await supabase.storage
          .from("review-images")
          .list(folder);
        const images: ExistingImage[] = (files ?? [])
          .filter((f) => f.name && !f.name.startsWith("."))
          .map((f) => {
            const path = `${folder}/${f.name}`;
            const { data } = supabase.storage
              .from("review-images")
              .getPublicUrl(path);
            return { url: data.publicUrl, path };
          });
        setExistingImages(images);
      }
    } catch {
      // 取得失敗時は画像なしで編集モードに入る
      setExistingImages([]);
    } finally {
      setLoadingImages(false);
      setEditing(true);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    const ok = window.confirm("このレビューを削除しますか？");
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.push("/login?expired=1");
        return;
      }
      if (!res.ok && res.status !== 204) {
        setError("削除に失敗しました。時間をおいて再度お試しください");
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("削除に失敗しました");
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <li className="rounded-md border border-border bg-card p-4 space-y-2">
        <ReviewForm
          productId={productId}
          mode="edit"
          initialValues={{
            reviewId: review.id,
            rating: review.rating,
            body: review.body,
            existingImages,
          }}
          onCancel={() => {
            setEditing(false);
            setExistingImages([]);
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-md border border-border bg-card p-4 space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-foreground">
          {review.user_name ?? "匿名ユーザー"}
          <span className="ml-2 inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-xs text-primary">
            あなたの投稿
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(review.created_at)}
        </span>
      </div>
      <div className="text-sm text-foreground">
        {"★".repeat(review.rating)}
        <span className="text-muted-foreground">
          {"☆".repeat(5 - review.rating)}
        </span>
      </div>
      <p className="text-base text-foreground whitespace-pre-wrap">
        {review.body}
      </p>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startEditing}
          disabled={deleting || loadingImages}
        >
          {loadingImages ? "読み込み中…" : "編集"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "削除中…" : "削除"}
        </Button>
      </div>
    </li>
  );
}
