"use client";

import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";

import {
  createReviewAction,
  type ReviewActionState,
  updateReviewAction,
} from "@/app/materials/[id]/review/actions";
import { FormMessage, SwitchToggle } from "@/components/auth/fields";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { StarRating } from "@/components/star-rating";
import { Textarea } from "@/components/textarea";
import { clientEnv } from "@/env";
import type { PurchaseChannel } from "@/server/mutations/reviews";
import type { ReviewCropOption, ReviewPhoto } from "@/server/queries/reviews";
import type { Database } from "@/types/database.types";
import { css } from "../../../../../../styled-system/css";

const REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const REVIEW_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type PendingPhoto = {
  key: string;
  file: File;
  caption: string;
};

type ReviewFormValues = {
  cropId: string;
  rating: number;
  body: string;
  purchaseChannel: PurchaseChannel | null;
  hasControlPlot: boolean;
  pesticideAck: boolean;
  photos: ReviewPhoto[];
};

type ReviewFormProps = {
  mode: "create" | "edit";
  material: {
    id: string;
    name: string;
    manufacturerName: string;
  };
  userId: string;
  crops: ReviewCropOption[];
  initialValues: ReviewFormValues;
  reviewId?: string;
  profileCropDefaulted?: boolean;
  existingReviewNotice?: boolean;
};

const initialActionState: ReviewActionState = { status: "idle" };

const field = css({
  mt: "5",
  _first: { mt: "0" },
});

const label = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "700",
});

const guide = css({
  m: "0",
  mt: "1.5",
  fontSize: "xs",
  color: "text.muted",
  lineHeight: "1.55",
});

const fieldError = css({
  m: "0",
  mt: "1.5",
  fontSize: "sm",
  color: "accent.danger",
  fontWeight: "700",
});

const photoCard = css({
  p: "3",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
});

function extensionFor(file: File): "jpg" | "png" | "webp" {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  throw new TypeError("対応していない画像形式です。");
}

function photoValidationMessage(file: File): string | null {
  if (!REVIEW_PHOTO_TYPES.some((type) => type === file.type)) {
    return `${file.name} は jpeg・png・webp のいずれかを選択してください。`;
  }
  if (file.size > REVIEW_PHOTO_MAX_BYTES) {
    return `${file.name} は5MB以下の画像を選択してください。`;
  }
  return null;
}

