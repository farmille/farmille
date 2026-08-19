"use client";

import { createBrowserClient } from "@supabase/ssr";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Button,
  FilterPills,
  FormMessage,
  Input,
  Textarea,
  TextLink,
  buttonRecipe,
} from "@/components";
import { Field } from "@/components/auth/Fields";
import { clientEnv } from "@/env";
import { renderMarkdownToHtml } from "@/lib/markdown/render";
import { errorMessageJa } from "@/server/errors";
import type { SellerArticleMaterial } from "@/server/queries/seller-articles";
import type { Database } from "@/types/database.types";
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

const actionsRow = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "2",
});

const previewBox = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.card",
  px: "3",
  py: "3",
  minH: "180px",
  fontSize: "md",
  lineHeight: "1.7",
  "& h1, & h2, & h3": { fontWeight: "800", mt: "3", mb: "2" },
  "& p": { my: "2" },
  "& img": { maxW: "100%", borderRadius: "card", my: "2" },
  "& ul, & ol": { pl: "5", my: "2" },
});

const chipRow = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const chip = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "pill",
  bg: "green.soft2",
  px: "3",
  py: "1.5",
  fontSize: "sm",
});

const searchResult = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  overflow: "hidden",
});

const searchResultButton = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "0.5",
  w: "100%",
  px: "3",
  py: "2.5",
  bg: "surface.card",
  borderWidth: "0",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  cursor: "pointer",
  textAlign: "left",
  _last: { borderBottomWidth: "0" },
});

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
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyImageInputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [heroImageUrl, setHeroImageUrl] = useState(initialHeroImageUrl ?? "");
  const [materials, setMaterials] = useState<SellerArticleMaterial[]>(initialMaterials);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [materialQuery, setMaterialQuery] = useState("");
  const [materialHits, setMaterialHits] = useState<SellerArticleMaterial[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchPending, startSearch] = useTransition();

  const boundAction =
    mode === "create" ? createArticleAction : updateArticleAction.bind(null, articleId);

  const [state, formAction, pending] = useActionState<SellerArticleFormState, FormData>(
    boundAction,
    initialSellerArticleFormState,
  );
  const fieldErrors = sellerArticleFieldErrors(state);

  useEffect(() => {
    if (state.status === "success" && state.articleId !== undefined && mode === "create") {
      router.replace(`/dashboard/articles/${state.articleId}/edit`);
    }
  }, [mode, router, state]);

  useEffect(() => {
    if (editorTab !== "preview") return;
    let cancelled = false;
    void renderMarkdownToHtml(body).then((html) => {
      if (!cancelled) setPreviewHtml(html);
    });
    return () => {
      cancelled = true;
    };
  }, [body, editorTab]);

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
    const supabase = createBrowserClient<Database>(
      clientEnv.supabaseUrl,
      clientEnv.supabasePublishableKey,
    );
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
    if (url !== null) setHeroImageUrl(url);
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
      setBody((current) => `${current}${markdown}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${body.slice(0, start)}${markdown}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + markdown.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handleMaterialSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const q = materialQuery.trim();
    if (q.length === 0) {
      setMaterialHits([]);
      return;
    }

    startSearch(async () => {
      const result = await searchMaterialsAction(q);
      if (!result.ok) {
        setUploadError(result.message);
        setMaterialHits([]);
        return;
      }
      setUploadError(null);
      setMaterialHits(result.items.filter((item) => !materials.some((m) => m.id === item.id)));
    });
  }

  function addMaterial(material: SellerArticleMaterial): void {
    setMaterials((current) =>
      current.some((item) => item.id === material.id) ? current : [...current, material],
    );
    setMaterialHits((current) => current.filter((item) => item.id !== material.id));
  }

  function removeMaterial(materialId: string): void {
    setMaterials((current) => current.filter((item) => item.id !== materialId));
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
      <form action={formAction} className={formLayout} id="article-editor-form">
        <input defaultValue={initialStatus} name="status" ref={statusInputRef} type="hidden" />
        <input name="heroImageUrl" type="hidden" value={heroImageUrl} />
        <input
          name="materialIds"
          type="hidden"
          value={JSON.stringify(materials.map((material) => material.id))}
        />

        <Field
          error={fieldErrors.title}
          htmlFor="article-title"
          label="タイトル"
          requirement="required"
        >
          <Input
            id="article-title"
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例）高温期の活用ガイド"
            value={title}
          />
        </Field>

        <Field
          error={fieldErrors.heroImageUrl ?? uploadError ?? undefined}
          guide="JPEG / PNG / WebP（5MB以下）。公開カードのカバーに使います。"
          htmlFor="article-hero"
          label="ヒーロー画像"
          requirement="optional"
        >
          <Input
            accept="image/jpeg,image/png,image/webp"
            id="article-hero"
            onChange={(event) => {
              void handleHeroChange(event);
            }}
            type="file"
          />
          {heroImageUrl.length === 0 ? null : (
            <div className={css({ mt: "3", display: "flex", flexDirection: "column", gap: "2" })}>
              <Image
                alt=""
                className={css({
                  w: "100%",
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
                onClick={() => setHeroImageUrl("")}
                size="sm"
                type="button"
                variant="ghost"
              >
                ヒーロー画像を外す
              </Button>
            </div>
          )}
        </Field>

        <Field
          error={fieldErrors.body}
          htmlFor="article-body"
          label="本文（Markdown）"
          requirement="required"
        >
          <FilterPills
            aria-label="本文エディタ"
            onChange={(value) => {
              if (value === "write" || value === "preview") setEditorTab(value);
            }}
            options={[
              { value: "write", label: "編集" },
              { value: "preview", label: "プレビュー" },
            ]}
            value={editorTab}
          />
          <div className={css({ mt: "3", display: "flex", gap: "2", flexWrap: "wrap" })}>
            <Button
              disabled={busy || editorTab !== "write"}
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
          {editorTab === "write" ? (
            <Textarea
              className={css({ mt: "3", minH: "220px" })}
              id="article-body"
              name="body"
              onChange={(event) => setBody(event.target.value)}
              placeholder={
                "見出しや箇条書きを Markdown で書けます。\n画像は「画像を挿入」から追加できます。"
              }
              ref={bodyRef}
              value={body}
            />
          ) : (
            <>
              <input name="body" type="hidden" value={body} />
              <div
                aria-live="polite"
                className={cx(css({ mt: "3" }), previewBox)}
                // プレビューは sanitize 済み HTML（renderMarkdownToHtml）のみを表示する。
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </>
          )}
        </Field>

        <Field
          error={fieldErrors.materialIds}
          guide="自社・他社を問わず資材マスタ全体から検索して複数選択できます。"
          htmlFor="article-material-search"
          label="紐づけ資材"
          requirement="optional"
        >
          <div className={chipRow}>
            {materials.map((material) => (
              <span className={chip} key={material.id}>
                <span>
                  {material.name}
                  <span className={css({ color: "text.subtle", ml: "1" })}>
                    / {material.manufacturer_name}
                  </span>
                </span>
                <button
                  className={css({
                    borderWidth: "0",
                    bg: "transparent",
                    color: "accent.danger",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "sm",
                  })}
                  onClick={() => removeMaterial(material.id)}
                  type="button"
                >
                  外す
                </button>
              </span>
            ))}
          </div>
        </Field>

        {state.status === "idle" ? null : (
          <FormMessage status={state.status === "error" ? "error" : "success"}>
            {state.message}
            {state.status === "success" &&
            state.published === true &&
            state.articleId !== undefined ? (
              <>
                {" "}
                <TextLink href={`/articles/${state.articleId}`}>公開ページを確認</TextLink>
              </>
            ) : null}
          </FormMessage>
        )}

        <div className={actionsRow}>
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
        </div>
      </form>

      <form className={formLayout} onSubmit={handleMaterialSearch}>
        <Field htmlFor="article-material-search" label="資材を検索して追加" requirement="optional">
          <Input
            id="article-material-search"
            onChange={(event) => setMaterialQuery(event.target.value)}
            placeholder="資材名またはメーカー名"
            value={materialQuery}
          />
        </Field>
        <Button disabled={busy} size="sm" type="submit" variant="ghost">
          {searchPending ? "検索中…" : "検索"}
        </Button>
        {materialHits.length === 0 ? null : (
          <div className={searchResult}>
            {materialHits.map((material) => (
              <button
                className={searchResultButton}
                key={material.id}
                onClick={() => addMaterial(material)}
                type="button"
              >
                <span className={css({ fontWeight: "700", fontSize: "sm" })}>{material.name}</span>
                <span className={css({ fontSize: "xs", color: "text.muted" })}>
                  {material.manufacturer_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      <Link className={buttonRecipe({ variant: "ghost" })} href="/dashboard/articles">
        一覧に戻る
      </Link>
    </div>
  );
}
