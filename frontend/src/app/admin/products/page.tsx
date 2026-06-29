import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminMakersResponse,
  AdminProductListResponse,
} from "@/types/admin";
import { ProductDeleteButton } from "./_components/product-delete-button";
import {
  SortableHeader,
  type SortDir,
} from "../_components/sortable-header";

export const metadata: Metadata = {
  title: "資材マスタ",
  description: "BS資材マスタ一覧",
};

// spec admin-aglist-alignment-v2.md §3.1: 資材マスタ一覧。
// /v1/admin/products を SSR 取得し、検索 / フィルタ / pagination を URL クエリで保持する。
// 権威ゲートはデータ取得先の FastAPI 側 (/v1/admin/* は require_role("admin") + AAL2 を
// 独立に強制)。layout.tsx は UI guard のみ — layout 通過を理由に backend チェックを緩めない。
// 新規作成 UI は v1 非対応 (F2 は §7 F-FU8)。

const PER_PAGE = 20;
const MAX_PAGE = 5000;
const CONFIDENCE_OPTIONS = ["高", "中", "低", "要確認"] as const;
const COMMERCIAL_STATUS_OPTIONS = ["available", "discontinued", "pre-launch"] as const;

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
    maker_id?: string;
    is_public?: string;
    commercial_status?: string;
    confidence?: string;
    sort?: string;
    dir?: string;
  }>;
};

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 1;
  const i = Math.floor(n);
  if (i < 1) return 1;
  if (i > MAX_PAGE) return MAX_PAGE;
  return i;
}

