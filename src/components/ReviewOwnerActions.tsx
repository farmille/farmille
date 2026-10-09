"use client";

import Link from "next/link";

import { deleteReviewAction } from "@/app/materials/[id]/review/actions";
import { Button, buttonRecipe } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { css } from "../../styled-system/css";

type ReviewOwnerActionsProps = {
  materialId: string;
  reviewId: string;
};

export function ReviewOwnerActions({ materialId, reviewId }: ReviewOwnerActionsProps) {
  const editHref = `/materials/${materialId}/review/${reviewId}/edit`;
  const deleteAction = deleteReviewAction.bind(null, materialId, reviewId);

  return (
    <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
      <Link href={editHref} className={buttonRecipe({ variant: "ghost", size: "sm" })}>
        編集
      </Link>
      <ConfirmDialog
        title="感想口コミを削除しますか？"
        description="削除した感想口コミと写真は元に戻せません。"
        confirmLabel="削除する"
        pendingLabel="削除中…"
        trigger={
          <Button size="sm" variant="danger">
            削除
          </Button>
        }
        action={deleteAction}
      />
    </div>
  );
}
