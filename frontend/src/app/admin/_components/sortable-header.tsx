import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 列ヘッダクリックでソート (2026-06-29)。admin 全一覧で共通。
// サーバーコンポーネントのまま動く: ヘッダは Link で `?sort=<key>&dir=asc|desc` を
// 付けて再フェッチさせる (クライアント JS 不要)。他のフィルタ params は温存し、
// ソート変更時は page=1 にリセットする。初回クリックは降順 (最新/高い順が先)。
export type SortDir = "asc" | "desc";

export function SortableHeader({
  label,
  columnKey,
  currentSort,
  currentDir,
  basePath,
  params,
  className,
}: {
  label: string;
  columnKey: string;
  currentSort: string | null;
  currentDir: SortDir;
  basePath: string;
  /** sort/dir/page を除いた温存対象の検索パラメータ */
  params: Record<string, string>;
  className?: string;
}) {
  const active = currentSort === columnKey;
  const nextDir: SortDir = active && currentDir === "desc" ? "asc" : "desc";

  const qs = new URLSearchParams(params);
  qs.set("sort", columnKey);
  qs.set("dir", nextDir);
  qs.set("page", "1");

  const Icon = active ? (currentDir === "desc" ? ArrowDown : ArrowUp) : ChevronsUpDown;

  return (
    <th className={className}>
      <Link
        href={`${basePath}?${qs.toString()}`}
        scroll={false}
        aria-label={`${label} で並べ替え (${active ? (currentDir === "desc" ? "降順" : "昇順") : "未選択"})`}
        className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
      >
        {label}
        <Icon
          className={cn(
            "h-3 w-3 shrink-0",
            active ? "text-foreground" : "text-muted-foreground/40",
          )}
          aria-hidden="true"
        />
      </Link>
    </th>
  );
}
