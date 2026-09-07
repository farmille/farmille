"use client";

import Link from "next/link";
import { useRef } from "react";

import { deleteReviewAction } from "@/app/materials/[id]/review/actions";
import { buttonRecipe } from "@/components/Button";
import { css, cx } from "../../styled-system/css";

type ReviewOwnerActionsProps = {
  materialId: string;
  reviewId: string;
};

export function ReviewOwnerActions({ materialId, reviewId }: ReviewOwnerActionsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editHref = `/materials/${materialId}/review/${reviewId}/edit`;
  const deleteAction = deleteReviewAction.bind(null, materialId, reviewId);

  return (
    <>
      <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
        <Link href={editHref} className={buttonRecipe({ variant: "ghost", size: "sm" })}>
          編集
        </Link>
        <button
          type="button"
          className={buttonRecipe({ variant: "danger", size: "sm" })}
          onClick={() => dialogRef.current?.showModal()}
        >
          削除
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-review-title-${reviewId}`}
        className={css({
          maxW: "dialog",
          w: "100%",
          p: "4",
          bg: "surface.card",
          color: "text.default",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.default",
          borderRadius: "card",
          boxShadow: "shadow.lift",
          "&::backdrop": { bg: "ink/45" },
        })}
      >
        <h2
          id={`delete-review-title-${reviewId}`}
          className={css({ m: "0", fontSize: "lg", fontWeight: "700" })}
        >
          レビューを削除しますか？
        </h2>
        <p className={css({ mt: "2", mb: "4", fontSize: "sm", color: "text.muted" })}>
          削除したレビューと写真は元に戻せません。
        </p>
        <div className={css({ display: "flex", gap: "2" })}>
          <button
            type="button"
            className={cx(buttonRecipe({ variant: "ghost", size: "md" }), css({ flex: "1" }))}
            onClick={() => dialogRef.current?.close()}
          >
            キャンセル
          </button>
          <form action={deleteAction} className={css({ flex: "1" })}>
            <button type="submit" className={buttonRecipe({ variant: "danger", size: "md" })}>
              削除する
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