export function ReviewForm({
  mode,
  material,
  userId,
  crops,
  initialValues,
  reviewId,
  profileCropDefaulted = false,
  existingReviewNotice = false,
}: ReviewFormProps) {
  if (mode === "edit" && reviewId === undefined) {
    throw new Error("編集フォームにはレビュー ID が必要です。");
  }

  const supabase = useMemo(
    () => createBrowserClient<Database>(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey),
    [],
  );
  const action =
    mode === "create"
      ? createReviewAction.bind(null, material.id)
      : updateReviewAction.bind(null, material.id, reviewId as string);
  const [state, formAction, actionPending] = useActionState(action, initialActionState);
  const [rating, setRating] = useState(initialValues.rating);
  const [pesticideAck, setPesticideAck] = useState(initialValues.pesticideAck);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const isPending = uploading || actionPending;
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.status === "idle") return;
    const settledState = state;

    let cancelled = false;

    async function finishAction() {
      if (settledState.cleanupPaths !== undefined && settledState.cleanupPaths.length > 0) {
        const { error } = await supabase.storage
          .from("review-photos")
          .remove(settledState.cleanupPaths);
        if (error !== null && !cancelled) {
          setLocalError(
            "一時アップロードした写真を削除できませんでした。再送信せずお待ちください。",
          );
        }
      }
    }

    void finishAction();

    return () => {
      cancelled = true;
    };
  }, [state, supabase]);

  function addPhotos(files: FileList | null) {
    if (files === null) return;
    const additions: PendingPhoto[] = [];

    for (const file of Array.from(files)) {
      const validationMessage = photoValidationMessage(file);
      if (validationMessage !== null) {
        setLocalError(validationMessage);
        return;
      }

      additions.push({ key: crypto.randomUUID(), file, caption: "" });
    }

    setLocalError(null);
    setPendingPhotos((current) => [...current, ...additions]);
  }

  async function submit(formData: FormData) {
    setUploading(true);
    setLocalError(null);
    const uploaded: Array<{ path: string; caption: string | null }> = [];

    try {
      for (const photo of pendingPhotos) {
        const path = `${userId}/${crypto.randomUUID()}.${extensionFor(photo.file)}`;
        const { error } = await supabase.storage.from("review-photos").upload(path, photo.file, {
          cacheControl: "3600",
          contentType: photo.file.type,
          upsert: false,
        });

        if (error !== null) {
          if (uploaded.length > 0) {
            await supabase.storage.from("review-photos").remove(uploaded.map(({ path }) => path));
          }
          setLocalError(`写真をアップロードできませんでした。${error.message}`);
          return;
        }

        const caption = photo.caption.trim();
        uploaded.push({ path, caption: caption.length === 0 ? null : caption });
      }

      formData.set("newPhotos", JSON.stringify(uploaded));
      startTransition(() => {
        formAction(formData);
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={submit}>
      {existingReviewNotice ? (
        <FormMessage tone="info">
          この資材には投稿済みのレビューがあります。内容を編集できます。
        </FormMessage>
      ) : null}
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {localError === null ? null : <FormMessage tone="error">{localError}</FormMessage>}

      <div
        className={css({
          mt: "3",
          p: "3",
          bg: "green.soft2",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.default",
          borderRadius: "card",
        })}
      >
        <span className={css({ display: "block", fontSize: "2xs", color: "text.muted" })}>
          対象資材
        </span>
        <strong className={css({ display: "block", mt: "0.5", fontSize: "md" })}>
          {material.name}
        </strong>
        <span className={css({ display: "block", mt: "0.5", fontSize: "xs", color: "text.muted" })}>
          {material.manufacturerName}
        </span>
      </div>

      <div className={field}>
        <label className={label} htmlFor="review-crop">
          作目 <Badge variant="required">必須</Badge>
          {profileCropDefaulted ? (
            <span className={css({ fontSize: "xs", color: "text.muted", fontWeight: "400" })}>
              プロフィールから自動入力
            </span>
          ) : null}
        </label>
        <Select id="review-crop" name="cropId" defaultValue={initialValues.cropId} required>
          <option value="" disabled>
            作目を選択してください
          </option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {crop.name}
            </option>
          ))}
        </Select>
        {fieldErrors?.cropId === undefined ? null : (
          <p className={fieldError}>{fieldErrors.cropId}</p>
        )}
      </div>

      <div className={field}>
        <span className={label}>
          総合評価 <Badge variant="required">必須</Badge>
        </span>
        <StarRating mode="input" value={rating} onChange={setRating} name="rating" />
        {fieldErrors?.rating === undefined ? null : (
          <p className={fieldError}>{fieldErrors.rating}</p>
        )}
      </div>

      <div className={field}>
        <label className={label} htmlFor="review-body">
          レビュー本文 <Badge variant="required">必須</Badge>
        </label>
        <Textarea
          id="review-body"
          name="body"
          size="lg"
          defaultValue={initialValues.body}
          placeholder="作物・使用時期・使い方・感じた変化を入力してください"
          required
        />
        <p className={guide}>作物・使用時期・使い方・感じた変化が入っていると参考になります。</p>
        {fieldErrors?.body === undefined ? null : <p className={fieldError}>{fieldErrors.body}</p>}
      </div>

      <div className={field}>
        <span className={label}>
          写真 <Badge variant="optional">任意・複数可</Badge>
        </span>
        {initialValues.photos.length === 0 ? null : (
          <div className={css({ display: "grid", gap: "2", mb: "2" })}>
            {initialValues.photos.map((photo) => (
              <div key={photo.id} className={photoCard}>
                <input type="hidden" name="existingPhotoId" value={photo.id} />
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "レビュー写真"}
                  width={80}
                  height={80}
                  unoptimized
                  className={css({
                    w: "20",
                    h: "20",
                    objectFit: "cover",
                    borderRadius: "button",
                    mb: "2",
                  })}
                />
                <Input
                  name={`existingPhotoCaption-${photo.id}`}
                  defaultValue={photo.caption ?? ""}
                  placeholder="写真の説明"
                  aria-label="既存写真の説明"
                />
                <label
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "2",
                    mt: "2",
                    fontSize: "sm",
                    color: "accent.danger",
                  })}
                >
                  <input type="checkbox" name="removePhotoId" value={photo.id} />
                  この写真を削除する
                </label>
              </div>
            ))}
          </div>
        )}

        {pendingPhotos.length === 0 ? null : (
          <div className={css({ display: "grid", gap: "2", mb: "2" })}>
            {pendingPhotos.map((photo) => (
              <div key={photo.key} className={photoCard}>
                <p className={css({ m: "0", mb: "2", fontSize: "sm", fontWeight: "700" })}>
                  {photo.file.name}
                </p>
                <Input
                  value={photo.caption}
                  onChange={(event) => {
                    setPendingPhotos((current) =>
                      current.map((item) =>
                        item.key === photo.key ? { ...item, caption: event.target.value } : item,
                      ),
                    );
                  }}
                  placeholder="例）散布前の様子"
                  aria-label={`${photo.file.name}の説明`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPendingPhotos((current) => current.filter((item) => item.key !== photo.key))
                  }
                >
                  選択を解除
                </Button>
              </div>
            ))}
          </div>
        )}

        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          aria-label="レビュー写真を追加"
          onChange={(event) => {
            addPhotos(event.target.files);
            event.target.value = "";
          }}
        />
        <p className={guide}>1枚あたり5MB以下の jpeg・png・webp を選択できます。</p>
        {fieldErrors?.photos === undefined ? null : (
          <p className={fieldError}>{fieldErrors.photos}</p>
        )}
      </div>

      <div className={field}>
        <label className={label} htmlFor="purchase-channel">
          購入場所 <Badge variant="optional">任意</Badge>
        </label>
        <Select
          id="purchase-channel"
          name="purchaseChannel"
          defaultValue={initialValues.purchaseChannel ?? ""}
        >
          <option value="">選択しない</option>
          <option value="ja">JA</option>
          <option value="home_center">ホームセンター</option>
          <option value="ec">ECサイト</option>
          <option value="direct">製造元・販売元から直接</option>
          <option value="other">その他</option>
        </Select>
        <p className={guide}>購入場所は公開されません。</p>
        {fieldErrors?.purchaseChannel === undefined ? null : (
          <p className={fieldError}>{fieldErrors.purchaseChannel}</p>
        )}
      </div>

      <div className={field}>
        <span className={label}>
          対照区の有無 <Badge variant="optional">任意</Badge>
        </span>
        <SwitchToggle
          name="hasControlPlot"
          label="対照区を設けて比較した"
          defaultChecked={initialValues.hasControlPlot}
        />
      </div>

      <div className={field}>
        <label
          className={css({
            display: "flex",
            alignItems: "flex-start",
            gap: "2.5",
            p: "3",
            bg: "amber.soft",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "border.default",
            borderRadius: "card",
            fontSize: "sm",
            lineHeight: "1.6",
            cursor: "pointer",
          })}
        >
          <input
            type="checkbox"
            name="pesticideAck"
            required
            checked={pesticideAck}
            onChange={(event) => setPesticideAck(event.target.checked)}
            className={css({ mt: "1", flexShrink: "0" })}
          />
          <span>
            このレビューには、病害虫の防除・殺菌・殺虫・農薬の代替など、農薬的な効果を断定する表現を含めていません
            <span className={css({ color: "accent.danger", fontWeight: "700" })}>（必須）</span>
          </span>
        </label>
        {fieldErrors?.pesticideAck === undefined ? null : (
          <p className={fieldError}>{fieldErrors.pesticideAck}</p>
        )}
      </div>

      <div className={css({ display: "grid", gap: "2", mt: "6" })}>
        <Button type="submit" disabled={isPending || rating === 0 || !pesticideAck}>
          {isPending ? "送信中…" : mode === "create" ? "投稿する" : "変更を保存する"}
        </Button>
        <Link
          href={`/materials/${material.id}`}
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: "3",
            color: "brand.primary",
            fontSize: "md",
            fontWeight: "700",
            textDecoration: "none",
          })}
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
