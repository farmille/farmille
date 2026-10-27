"use client";

import { createAuthBrowserClient } from "@/lib/auth/browser";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import * as v from "valibot";

import {
  createReviewAction,
  type ReviewActionState,
  updateReviewAction,
} from "@/app/materials/[id]/review/actions";
import { Badge } from "@/components/Badge";
import {
  Field,
  Fieldset,
  Form,
  FormActions,
  Input,
  Notice,
  SubmitButton,
  Textarea,
  type RestoredFields,
} from "@/components/form";
import type { ReviewCropOption, ReviewPhoto } from "@/server/queries/reviews";

import { Icon } from "@/components/Icon";
import { StarRating } from "@/components/StarRating";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { TextLink } from "@/components/TextLink";

import { css } from "../../../../../../styled-system/css";
import { ReviewCropPicker } from "./ReviewCropPicker";

const REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const REVIEW_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const RestoredRatingSchema = v.pipe(
  v.string(),
  v.toNumber(),
  v.integer(),
  v.minValue(1),
  v.maxValue(5),
);

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
  outlineOffset: "0.5",
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

const exampleSpacingStyle = css({ mt: "2" });

const confirmListStyle = css({
  m: "0",
  pl: "5",
  listStyleType: "disc",
  textStyle: "supporting",
  color: "text.default",
});

const photoGridStyle = css({
  display: "grid",
  // スマホでは写真・説明・解除を1枚ずつ縦に並べ、タブレット以上で横に並べる
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "4",
  tab: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "2.5" },
});

// 写真1枚ごとのまとまり（画像・説明・削除）を枠で囲む
const photoItemStyle = css({
  p: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
});

const photoFrameStyle = css({
  position: "relative",
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

const photoPlaceholderIconStyle = css({ color: "text.brandOnSoft" });

// 写真を外す・削除するボタン。写真の右上に重ねる
const photoRemoveStyle = css({
  position: "absolute",
  top: "1.5",
  right: "1.5",
  display: "grid",
  placeItems: "center",
  w: "8",
  h: "8",
  p: "0",
  border: "none",
  borderRadius: "pill",
  bg: "surface.card",
  color: "text.default",
  boxShadow: "overlay",
  cursor: "pointer",
  _focusVisible: focusRing,
});

// 保存時に削除する既存写真の上に重ねる表示
const photoMarkedStyle = css({
  position: "absolute",
  inset: "0",
  display: "grid",
  placeItems: "center",
  p: "3",
  bg: "scrim/60",
  color: "text.inverse",
  fontSize: "sm",
  fontWeight: "bold",
  textAlign: "center",
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
  const [rating, setRating] = useState(initialValues.rating);
  // form action の後に React が未制御の入力を初期値へ戻すため、本文は state で保持してエラー時も消さない。
  const [body, setBody] = useState(initialValues.body);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  // 編集時に×で削除を選んだ既存写真。保存するまでは消さず、取り消せる
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
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

  // 写真のファイルはブラウザの仕様で戻せないので、選び直してもらう
  function restore(restored: RestoredFields) {
    const restoredRating = v.safeParse(RestoredRatingSchema, restored.get("rating")?.[0]);
    if (restoredRating.success) setRating(restoredRating.output);
    const restoredBody = restored.get("body")?.[0];
    if (restoredBody !== undefined) setBody(restoredBody);
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
    <Form action={submit} errors={fieldErrors} onRestore={restore} persist="review">
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
        <div className={css({ textStyle: "note", color: "text.subtle" })}>対象資材</div>
        <div className={css({ textStyle: "body", fontWeight: "bold" })}>{material.name}</div>
        <div className={css({ textStyle: "note", color: "text.subtle", mt: "0.5" })}>
          {material.manufacturerName}
        </div>
      </div>

      <ReviewCropPicker crops={crops} defaultCropIds={initialValues.cropIds} />

      <Fieldset legend="総合評価" name="rating" requirement="required">
        <StarRating mode="input" value={rating} onChange={setRating} />
      </Fieldset>

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
          label={null}
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

      <Fieldset
        legend={
          <>
            写真 <Badge variant="optional">任意・複数可</Badge>
          </>
        }
        description="1枚あたり5MB以下の jpeg・png・webp を選択できます。"
      >
        <div className={photoGridStyle}>
          {initialValues.photos.map((photo) => {
            const removed = removedPhotoIds.includes(photo.id);
            const photoName = photo.caption ?? "感想口コミ写真";
            return (
              <div key={photo.id} className={photoItemStyle}>
                <input type="hidden" name="existingPhotoId" value={photo.id} />
                {removed && <input type="hidden" name="removePhotoId" value={photo.id} />}
                <div className={photoFrameStyle}>
                  <Image
                    className={photoImageStyle}
                    src={photo.url}
                    alt={photoName}
                    width={240}
                    height={180}
                    unoptimized
                  />
                  {removed && <p className={photoMarkedStyle}>保存すると削除されます</p>}
                  <button
                    type="button"
                    className={photoRemoveStyle}
                    aria-label={removed ? `${photoName}の削除を取り消す` : `${photoName}を削除する`}
                    aria-pressed={removed}
                    onClick={() =>
                      setRemovedPhotoIds((current) =>
                        removed ? current.filter((id) => id !== photo.id) : [...current, photo.id],
                      )
                    }
                  >
                    <Icon name={removed ? "undo" : "close"} />
                  </button>
                </div>
                <Input
                  size="sm"
                  className={photoCaptionStyle}
                  name={`existingPhotoCaption-${photo.id}`}
                  defaultValue={photo.caption ?? ""}
                  placeholder="例）散布前の様子"
                  label="タイトル"
                  requirement="optional"
                />
              </div>
            );
          })}
          {pendingPhotos.map((photo) => (
            <div key={photo.key} className={photoItemStyle}>
              <div className={photoFrameStyle}>
                <Image
                  className={photoImageStyle}
                  src={photo.previewUrl}
                  alt={photo.file.name}
                  width={240}
                  height={180}
                  unoptimized
                />
                <button
                  type="button"
                  className={photoRemoveStyle}
                  aria-label={`${photo.file.name}を外す`}
                  onClick={() =>
                    setPendingPhotos((current) => current.filter((item) => item.key !== photo.key))
                  }
                >
                  <Icon name="close" />
                </button>
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
                label="タイトル"
                requirement="optional"
              />
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

      {/* 投稿すると下の確認事項に同意したものとして扱う（pesticideAck を送る） */}
      <input type="hidden" name="pesticideAck" value="on" />
      <Field label="確認事項" description="登録済みのニックネームで投稿されます。">
        <ul className={confirmListStyle}>
          <li>記入内容は、実際に使用して観察した事実と感じた変化にもとづいています。</li>
          <li>
            農薬として登録されていない資材について、病害虫や雑草への効果を断定する表現は使っていません。
          </li>
          <li>記事・画像・PDFに、他者の権利や秘密保持契約に反するものは含まれていません。</li>
        </ul>
      </Field>

      <FormActions>
        <SubmitButton pending={isPending} pendingLabel="送信中…" disabled={rating === 0}>
          {mode === "create" ? "投稿する" : "変更を保存する"}
        </SubmitButton>
        <TextLink variant="subtle" href={`/materials/${material.id}`}>
          キャンセル
        </TextLink>
      </FormActions>
    </Form>
  );
}
