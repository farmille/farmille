"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge, Button, ConfirmDialog, SurfaceCard, buttonRecipe } from "@/components";
import { Notice } from "@/components/form";
import { formatDateJa } from "@/components/format-date";
import type { SellerArticleListItem } from "@/server/queries/seller-articles";
import { css } from "../../../../../styled-system/css";
import { deleteArticleAction, setArticleStatusAction } from "../actions";
import type { SellerArticleFormState } from "./form-state";

const rowActions = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  mt: "3",
});

const meta = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2",
  mt: "2",
  textStyle: "note",
  color: "text.subtle",
});

type ArticleListItemProps = {
  article: SellerArticleListItem;
};

export function ArticleListItem({ article }: ArticleListItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SellerArticleFormState>({ status: "idle" });
  const isPublished = article.status === "published";

  function toggleStatus(): void {
    startTransition(async () => {
      const result = await setArticleStatusAction(article.id, isPublished ? "draft" : "published");
      setState(result);
      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <SurfaceCard title={article.title}>
      <div className={meta}>
        <Badge variant={isPublished ? "published" : "draft"}>
          {isPublished ? "公開中" : "下書き"}
        </Badge>
        <span>更新 {formatDateJa(article.updated_at)}</span>
        {article.published_at === null ? null : (
          <span>公開 {formatDateJa(article.published_at)}</span>
        )}
      </div>

      {state.status === "idle" ? null : (
        <Notice className={css({ mt: "3" })} tone={state.status}>
          {state.message}
        </Notice>
      )}

      <div className={rowActions}>
        <Link
          className={buttonRecipe({ variant: "ghost", size: "sm" })}
          href={`/dashboard/articles/${article.id}/edit`}
        >
          編集
        </Link>
        <Button disabled={pending} onClick={toggleStatus} size="sm" type="button" variant="ghost">
          {isPublished ? "非公開にする" : "公開する"}
        </Button>
        {isPublished ? (
          <Link
            className={buttonRecipe({ variant: "ghost", size: "sm" })}
            href={`/articles/${article.id}`}
          >
            公開ページ
          </Link>
        ) : null}
        <ConfirmDialog
          action={deleteArticleAction.bind(null, article.id)}
          confirmLabel="削除する"
          pendingLabel="削除中…"
          description={
            isPublished ? (
              <>
                公開中の記事です。削除すると公開ページからも消えます。まず「非公開にする」で様子を見ることもできます。削除は取り消せません。
              </>
            ) : (
              <>この下書きを削除します。削除は取り消せません。</>
            )
          }
          title="記事を削除しますか？"
          trigger={
            <Button disabled={pending} size="sm" variant="danger">
              削除
            </Button>
          }
        />
      </div>
    </SurfaceCard>
  );
}
