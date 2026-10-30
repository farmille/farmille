"use client";

import { createAuthBrowserClient } from "@/lib/auth/browser";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { useForm, useStore } from "@tanstack/react-form";
import { usePersistedInput } from "@/lib/hooks/use-form-persisted-input";
import {
  useArticleCreatedNavigation,
  useArticleMarkdownPreview,
  useArticleSearchFocus,
} from "@/lib/hooks/use-article-editor";
import {
  useActionState,
  useMemo,
  useRef,
  useReducer,
  useTransition,
  type ChangeEvent,
} from "react";
import * as v from "valibot";

import { Button, TextLink, buttonRecipe } from "@/components";
import { Chip } from "@/components/Chip";
import { Tabs } from "@/components/Tabs";
import {
  Autocomplete,
  Field,
  Fieldset,
  FileInput,
  Form,
  FormActions,
  Input,
  Notice,
  Textarea,
} from "@/components/form";
import { errorMessageJa } from "@/server/errors";
import type { SellerArticleMaterial } from "@/server/queries/seller-articles";
import { css, cx } from "../../../../../styled-system/css";
import { createArticleAction, searchMaterialsAction, updateArticleAction } from "../actions";
import {
  initialSellerArticleFormState,
  sellerArticleFieldErrors,
  type SellerArticleFormState,
} from "./form-state";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const fileExtensionByType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const formLayout = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

const previewBox = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.card",
  px: "3",
  py: "3",
  minH: "[180px]",
  textStyle: "prose",
  "& h1, & h2, & h3": { mt: "3", mb: "2" },
  "& h2": { textStyle: "title" },
  "& p": { my: "2" },
  "& img": { maxW: "full", borderRadius: "card", my: "2" },
  "& ul, & ol": { pl: "5", my: "2" },
});

const chipRow = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const manufacturerStyle = css({ color: "text.subtle", fontWeight: "normal" });

type ArticleFormBaseProps = {
  sellerId: string;
  initialTitle?: string;
  initialBody?: string;
  initialHeroImageUrl?: string | null;
  initialStatus?: "draft" | "published";
  initialMaterials?: SellerArticleMaterial[];
};
type ArticleFormProps = ArticleFormBaseProps &
  ({ mode: "create"; articleId?: never } | { mode: "edit"; articleId: string });

function isImageFile(file: File): file is File & { type: keyof typeof fileExtensionByType } {
  return file.type in fileExtensionByType;
}

const ArticleInputSchema = v.object({
  title: v.string(),
  body: v.string(),
  heroImageUrl: v.string(),
  materials: v.array(v.object({ id: v.string(), name: v.string(), manufacturer_name: v.string() })),
});

