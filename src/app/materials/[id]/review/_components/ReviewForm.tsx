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
import { Badge } from "@/components/Badge";
import {
  Checkbox,
  Field,
  Fieldset,
  Form,
  FormActions,
  Input,
  Notice,
  SubmitButton,
  Textarea,
} from "@/components/form";
import {
  describedBy,
  FieldError,
  formFieldStyle,
  formLabelStyle,
  RequiredBadge,
} from "@/components/FormParts";
import type { ReviewCropOption, ReviewPhoto } from "@/server/queries/reviews";

import { Icon } from "@/components/Icon";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { TextLink } from "@/components/TextLink";

import { css, cva } from "../../../../../../styled-system/css";
import { ReviewCropPicker } from "./ReviewCropPicker";

const REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const REVIEW_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type PendingPhoto = {
  key: string;
  file: File;
  caption: string;
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

const focusRing = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary.700",
  outlineOffset: "2px",
} as const;

const noticeSpacingStyle = css({ mb: "3.5" });

const targetCardStyle = css(surfaceCardRecipe.raw({ padding: "compact" }), { mb: "4.5" });

const coverInputStyle = css({
  position: "absolute",
  inset: "0",
  w: "full",
  h: "full",
  m: "0",
  opacity: "0",
  cursor: "pointer",
});

const starOptionRecipe = cva({
  base: {
    position: "relative",
    display: "flex",
    lineHeight: "none",
    cursor: "pointer",
    "&:has(input:focus-visible)": { ...focusRing, borderRadius: "mark" },
  },
  variants: {
    on: {
      true: { color: "accent.star" },
      false: { color: "border.strong" },
    },
  },
});

const exampleSpacingStyle = css({ mt: "2" });

const photoGridStyle = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
  tab: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
});

const photoFrameStyle = css({
  display: "grid",
  placeItems: "center",
  w: "full",
  aspectRatio: "image.landscape",
  overflow: "hidden",
  borderRadius: "media",
  bg: "primary.soft",
});

const photoImageStyle = css({ display: "block", w: "full", h: "full", objectFit: "cover" });

const photoCaptionStyle = css({ mt: "1.5" });

const photoPlaceholderIconStyle = css({ color: "primary.700" });

const photoRemoveCheckStyle = css({ mt: "1" });

const photoRemoveStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  mt: "1",
  p: "0",
  bg: "transparent",
  fontSize: "sm",
  color: "accent.danger",
  cursor: "pointer",
});

