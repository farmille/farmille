"use client";

import { createAuthBrowserClient } from "@/lib/auth/browser";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";

import {
  createReviewAction,
  type ReviewActionState,
  updateReviewAction,
} from "@/app/materials/[id]/review/actions";
import {
  describedBy,
  FieldError,
  FormNotice,
  ImagePlaceholderIcon,
  OptionalBadge,
  RequiredBadge,
} from "@/app/_mock/FormParts";
import type { ReviewCropOption, ReviewPhoto } from "@/server/queries/reviews";

import { ReviewCropPicker } from "./ReviewCropPicker";

const REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const REVIEW_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type PendingPhoto = {
  key: string;
  file: File;
  caption: string;
  /** 選んだ写真の表示用（URL.createObjectURL）。外すときと画面を離れるときに解放する。 */
  previewUrl: string;
};

type ReviewFormValues = {
  cropIds: string[];
  rating: number;
  body: string;
  pesticideAck: boolean;
  photos: ReviewPhoto[];
};

type ReviewFormBaseProps = {
  material: {
    id: string;
    name: string;
    manufacturerName: string;
  };
  userId: string;
  crops: ReviewCropOption[];
  initialValues: ReviewFormValues;
  existingReviewNotice?: boolean;
};
type ReviewFormProps = ReviewFormBaseProps &
  ({ mode: "create"; reviewId?: never } | { mode: "edit"; reviewId: string });

