"use client";

import { createAuthBrowserClient } from "@/lib/auth/browser";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { startTransition, useActionState, useId, useMemo, useReducer } from "react";
import * as v from "valibot";
import { useForm, useStore } from "@tanstack/react-form";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";

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
import type { PesticideRegistration } from "@/lib/material-page-editor";

import { css, cva } from "../../../../../../styled-system/css";
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

type ReviewInput = Pick<ReviewFormValues, "rating" | "body"> & {
  cropIds: readonly string[];
  pendingPhotos: PendingPhoto[];
  removedPhotoIds: string[];
  existingPhotoCaptions: Record<string, string>;
};

type ReviewFormBaseProps = {
  material: {
    id: string;
    name: string;
    manufacturerName: string;
  };
  userId: string;
  crops: ReviewCropOption[];
  /** 最初に候補として出す、この資材の対象作物。 */
  targetCropIds: readonly string[];
  pesticideRegistration: PesticideRegistration;
  bodyMaxLength: number;
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

const exampleSpacingStyle = css({ mb: "2" });

const srOnlyStyle = css({ srOnly: true });

const confirmListStyle = css({
  m: "0",
  pl: "5",
  listStyleType: "disc",
  textStyle: "supporting",
  color: "text.default",
});

const bodyCountRecipe = cva({
  base: {
    mt: "1",
    textStyle: "supporting",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  variants: {
    full: {
      true: { color: "accent.danger", fontWeight: "bold" },
      false: { color: "text.muted" },
    },
  },
});

const bodyLimitStyle = css({ textStyle: "supporting", color: "accent.danger" });

const reportLinkLeadStyle = css({ mt: "3", textStyle: "body", color: "text.muted" });

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

// 農薬として登録された資材は農薬としての効果を書けるので、この確認を出さない
const PESTICIDE_CHECK = {
  registered: null,
  unregistered:
    "この資材は農薬として登録されていないため、病害虫や雑草に効いたと言い切る書き方はしていません。",
  unknown:
    "農薬として登録されていない資材について、病害虫や雑草への効果を断定する表現は使っていません。",
} satisfies Record<PesticideRegistration, string | null>;

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
  targetCropIds,
  pesticideRegistration,
  bodyMaxLength,
  initialValues,
  reviewId,
  existingReviewNotice = false,
}: ReviewFormProps) {
  const bodyCountId = useId();
  const supabase = useMemo(() => createAuthBrowserClient(), []);
  const action =
    mode === "create"
      ? createReviewAction.bind(null, material.id)
      : updateReviewAction.bind(null, material.id, reviewId);
  const initialInput: ReviewInput = {
    cropIds: initialValues.cropIds,
    rating: initialValues.rating,
    body: initialValues.body,
    pendingPhotos: [],
    removedPhotoIds: [],
    existingPhotoCaptions: Object.fromEntries(
      initialValues.photos.map((photo) => [photo.id, photo.caption ?? ""]),
    ),
  };
  // Reactはaction後に未制御入力をresetするため、エラー時も本文が残るよう入力値を保持する。
  const form = useForm({ defaultValues: initialInput });
  const { cropIds, rating, body, pendingPhotos, removedPhotoIds, existingPhotoCaptions } = useStore(
    form.store,
    (state) => state.values,
  );
  const [uploading, setUploading] = useReducer((_: boolean, next: boolean) => next, false);
  const [localError, setLocalError] = useReducer(
    (_: string | null, next: string | null) => next,
    null,
  );
  const [state, formAction, actionPending] = useActionState(
    async (previous: ReviewActionState, formData: FormData) => {
      const next = await action(previous, formData);
      if (next.status === "error" && (next.cleanupPaths?.length ?? 0) > 0) {
        void supabase.storage
          .from("review-photos")
          .remove(next.cleanupPaths ?? [])
          .then(({ error }) => {
            if (error !== null) {
              setLocalError(
                "一時アップロードした写真を削除できませんでした。再送信せずお待ちください。",
              );
            }
          });
      }
      return next;
    },
    initialActionState,
  );
  const isPending = uploading || actionPending;
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const pesticideCheck = PESTICIDE_CHECK[pesticideRegistration];
  // 上限を超えて貼り付けた分は入力欄が黙って切り捨てるので、上限に達したことを知らせる
  const bodyFull = body.length >= bodyMaxLength;

  // 外した写真のURLは外した時点で解放し、残りは画面を離れるときに解放する。
  useMountEffect(() => () => {
    for (const photo of form.getFieldValue("pendingPhotos")) URL.revokeObjectURL(photo.previewUrl);
  });

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
    form.setFieldValue("pendingPhotos", (current) => [...current, ...additions]);
  }

  // 写真のファイルはブラウザの仕様で戻せないので、選び直してもらう
  function restore(restored: RestoredFields) {
    const restoredCropIds = restored.get("cropIds");
    if (restoredCropIds !== undefined) form.setFieldValue("cropIds", restoredCropIds);
    const restoredRating = v.safeParse(RestoredRatingSchema, restored.get("rating")?.[0]);
    if (restoredRating.success) form.setFieldValue("rating", restoredRating.output);
    const restoredBody = restored.get("body")?.[0];
    if (restoredBody !== undefined) form.setFieldValue("body", restoredBody);
    for (const photo of initialValues.photos) {
      const caption = restored.get(`existingPhotoCaption-${photo.id}`)?.[0];
      if (caption !== undefined) form.setFieldValue(`existingPhotoCaptions.${photo.id}`, caption);
    }
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

      <ReviewCropPicker
        crops={crops}
        targetCropIds={targetCropIds}
        value={cropIds}
        onValueChange={(value) => form.setFieldValue("cropIds", value)}
      />

      <Fieldset legend="総合評価" name="rating" requirement="required">
        <StarRating
          mode="input"
          value={rating}
          onChange={(value) => form.setFieldValue("rating", value)}
        />
      </Fieldset>

      <Field
        name="body"
        label="感想口コミ本文"
        requirement="required"
        lead="作物・使用時期・使い方・感じた変化が入っていると参考になります。"
      >
        {/* 記入例は入力欄の上に置き、エラーが入力欄の真下に出るようにする */}
        <div className={exampleSpacingStyle} id="review-body-example">
          <Notice tone="neutral" title="記入例">
            トマト（ハウス栽培）で、定植後から2週間おきに灌水と合わせて使いました。1ヶ月ほどで根張りがしっかりしてきて、高温が続いた時期も葉のしおれが少なかったように感じます。
          </Notice>
        </div>
        <Textarea
          label={null}
          size="lg"
          value={body}
          maxLength={bodyMaxLength}
          onChange={(event) => form.setFieldValue("body", event.target.value)}
          placeholder="自由に記入してください"
          aria-describedby={`${bodyCountId} review-body-example`}
        />
        <p className={bodyCountRecipe({ full: bodyFull })} id={bodyCountId}>
          {body.length}／{bodyMaxLength}文字
        </p>
        <p className={bodyLimitStyle} role="status">
          {bodyFull
            ? `上限の${bodyMaxLength}文字に達しました。${bodyMaxLength}文字を超えた分は入りません。`
            : null}
        </p>
        <p className={reportLinkLeadStyle}>
          もっとくわしく書きたいときは、
          <TextLink href={`/materials/${material.id}/report/new`}>実証詳細レポートを書く</TextLink>
          から投稿できます。
        </p>
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
          {initialValues.photos.map((photo, index) => {
            const removed = removedPhotoIds.includes(photo.id);
            // 読み上げで写真を区別できるよう、何枚目かを名前に入れる
            const photoName = `${index + 1}枚目の写真`;
            return (
              <div key={photo.id} className={photoItemStyle}>
                <input type="hidden" name="existingPhotoId" value={photo.id} />
                {removed && <input type="hidden" name="removePhotoId" value={photo.id} />}
                <div className={photoFrameStyle}>
                  <Image
                    className={photoImageStyle}
                    src={photo.url}
                    alt={photo.caption ?? photoName}
                    width={240}
                    height={180}
                    unoptimized
                  />
                  {removed && <p className={photoMarkedStyle}>保存すると削除されます</p>}
                  <button
                    type="button"
                    className={photoRemoveStyle}
                    aria-label={`${photoName}を削除する`}
                    aria-pressed={removed}
                    onClick={() =>
                      form.setFieldValue("removedPhotoIds", (current) =>
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
                  value={existingPhotoCaptions[photo.id] ?? ""}
                  onChange={(event) =>
                    form.setFieldValue(`existingPhotoCaptions.${photo.id}`, event.target.value)
                  }
                  placeholder="例）散布前の様子"
                  label={
                    <>
                      タイトル<span className={srOnlyStyle}>（{photoName}）</span>
                    </>
                  }
                  requirement="optional"
                />
              </div>
            );
          })}
          {pendingPhotos.map((photo, index) => (
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
                  aria-label={`${initialValues.photos.length + index + 1}枚目の写真を外す`}
                  onClick={() => {
                    URL.revokeObjectURL(photo.previewUrl);
                    form.setFieldValue("pendingPhotos", (current) =>
                      current.filter((item) => item.key !== photo.key),
                    );
                  }}
                >
                  <Icon name="close" />
                </button>
              </div>
              <Input
                size="sm"
                className={photoCaptionStyle}
                value={photo.caption}
                onChange={(event) => {
                  form.setFieldValue("pendingPhotos", (current) =>
                    current.map((item) =>
                      item.key === photo.key ? { ...item, caption: event.target.value } : item,
                    ),
                  );
                }}
                placeholder="例）散布前の様子"
                label={
                  <>
                    タイトル
                    <span className={srOnlyStyle}>
                      （{initialValues.photos.length + index + 1}枚目の写真）
                    </span>
                  </>
                }
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
              <Icon name="add" size="sm" />
              <br />
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
          {pesticideCheck === null ? null : <li>{pesticideCheck}</li>}
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
