import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminMakersResponse,
  AdminProductListResponse,
} from "@/types/admin";

export const metadata: Metadata = {
  title: "資材マスタ",
  description: "BS資材マスタ一覧",
};

// spec admin-aglist-alignment-v2.md §3.1: 資材マスタ一覧。
// /v1/admin/products を SSR 取得し、検索 / フィルタ / pagination を URL クエリで保持する。
// role guard は layout.tsx 側で通過済 (spec §6.1)。
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
    next.set("page", String(targetPage));
    return `/admin/products?${next.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">資材マスタ</h1>
        <p className="text-sm text-muted-foreground">
          BS 資材 (products) の業務管理。新規作成は v1.5+ で対応予定。
        </p>
      </header>

      {/* 検索 + フィルタ (URL クエリで GET 反映、Server Component に再フェッチさせる) */}
      <form
        method="get"
        action="/admin/products"
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
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            maxLength={100}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">メーカー</span>
          <select
            name="maker_id"
            defaultValue={makerId}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
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
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
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
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
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
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
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
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            絞り込む
          </button>
          <Link
            href="/admin/products"
            className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            クリア
          </Link>
        </div>
      </form>

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
                <th className="px-3 py-2">名前</th>
                <th className="px-3 py-2">和名</th>
                <th className="px-3 py-2">メーカー</th>
                <th className="px-3 py-2">公開</th>
                <th className="px-3 py-2">confidence</th>
                <th className="px-3 py-2">更新日</th>
                <th className="px-3 py-2 w-20">操作</th>
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
                    {p.maker_name ?? "—"}
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
                    <Link
                      href={`/admin/products/${encodeURIComponent(p.id)}`}
                      className="text-xs text-primary hover:underline"
                    >
                      編集
                    </Link>
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
              "rounded border border-border px-3 py-1 text-sm " +
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
              "rounded border border-border px-3 py-1 text-sm " +
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
