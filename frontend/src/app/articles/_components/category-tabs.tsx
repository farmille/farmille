import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ARTICLE_CATEGORY_LABEL,
  type ArticleCategory,
} from "./article-card";

type CategoryTab = {
  value: ArticleCategory | null;
  label: string;
};

// 表示順は spec §6.1 のタブ順に合わせる: all, monthly, weekly, featured, column
const TABS: CategoryTab[] = [
  { value: null, label: "すべて" },
  { value: "monthly_report", label: ARTICLE_CATEGORY_LABEL.monthly_report },
  { value: "weekly_report", label: ARTICLE_CATEGORY_LABEL.weekly_report },
  { value: "featured", label: ARTICLE_CATEGORY_LABEL.featured },
  { value: "column", label: ARTICLE_CATEGORY_LABEL.column },
];

type Props = {
  selectedCategory: ArticleCategory | null;
};

/**
 * カテゴリ切替タブ。Server Component のまま <Link> で URL クエリ遷移する。
 * （URL クエリ反映で SSR 再フェッチするので Client にする必要がない）
 */
export function CategoryTabs({ selectedCategory }: Props) {
  const baseBtn =
    "rounded-sm border px-4 py-2 text-sm font-medium transition-colors inline-block";
  const activeBtn = "bg-primary text-primary-foreground border-primary";
  const inactiveBtn =
    "bg-card text-foreground border-border hover:bg-muted";

  return (
    <nav
      className="flex flex-wrap gap-2"
      role="navigation"
      aria-label="記事カテゴリフィルタ"
    >
      {TABS.map((tab) => {
        const href =
          tab.value === null ? "/articles" : `/articles?category=${tab.value}`;
        const isActive = selectedCategory === tab.value;
        return (
          <Link
            key={tab.value ?? "all"}
            href={href}
            className={cn(baseBtn, isActive ? activeBtn : inactiveBtn)}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