const photoAddStyle = css({
  position: "relative",
  alignSelf: "stretch",
  w: "full",
  display: "grid",
  placeItems: "center",
  aspectRatio: "image.landscape",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "border.strong",
  borderRadius: "media",
  fontSize: "sm",
  color: "text.subtle",
  textAlign: "center",
  cursor: "pointer",
  "&:has(input:focus-visible)": focusRing,
});

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

  return (
    <Form action={submit} errors={fieldErrors}>
      {existingReviewNotice ? (
        <Notice className={noticeSpacingStyle} tone="info">
          この資材には投稿済みの感想口コミがあります。内容を編集できます。
        </Notice>
      ) : null}
      {state.status === "error" ? (
        <Notice className={noticeSpacingStyle} tone="error">
          {state.message}
        </Notice>
      ) : null}
      {localError === null ? null : (
        <Notice className={noticeSpacingStyle} tone="error">
          {localError}
        </Notice>
      )}

      <div className={targetCardStyle}>
        <div className={css({ fontSize: "xs", color: "text.subtle" })}>対象資材</div>
        <div className={css({ fontSize: "md", fontWeight: "bold" })}>{material.name}</div>
        <div className={css({ fontSize: "xs", color: "text.subtle", mt: "0.5" })}>
          {material.manufacturerName}
        </div>
      </div>

      <div className={formFieldStyle}>
        <label className={formLabelStyle} htmlFor="review-crop">
          作目
          <RequiredBadge />
          <span className={css({ fontSize: "xs", fontWeight: "normal", color: "text.subtle" })}>
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
        className={formFieldStyle}
        aria-describedby={describedBy(fieldErrors?.rating && "review-rating-error")}
      >
        <legend className={formLabelStyle}>
          総合評価
          <RequiredBadge />
        </legend>
        <div className={css({ display: "flex", gap: "2" })}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={starOptionRecipe({ on: n <= rating })}>
              <input
                className={coverInputStyle}
                type="radio"
                name="rating"
                value={n}
                aria-label={`${n}`}
                checked={rating === n}
                onChange={() => setRating(n)}
              />
              <Icon name="star_filled" size="2xl" />
            </label>
          ))}
        </div>
        <FieldError id="review-rating-error" message={fieldErrors?.rating} />
      </fieldset>

      <Field
        name="body"
        label="感想口コミ本文"
        requirement="required"
        description={
          <>
            作物・使用時期・使い方・感じた変化が入っていると参考になります。もっと詳しく書きたい場合は「
            <TextLink href={`/materials/${material.id}/report/new`}>実証詳細レポート入力</TextLink>
            」から。
          </>
        }
      >
        <Textarea
          size="lg"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="自由に記入してください"
          aria-describedby="review-body-example"
        />
        <div className={exampleSpacingStyle} id="review-body-example">
          <Notice tone="neutral" title="記入例">
            トマト（ハウス栽培）で、定植後から2週間おきに灌水と合わせて使いました。1ヶ月ほどで根張りがしっかりしてきて、高温が続いた時期も葉のしおれが少なかったように感じます。
          </Notice>
        </div>
      </Field>

      {/* 写真の各入力は自分の name で送るので、組の Field.Root（name="photos"）では包まない */}
      <Fieldset
        legend={
          <>
            写真 <Badge variant="optional">任意・複数可</Badge>
          </>
        }
        description="1枚あたり5MB以下の jpeg・png・webp を選択できます。"
      >
        <div className={photoGridStyle}>
          {initialValues.photos.map((photo) => (
            <div key={photo.id}>
              <input type="hidden" name="existingPhotoId" value={photo.id} />
              <div className={photoFrameStyle}>
                <Image
                  className={photoImageStyle}
                  src={photo.url}
                  alt={photo.caption ?? "感想口コミ写真"}
                  width={240}
                  height={180}
                  unoptimized
                />
              </div>
              <Input
                size="sm"
                className={photoCaptionStyle}
                name={`existingPhotoCaption-${photo.id}`}
                defaultValue={photo.caption ?? ""}
                placeholder="写真の説明"
                aria-label="既存写真の説明"
              />
              <Checkbox
                className={photoRemoveCheckStyle}
                name="removePhotoId"
                size="sm"
                tone="danger"
                value={photo.id}
              >
                この写真を削除する
              </Checkbox>
            </div>
          ))}
          {pendingPhotos.map((photo) => (
            <div key={photo.key}>
              <div className={photoFrameStyle}>
                <Image
                  className={photoImageStyle}
                  src={photo.previewUrl}
                  alt={photo.file.name}
                  width={240}
                  height={180}
                  unoptimized
                />
              </div>
              <Input
                size="sm"
                className={photoCaptionStyle}
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
                className={photoRemoveStyle}
                onClick={() =>
                  setPendingPhotos((current) => current.filter((item) => item.key !== photo.key))
                }
              >
                選択を解除
              </button>
            </div>
          ))}
          <label className={photoAddStyle}>
            <input
              className={coverInputStyle}
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
                  <Icon className={photoPlaceholderIconStyle} name="image" size="lg" />
                  <br />
                </>
              ) : null}
              ＋<br />
              追加
            </span>
          </label>
        </div>
        {fieldErrors?.photos === undefined ? null : (
          <Notice className={exampleSpacingStyle} tone="error">
            {fieldErrors.photos}
          </Notice>
        )}
      </Fieldset>

      <Field
        name="pesticideAck"
        requirement="required"
        description="登録済みのニックネームで投稿されます。"
      >
        <Checkbox variant="note" checked={pesticideAck} onCheckedChange={setPesticideAck}>
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
          をご確認ください。
        </Checkbox>
      </Field>

      <FormActions>
        <SubmitButton
          pending={isPending}
          pendingLabel="送信中…"
          disabled={rating === 0 || !pesticideAck}
        >
          {mode === "create" ? "投稿する" : "変更を保存する"}
        </SubmitButton>
        <TextLink variant="subtle" href={`/materials/${material.id}`}>
          キャンセル
        </TextLink>
      </FormActions>
    </Form>
  );
}