export function ArticleForm({
  sellerId,
  mode,
  articleId,
  initialTitle = "",
  initialBody = "",
  initialHeroImageUrl = null,
  initialStatus = "draft",
  initialMaterials = [],
}: ArticleFormProps) {
  const materialSearchRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyImageInputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const form = useForm({
    defaultValues: {
      title: initialTitle,
      body: initialBody,
      heroImageUrl: initialHeroImageUrl ?? "",
      materials: initialMaterials,
      materialQuery: "",
    },
  });
  const { title, body, heroImageUrl, materials, materialQuery } = useStore(
    form.store,
    (state) => state.values,
  );
  const [editorTab, setEditorTab] = useReducer(
    (_: "write" | "preview", next: "write" | "preview") => next,
    "write",
  );
  const previewHtml = useArticleMarkdownPreview(body, editorTab);
  const [materialHits, updateMaterialHits] = useReducer(
    (
      current: SellerArticleMaterial[],
      action: { type: "replace"; items: SellerArticleMaterial[] } | { type: "remove"; id: string },
    ) =>
      action.type === "replace" ? action.items : current.filter((item) => item.id !== action.id),
    [],
  );
  const [uploadError, setUploadError] = useReducer(
    (_: string | null, next: string | null) => next,
    null,
  );
  const [uploading, setUploading] = useReducer((_: boolean, next: boolean) => next, false);
  const [searchPending, startSearch] = useTransition();
  const [materialListOpen, setMaterialListOpen] = useReducer(
    (_: boolean, next: boolean) => next,
    false,
  );

  const boundAction =
    mode === "create" ? createArticleAction : updateArticleAction.bind(null, articleId);

  const [state, formAction, pending] = useActionState<SellerArticleFormState, FormData>(
    boundAction,
    initialSellerArticleFormState,
  );
  const fieldErrors = sellerArticleFieldErrors(state);

  const input = useMemo(
    () => ({ title, body, heroImageUrl, materials }),
    [title, body, heroImageUrl, materials],
  );
  const [savedInput, setSavedInput] = useReducer(
    (_: string, next: string) => next,
    input,
    JSON.stringify,
  );
  const [settledState, setSettledState] = useReducer(
    (_: SellerArticleFormState, next: SellerArticleFormState) => next,
    state,
  );
  if (state !== settledState) {
    setSettledState(state);
    if (state.status === "success") setSavedInput(JSON.stringify(input));
  }
  // 送信中は控えを消し、公開後のリダイレクトで画面が外れても書きかけを残さない。失敗したら控え直す
  usePersistedInput({
    name: "article",
    schema: ArticleInputSchema,
    unsaved: pending || JSON.stringify(input) === savedInput ? null : input,
    restore: (saved) => {
      form.setFieldValue("title", saved.title);
      form.setFieldValue("body", saved.body);
      form.setFieldValue("heroImageUrl", saved.heroImageUrl);
      form.setFieldValue("materials", saved.materials);
    },
  });

  useArticleCreatedNavigation(state, mode);
  useArticleSearchFocus(materialSearchRef, materialHits, searchPending);

  async function uploadArticleImage(file: File): Promise<string | null> {
    if (!isImageFile(file)) {
      setUploadError("JPEG、PNG、WebPのいずれかを選択してください。");
      return null;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("ファイルは5MB以下にしてください。");
      return null;
    }

    // Storage RLS は第1階層を seller_id で判定する（migration コメント・ポリシー準拠）。
    const extension = fileExtensionByType[file.type];
    const storagePath = `${sellerId}/${crypto.randomUUID()}.${extension}`;
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.storage.from("article-images").upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error !== null) {
      console.error("[dashboard/articles] 画像アップロードに失敗", error);
      setUploadError(errorMessageJa.internal);
      return null;
    }

    const { data } = supabase.storage.from("article-images").getPublicUrl(storagePath);
    setUploadError(null);
    return data.publicUrl;
  }

  async function handleHeroChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;

    setUploading(true);
    const url = await uploadArticleImage(file);
    setUploading(false);
    if (url !== null) form.setFieldValue("heroImageUrl", url);
  }

  async function handleBodyImageChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;

    setUploading(true);
    const url = await uploadArticleImage(file);
    setUploading(false);
    if (url === null) return;

    const textarea = bodyRef.current;
    const markdown = `\n\n![画像](${url})\n\n`;
    if (textarea === null) {
      form.setFieldValue("body", (current) => `${current}${markdown}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${body.slice(0, start)}${markdown}${body.slice(end)}`;
    form.setFieldValue("body", next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + markdown.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handleMaterialSearch(): void {
    const q = materialQuery.trim();
    if (q.length === 0) {
      updateMaterialHits({ type: "replace", items: [] });
      return;
    }

    startSearch(async () => {
      const result = await searchMaterialsAction(q);
      if (!result.ok) {
        setUploadError(result.message);
        updateMaterialHits({ type: "replace", items: [] });
        return;
      }
      setUploadError(null);
      const hits = result.items.filter((item) => !materials.some((m) => m.id === item.id));
      updateMaterialHits({ type: "replace", items: hits });
      setMaterialListOpen(hits.length > 0);
    });
  }

  function addMaterial(material: SellerArticleMaterial): void {
    form.setFieldValue("materials", (current) =>
      current.some((item) => item.id === material.id) ? current : [...current, material],
    );
    updateMaterialHits({ type: "remove", id: material.id });
  }

  function removeMaterial(materialId: string): void {
    form.setFieldValue("materials", (current) => current.filter((item) => item.id !== materialId));
  }

  function submitWithStatus(status: "draft" | "published"): void {
    if (statusInputRef.current !== null) {
      statusInputRef.current.value = status;
    }
    const form = document.querySelector<HTMLFormElement>("#article-editor-form");
    form?.requestSubmit();
  }

  const busy = pending || uploading || searchPending;

  return (
    <div className={formLayout}>
      <Form
        action={formAction}
        className={formLayout}
        errors={fieldErrors}
        id="article-editor-form"
        persist={false}
      >
        <input defaultValue={initialStatus} name="status" ref={statusInputRef} type="hidden" />
        <input name="heroImageUrl" type="hidden" value={heroImageUrl} />
        <input
          name="materialIds"
          type="hidden"
          value={JSON.stringify(materials.map((material) => material.id))}
        />

        <Input
          label="タイトル"
          name="title"
          requirement="required"
          onChange={(event) => form.setFieldValue("title", event.target.value)}
          placeholder="高温期の活用ガイド"
          value={title}
        />

        <Field
          description="JPEG / PNG / WebP（5MB以下）。公開カードのカバーに使います。"
          error={fieldErrors.heroImageUrl ?? uploadError ?? undefined}
          label="ヒーロー画像"
          requirement="optional"
        >
          <FileInput
            label={null}
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              void handleHeroChange(event);
            }}
          />
          {heroImageUrl.length === 0 ? null : (
            <div className={css({ mt: "3", display: "flex", flexDirection: "column", gap: "2" })}>
              <Image
                alt=""
                className={css({
                  w: "full",
                  aspectRatio: "image.wide",
                  display: "block",
                  objectFit: "cover",
                  borderRadius: "card",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "border.default",
                })}
                height={360}
                sizes="(max-width: 768px) 100vw, 768px"
                src={heroImageUrl}
                width={640}
              />
              <Button
                disabled={busy}
                onClick={() => form.setFieldValue("heroImageUrl", "")}
                size="sm"
                type="button"
                variant="ghost"
              >
                ヒーロー画像を外す
              </Button>
            </div>
          )}
        </Field>

        <Field label="本文（Markdown）" name="body" requirement="required">
          <Tabs
            aria-label="本文エディタ"
            onValueChange={setEditorTab}
            tabs={[
              {
                value: "write",
                label: "編集",
                panel: (
                  <>
                    <div className={css({ mt: "3", display: "flex", gap: "2", flexWrap: "wrap" })}>
                      <Button
                        disabled={busy}
                        onClick={() => bodyImageInputRef.current?.click()}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        画像を挿入
                      </Button>
                      <input
                        accept="image/jpeg,image/png,image/webp"
                        className={css({ display: "none" })}
                        onChange={(event) => {
                          void handleBodyImageChange(event);
                        }}
                        ref={bodyImageInputRef}
                        type="file"
                      />
                    </div>
                    <Textarea
                      label={null}
                      className={css({ mt: "3", minH: "[220px]" })}
                      name="body"
                      onChange={(event) => form.setFieldValue("body", event.target.value)}
                      placeholder={
                        "見出しや箇条書きを Markdown で書けます。\n画像は「画像を挿入」から追加できます。"
                      }
                      ref={bodyRef}
                      value={body}
                    />
                  </>
                ),
              },
              {
                value: "preview",
                label: "プレビュー",
                panel: (
                  <>
                    <input name="body" type="hidden" value={body} />
                    <div
                      aria-live="polite"
                      className={cx(css({ mt: "3" }), previewBox)}
                      // プレビューは sanitize 済み HTML（renderMarkdownToHtml）のみを表示する。
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </>
                ),
              },
            ]}
            value={editorTab}
          />
        </Field>

        <Fieldset
          description="自社・他社を問わず資材マスタ全体から検索して複数選択できます。"
          legend="紐づけ資材"
          name="materialIds"
          requirement="optional"
        >
          <div className={chipRow}>
            {materials.map((material) => (
              <Chip
                key={material.id}
                onRemove={() => removeMaterial(material.id)}
                removeLabel={`${material.name}を外す`}
              >
                {material.name}
                <span className={manufacturerStyle}>/ {material.manufacturer_name}</span>
              </Chip>
            ))}
          </div>
        </Fieldset>
      </Form>

      <div className={formLayout}>
        <Autocomplete
          label="資材を検索して追加"
          requirement="optional"
          disabled={busy}
          filterMode="preFiltered"
          inputRef={materialSearchRef}
          onOpenChange={setMaterialListOpen}
          onPick={(option) => {
            const material = materialHits.find((item) => item.id === option.value);
            if (material) addMaterial(material);
          }}
          onSubmitText={handleMaterialSearch}
          onValueChange={(value) => {
            form.setFieldValue("materialQuery", value);
            updateMaterialHits({ type: "replace", items: [] });
          }}
          open={materialListOpen}
          options={materialHits.map((material) => ({
            value: material.id,
            label: material.name,
            description: material.manufacturer_name ?? undefined,
          }))}
          placeholder="資材名またはメーカー名"
          value={materialQuery}
        />
        <Button
          disabled={busy}
          size="sm"
          type="button"
          variant="ghost"
          onClick={handleMaterialSearch}
        >
          {searchPending ? "検索中…" : "検索"}
        </Button>
      </div>

      {state.status === "idle" ? null : (
        <Notice tone={state.status}>
          {state.message}
          {state.status === "success" &&
          state.published === true &&
          state.articleId !== undefined ? (
            <>
              {" "}
              <TextLink href={`/articles/${state.articleId}`}>公開ページを確認</TextLink>
            </>
          ) : null}
        </Notice>
      )}

      <FormActions>
        <Button
          disabled={busy}
          onClick={() => submitWithStatus("draft")}
          type="button"
          variant="ghost"
        >
          {busy ? "処理中…" : "下書き保存"}
        </Button>
        <Button disabled={busy} onClick={() => submitWithStatus("published")} type="button">
          {busy ? "処理中…" : "公開する"}
        </Button>
      </FormActions>

      <Link className={buttonRecipe({ variant: "ghost" })} href="/dashboard/articles">
        一覧に戻る
      </Link>
    </div>
  );
}