const initialActionState: ReviewActionState = { status: "idle" };

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
  existingReviewNotice = false,
}: ReviewFormProps) {
  const supabase = useMemo(() => createAuthBrowserClient(), []);
  const action =
    mode === "create"
      ? createReviewAction.bind(null, material.id)
      : updateReviewAction.bind(null, material.id, reviewId);
  const [state, formAction, actionPending] = useActionState(action, initialActionState);
  const [selectedCropIds, setSelectedCropIds] = useState(initialValues.cropIds);
  const [rating, setRating] = useState(initialValues.rating);
  // form action の後に React が未制御の入力を初期値へ戻すため、本文は state で保持してエラー時も消さない。
  const [body, setBody] = useState(initialValues.body);
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

  // 画面を離れるときに、選んだ写真の表示用 URL を解放する。
  const pendingPreviewUrls = pendingPhotos.map((photo) => photo.previewUrl).join("\n");
  useEffect(() => {
    const urls = pendingPreviewUrls.length === 0 ? [] : pendingPreviewUrls.split("\n");
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [pendingPreviewUrls]);

  function addPhotos(files: FileList | null) {
    if (files === null) return;
    const additions: PendingPhoto[] = [];

    for (const file of Array.from(files)) {
      const validationMessage = photoValidationMessage(file);
      if (validationMessage !== null) {
        setLocalError(validationMessage);
        return;
      }
    }

    for (const file of Array.from(files)) {
      additions.push({
        key: crypto.randomUUID(),
        file,
        caption: "",
        previewUrl: URL.createObjectURL(file),
      });
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

  // 見本 S.reviewForm の `.body` の中身。スタイルは src/app/_mock/mock.css・forms.css（.fm 配下）。
  return (
    <form action={submit}>
      {existingReviewNotice ? (
        <FormNotice tone="info">
          この資材には投稿済みの感想口コミがあります。内容を編集できます。
        </FormNotice>
      ) : null}
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}
      {localError === null ? null : <FormNotice tone="error">{localError}</FormNotice>}

      <div className="card target" style={{ marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10.5 }}>
            対象資材
          </div>
          <div className="t-name">{material.name}</div>
          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
            {material.manufacturerName}
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="review-crop">
          作目
          <RequiredBadge />
          <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>
            1つ選択してください
          </span>
        </label>
        <ReviewCropPicker
          crops={crops}
          selectedCropIds={selectedCropIds}
          error={fieldErrors?.cropIds}
          onAdd={(cropId) => setSelectedCropIds([cropId])}
          onRemove={(cropId) =>
            setSelectedCropIds((current) => current.filter((id) => id !== cropId))
          }
        />
      </div>

      <fieldset
        className="field"
        aria-describedby={describedBy(fieldErrors?.rating && "review-rating-error")}
      >
        <legend className="field-label">
          総合評価
          <RequiredBadge />
        </legend>
        <div className="stars-input">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n}>
              <input
                type="radio"
                name="rating"
                value={n}
                aria-label={`${n}`}
                checked={rating === n}
                onChange={() => setRating(n)}
              />
              <span className={n <= rating ? undefined : "off"} aria-hidden="true">
                ★
              </span>
            </label>
          ))}
        </div>
        <FieldError id="review-rating-error" message={fieldErrors?.rating} />
      </fieldset>

      <div className="field">
        <label htmlFor="review-body">
          感想口コミ本文
          <RequiredBadge />
        </label>
        <textarea
          id="review-body"
          name="body"
          className="textarea big"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="自由に記入してください"
          aria-describedby={describedBy(
            "review-body-example",
            "review-body-guide",
            fieldErrors?.body && "review-body-error",
          )}
          aria-invalid={fieldErrors?.body ? true : undefined}
          required
        />
        <div>
          <div className="muted" style={{ fontSize: 10.5, margin: "8px 0 4px" }}>
            記入例
          </div>
          <div className="quote-box" id="review-body-example" style={{ marginTop: 0 }}>
            トマト（ハウス栽培）で、定植後から2週間おきに灌水と合わせて使いました。1ヶ月ほどで根張りがしっかりしてきて、高温が続いた時期も葉のしおれが少なかったように感じます。
          </div>
        </div>
        <div className="fguide" id="review-body-guide" style={{ marginTop: 7 }}>
          作物・使用時期・使い方・感じた変化が入っていると参考になります。もっと詳しく書きたい場合は「
          <Link className="text-link" href={`/materials/${material.id}/report/new`}>
            実証詳細レポート入力
          </Link>
          」から。
        </div>
        <FieldError id="review-body-error" message={fieldErrors?.body} />
      </div>

      <fieldset
        className="field"
        aria-describedby={describedBy(
          "review-photo-guide",
          fieldErrors?.photos && "review-photo-error",
        )}
      >
        <legend className="field-label">
          写真
          <OptionalBadge>任意・複数可</OptionalBadge>
        </legend>
        <div className="photo-grid">
          {initialValues.photos.map((photo) => (
            <div key={photo.id} className="photo-item">
              <input type="hidden" name="existingPhotoId" value={photo.id} />
              <div className="ph">
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "感想口コミ写真"}
                  width={240}
                  height={180}
                  unoptimized
                />
              </div>
              <input
                className="input photo-cap"
                name={`existingPhotoCaption-${photo.id}`}
                defaultValue={photo.caption ?? ""}
                placeholder="写真の説明"
                aria-label="既存写真の説明"
              />
              <label className="photo-remove">
                <input type="checkbox" name="removePhotoId" value={photo.id} />
                この写真を削除する
              </label>
            </div>
          ))}
          {pendingPhotos.map((photo) => (
            <div key={photo.key} className="photo-item">
              <div className="ph">
                <Image
                  src={photo.previewUrl}
                  alt={photo.file.name}
                  width={240}
                  height={180}
                  unoptimized
                />
              </div>
              <input
                className="input photo-cap"
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
              <button
                type="button"
                className="photo-remove"
                onClick={() =>
                  setPendingPhotos((current) => current.filter((item) => item.key !== photo.key))
                }
              >
                選択を解除
              </button>
            </div>
          ))}
          <label className="photo-add">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="感想口コミ写真を追加"
              onChange={(event) => {
                addPhotos(event.target.files);
                event.target.value = "";
              }}
            />
            <span aria-hidden="true">
              {initialValues.photos.length + pendingPhotos.length === 0 ? (
                <>
                  <ImagePlaceholderIcon />
                  <br />
                </>
              ) : null}
              ＋<br />
              追加
            </span>
          </label>
        </div>
        <div className="fguide" id="review-photo-guide" style={{ marginTop: 7 }}>
          1枚あたり5MB以下の jpeg・png・webp を選択できます。
        </div>
        <FieldError id="review-photo-error" message={fieldErrors?.photos} />
      </fieldset>

      <label className="compliance check-toggle">
        <input
          type="checkbox"
          name="pesticideAck"
          required
          checked={pesticideAck}
          onChange={(event) => setPesticideAck(event.target.checked)}
          aria-describedby={describedBy(fieldErrors?.pesticideAck && "review-ack-error")}
          aria-invalid={fieldErrors?.pesticideAck ? true : undefined}
        />
        <span className="cbox" aria-hidden="true" />
        <span>
          実際に使用した感想を、使用条件や感じた変化が分かるよう具体的にご記入ください。農薬として登録されていない資材については、農薬としての効果を断定せず、実際に感じた変化としてご記載ください。
          <br />
          投稿の前に
          <Link href="/legal/posting" target="_blank" rel="noopener noreferrer">
            感想口コミガイドライン
          </Link>
          ・
          <Link href="/legal/terms" target="_blank" rel="noopener noreferrer">
            サイト運営ポリシー
          </Link>
          をご確認ください。 <RequiredBadge />
        </span>
      </label>
      <FieldError id="review-ack-error" message={fieldErrors?.pesticideAck} />
      <div className="fguide" style={{ marginTop: 6 }}>
        登録済みのニックネームで投稿されます。
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={isPending || rating === 0 || !pesticideAck}
        >
          {isPending ? "送信中…" : mode === "create" ? "投稿する" : "変更を保存する"}
        </button>
        <Link className="draft" href={`/materials/${material.id}`}>
          キャンセル
        </Link>
      </div>
    </form>
  );
}