function parseIsPublic(raw: string | undefined): boolean | undefined {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const page = parsePage(params.page);
  const makerId = params.maker_id?.trim() ?? "";
  const isPublic = parseIsPublic(params.is_public);
  const commercialStatus = params.commercial_status?.trim() ?? "";
  const confidence = params.confidence?.trim() ?? "";
  const sort = params.sort ?? null;
  const dir: SortDir = params.dir === "asc" ? "asc" : "desc";
  // SortableHeader に渡す温存パラメータ (sort/dir/page を除く現在のフィルタ)。
  const sortParams: Record<string, string> = {};
  if (q) sortParams.q = q;
  if (makerId) sortParams.maker_id = makerId;
  if (isPublic !== undefined) sortParams.is_public = String(isPublic);
  if (commercialStatus) sortParams.commercial_status = commercialStatus;
  if (confidence) sortParams.confidence = confidence;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/admin/products");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (makerId) qs.set("maker_id", makerId);
  if (isPublic !== undefined) qs.set("is_public", String(isPublic));
  if (commercialStatus) qs.set("commercial_status", commercialStatus);
  if (confidence) qs.set("confidence", confidence);
  if (sort) qs.set("sort", sort);
  qs.set("dir", dir);
  qs.set("page", String(page));
  qs.set("per_page", String(PER_PAGE));

  const [productsRes, makersRes] = await Promise.all([
    fetch(`${apiUrl}/v1/admin/products?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }),
    fetch(`${apiUrl}/v1/admin/makers?status=active`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }),
  ]);

  if (!productsRes.ok) {
    throw new Error(
      `Failed to fetch /v1/admin/products: ${productsRes.status}`,
    );
  }
  if (!makersRes.ok) {
    throw new Error(`Failed to fetch /v1/admin/makers: ${makersRes.status}`);
  }

  const { products, total, per_page } =
    (await productsRes.json()) as AdminProductListResponse;
  const { makers } = (await makersRes.json()) as AdminMakersResponse;

  const totalPages = Math.max(1, Math.ceil(total / per_page));
  const rangeStart = total === 0 ? 0 : (page - 1) * per_page + 1;
  const rangeEnd = Math.min(page * per_page, total);

  function pageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (makerId) next.set("maker_id", makerId);
    if (isPublic !== undefined) next.set("is_public", String(isPublic));
    if (commercialStatus) next.set("commercial_status", commercialStatus);
    if (confidence) next.set("confidence", confidence);
    if (sort) next.set("sort", sort);
    next.set("dir", dir);
    next.set("page", String(targetPage));
    return `/admin/products?${next.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">資材マスタ</h1>
          <p className="text-sm text-muted-foreground">
            BS 資材 (products) の業務管理。
          </p>
        </div>
        {/* 2026-06-07: admin は maker 用の登録フォームから「Farmille として」
            製品登録できる (maker_id は Farmille 公式アカウントに紐づく) */}
        <Link
          href="/products/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          製品を登録（Farmille として）
        </Link>
      </header>

      {/* 検索 + フィルタ。
          Next.js 16 `<Form scroll={false}>` で client-side navigation + scroll
          位置保持 (Material 3 + Nielsen Norman の「コンテキスト維持」原則)。
          progressive enhancement あり、JS 無効時も通常 GET form として機能。
          各 input/select に focus-visible:ring-2 を付与し WCAG 2.4.7 対応。 */}
      <Form
        action="/admin/products"
        scroll={false}
        className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-md border border-border bg-card p-4"
      >
        <label className="md:col-span-2 space-y-1">
          <span className="text-xs text-muted-foreground">
            キーワード (name / 和名)
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="例: バチルス"
            className="w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
            maxLength={100}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">メーカー</span>
          <select
            name="maker_id"
            defaultValue={makerId}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          >
            <option value="">すべて</option>
            {makers.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.company_name ?? m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">公開</span>
          <select
            name="is_public"
            defaultValue={isPublic === undefined ? "" : String(isPublic)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          >
            <option value="">すべて</option>
            <option value="true">公開のみ</option>
            <option value="false">非公開のみ</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">流通状態</span>
          <select
            name="commercial_status"
            defaultValue={commercialStatus}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          >
            <option value="">すべて</option>
            {COMMERCIAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">confidence</span>
          <select
            name="confidence"
            defaultValue={confidence}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
          >
            <option value="">すべて</option>
            {CONFIDENCE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-6 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
          >
            絞り込む
          </button>
          <Link
            href="/admin/products"
            className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
          >
            クリア
          </Link>
        </div>
      </Form>

      <p className="text-sm text-muted-foreground">
        全 {total} 件中 {rangeStart}–{rangeEnd} を表示 / page {page} / {totalPages}
      </p>

      {products.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-10 text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            該当する資材が見つかりません
          </p>
          <p className="text-sm text-muted-foreground">
            フィルタを緩めるかキーワードを変更してください。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 w-16">サムネ</th>
                <SortableHeader
                  label="名前"
                  columnKey="name"
                  currentSort={sort}
                  currentDir={dir}
                  basePath="/admin/products"
                  params={sortParams}
                  className="px-3 py-2"
                />
                <SortableHeader
                  label="和名"
                  columnKey="product_name_jp"
                  currentSort={sort}
                  currentDir={dir}
                  basePath="/admin/products"
                  params={sortParams}
                  className="px-3 py-2"
                />
                <th className="px-3 py-2">メーカー</th>
                <SortableHeader
                  label="公開"
                  columnKey="is_public"
                  currentSort={sort}
                  currentDir={dir}
                  basePath="/admin/products"
                  params={sortParams}
                  className="px-3 py-2"
                />
                <SortableHeader
                  label="confidence"
                  columnKey="confidence"
                  currentSort={sort}
                  currentDir={dir}
                  basePath="/admin/products"
                  params={sortParams}
                  className="px-3 py-2"
                />
                <SortableHeader
                  label="更新日"
                  columnKey="updated_at"
                  currentSort={sort}
                  currentDir={dir}
                  basePath="/admin/products"
                  params={sortParams}
                  className="px-3 py-2"
                />
                <th className="px-3 py-2 w-36">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-3 py-2">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail_url}
                        alt=""
                        className="w-12 h-12 object-cover rounded border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded border border-dashed border-border bg-muted/30" />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/products/${encodeURIComponent(p.id)}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[220px] truncate">
                    {p.product_name_jp ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{p.maker_name ?? "—"}</span>
                      <MakerStatusBadge status={p.maker_status} />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <PublishBadge isPublic={p.is_public} />
                  </td>
                  <td className="px-3 py-2">
                    <ConfidenceBadge value={p.confidence} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDate(p.updated_at)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/products/${encodeURIComponent(p.id)}`}
                        className="text-xs text-primary hover:underline"
                      >
                        編集
                      </Link>
                      <ProductDeleteButton
                        productId={p.id}
                        productName={p.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="pagination"
          className="flex items-center justify-between"
        >
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={
              "rounded border border-border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2 " +
              (page <= 1
                ? "pointer-events-none opacity-50"
                : "hover:bg-muted")
            }
          >
            前へ
          </Link>
          <span className="text-xs text-muted-foreground">
            page {page} / {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={
              "rounded border border-border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2 " +
              (page >= totalPages
                ? "pointer-events-none opacity-50"
                : "hover:bg-muted")
            }
          >
            次へ
          </Link>
        </nav>
      ) : null}
    </div>
  );
}

// maker (users.status) を一目で識別するためのバッジ。
// active のときは何も出さない (デフォルト想定、ノイズ削減)。
// それ以外の状態を視覚的に強調し admin が問題のあるメーカーの product を
// 即座に発見できるようにする (ADR-0009 整合、spec 改善推奨 4.2)。
function MakerStatusBadge({
  status,
}: {
  status: import("@/types/admin").MakerAccountStatus | null;
}) {
  if (!status || status === "active") return null;
  const labelMap: Record<string, { label: string; cls: string }> = {
    pending_review: {
      label: "承認待ち",
      cls: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    },
    rejected: {
      label: "却下",
      cls: "bg-rose-500/15 text-rose-700 border-rose-500/30",
    },
    frozen: {
      label: "凍結",
      cls: "bg-slate-500/15 text-slate-700 border-slate-500/30",
    },
  };
  const entry = labelMap[status];
  if (!entry) return null;
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-xs ${entry.cls}`}
      title={`maker status: ${status}`}
    >
      {entry.label}
    </span>
  );
}

function PublishBadge({ isPublic }: { isPublic: boolean }) {
  return isPublic ? (
    <span className="inline-block rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
      公開
    </span>
  ) : (
    <span className="inline-block rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
      非公開
    </span>
  );
}

function ConfidenceBadge({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const color =
    value === "高"
      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
      : value === "中"
        ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
        : value === "低"
          ? "bg-orange-500/15 text-orange-700 border-orange-500/30"
          : "bg-rose-500/15 text-rose-700 border-rose-500/30";
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs ${color}`}
    >
      {value}
    </span>
  );
}
