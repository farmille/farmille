"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type {
  AdminArticleCreatePayload,
  AdminArticleDetail,
  AdminArticlePatchPayload,
  ArticleCategory,
} from "@/types/admin";
import { HeroImageUpload } from "./hero-image-upload";

// Admin Articles CMS 作成 / 編集フォーム (ADR-0014)。
// mode="create" → POST /api/admin/articles、mode="edit" → PATCH /api/admin/articles/{id}。
// 提出は BFF proxy 経由 (Supabase の DATA 直叩き禁止)。hero は Storage 直 upload (例外)。

const CATEGORY_OPTIONS: { value: ArticleCategory; label: string }[] = [
  { value: "monthly_report", label: "月次レポート (monthly_report)" },
  { value: "weekly_report", label: "週次レポート (weekly_report)" },
  { value: "featured", label: "特集 (featured)" },
  { value: "column", label: "コラム (column)" },
];

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const inputClass =
  "w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

/** ISO 文字列 ↔ datetime-local (ローカル時刻) の相互変換。 */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local は "YYYY-MM-DDTHH:mm" (ローカル)。tz オフセットを引いて整形。
  const tzMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - tzMs).toISOString().slice(0, 16);
}

function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local); // datetime-local はローカル時刻として解釈される
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type Props =
  | { mode: "create"; article?: undefined }
  | { mode: "edit"; article: AdminArticleDetail };

export function ArticleForm(props: Props) {
  const router = useRouter();
  const { mode } = props;
  const article = props.mode === "edit" ? props.article : null;

  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [category, setCategory] = useState<ArticleCategory>(
    article?.category ?? "column",
  );
  const [heroUrl, setHeroUrl] = useState<string | null>(
    article?.hero_image_url ?? null,
  );
  const [bodyMd, setBodyMd] = useState(article?.body_md ?? "");
  // 公開トグル: published_at が非 null かどうか。
  const [published, setPublished] = useState<boolean>(
    Boolean(article?.published_at),
  );
  const [publishedAtLocal, setPublishedAtLocal] = useState<string>(
    isoToLocalInput(article?.published_at ?? null),
  );

  const slugValid = slug === "" || SLUG_RE.test(slug);
  const heroArticleId = article?.id ?? "_new";

  // 簡易 preview: 見出し / 段落だけ最小整形 (markdown ライブラリは v1 で足さない)。
  const previewLines = useMemo(() => bodyMd.split("\n"), [bodyMd]);

  function resolvePublishedAt(): string | null {
    if (!published) return null;
    // 公開 ON だが時刻未入力なら「今」を採用 (即時公開)。
    return publishedAtLocal ? localInputToIso(publishedAtLocal) : new Date().toISOString();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    if (!SLUG_RE.test(slug)) {
      setError("slug は英小文字・数字・ハイフンのみ (例: 2026-spring-report)");
      return;
    }
    if (!bodyMd.trim()) {
      setError("本文を入力してください");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload: AdminArticleCreatePayload = {
          slug: slug.trim(),
          title: title.trim(),
          body_md: bodyMd,
          category,
          hero_image_url: heroUrl,
          published_at: resolvePublishedAt(),
        };
        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(messageFromError(body?.error, res.status));
          setSubmitting(false);
          return;
        }
        const body = (await res.json()) as { ok: boolean; id?: string };
        setSuccess(true);
        // 作成後は編集画面へ遷移 (hero を正規 path で扱えるようにする)。
        startTransition(() => {
          if (body.id) {
            router.push(`/admin/articles/${encodeURIComponent(body.id)}`);
          } else {
            router.push("/admin/articles");
          }
          router.refresh();
        });
      } else {
        // 編集: 全フィールドを PATCH (送らないキーは backend で「変更なし」扱いだが、
        // 編集画面は全フィールドを保持しているため全送信で問題ない)。
        const payload: AdminArticlePatchPayload = {
          slug: slug.trim(),
          title: title.trim(),
          body_md: bodyMd,
          category,
          hero_image_url: heroUrl,
          published_at: resolvePublishedAt(),
        };
        const res = await fetch(
          `/api/admin/articles/${encodeURIComponent(article!.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(messageFromError(body?.error, res.status));
          setSubmitting(false);
          return;
        }
        setSuccess(true);
        setSubmitting(false);
        startTransition(() => router.refresh());
      }
    } catch {
      setError("保存に失敗しました (ネットワーク)");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-medium">基本</h2>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            タイトル <span className="text-error">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className={inputClass}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            slug (URL、英小文字・数字・ハイフン) <span className="text-error">*</span>
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            maxLength={80}
            required
            placeholder="2026-spring-bs-report"
            className={
              inputClass + (slugValid ? "" : " border-error focus:ring-error/30")
            }
            aria-invalid={!slugValid}
          />
          {!slugValid && (
            <span className="text-xs text-error">
              使用できる文字は英小文字・数字・ハイフンのみです (3〜80 文字)。
            </span>
          )}
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">カテゴリ</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ArticleCategory)}
            className={inputClass}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">hero 画像</span>
          <HeroImageUpload
            articleId={heroArticleId}
            value={heroUrl}
            onChange={setHeroUrl}
            disabled={submitting}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-medium">公開設定</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded border-border"
          />
          <span>公開する (published_at をセット)</span>
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            公開日時 (未指定で公開 ON なら「今」)
          </span>
          <input
            type="datetime-local"
            value={publishedAtLocal}
            onChange={(e) => setPublishedAtLocal(e.target.value)}
            disabled={!published}
            className={inputClass + (published ? "" : " opacity-50")}
          />
          <span className="text-xs text-muted-foreground">
            未来日時を指定すると、その時刻まで公開ページには出ません (read 側で
            published_at &lt;= now() を強制)。
          </span>
        </label>
      </section>

      <section className="space-y-4 rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-medium">本文 (Markdown)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">
              body_md <span className="text-error">*</span>
            </span>
            <textarea
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              rows={20}
              maxLength={50000}
              required
              className={inputClass + " font-mono"}
              placeholder={"# 見出し\n\n本文をここに書きます。"}
            />
            <span className="text-xs text-muted-foreground">
              {bodyMd.length.toLocaleString()} / 50,000 文字
            </span>
          </label>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">プレビュー (簡易)</span>
            <div className="rounded border border-border bg-background p-4 min-h-[200px] text-sm space-y-2 overflow-auto">
              {previewLines.map((line, i) => {
                if (line.startsWith("# ")) {
                  return (
                    <p key={i} className="text-xl font-semibold">
                      {line.slice(2)}
                    </p>
                  );
                }
                if (line.startsWith("## ")) {
                  return (
                    <p key={i} className="text-lg font-medium">
                      {line.slice(3)}
                    </p>
                  );
                }
                if (line.trim() === "") {
                  return <div key={i} className="h-2" />;
                }
                return (
                  <p key={i} className="text-foreground">
                    {line}
                  </p>
                );
              })}
            </div>
            <span className="text-xs text-muted-foreground">
              ※ 見出しと段落のみの簡易表示。実際のレンダリングは公開ページに準じます。
            </span>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-3">
        <Button
          type="submit"
          disabled={submitting || isPending || !slugValid}
          className="min-w-[120px]"
        >
          {submitting
            ? "保存中…"
            : isPending
              ? "処理中…"
              : mode === "create"
                ? "作成"
                : "保存"}
        </Button>
        {success ? (
          <span className="text-sm text-emerald-600" role="status">
            {mode === "create" ? "作成しました" : "保存しました"}
          </span>
        ) : null}
        {error ? (
          <span className="text-sm text-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function messageFromError(code: unknown, status: number): string {
  if (typeof code === "string") {
    switch (code) {
      case "slug_already_exists":
        return "この slug は既に使われています";
      case "article_not_found":
        return "対象の記事が見つかりません";
      case "no_fields_to_update":
        return "変更がありません";
      case "forbidden":
      case "not_admin":
        return "権限がありません";
      case "aal2_required":
      case "aal_insufficient":
        return "MFA が完了していません (/mfa/challenge へ)";
      case "unauthorized":
        return "ログインが必要です";
    }
  }
  if (status === 401) return "再ログインまたは MFA が必要です";
  if (status === 422) return "入力内容を確認してください";
  return "保存に失敗しました";
}
