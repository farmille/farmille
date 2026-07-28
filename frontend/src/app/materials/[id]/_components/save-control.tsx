"use client";

import Link from "next/link";

import { buttonRecipe } from "@/components";
import { trackMaterialSaved } from "@/lib/analytics/events";
import { css, cx } from "../../../../../styled-system/css";

const saveForm = css({
  display: "flex",
});

const saveButton = css({
  flex: "1",
});

type SaveControlProps = {
  materialId: string;
  materialPath: string;
  saved: boolean | null;
  toggleAction?: (formData: FormData) => Promise<void>;
  unavailable?: boolean;
};

export function SaveControl({
  materialId,
  materialPath,
  saved,
  toggleAction,
  unavailable = false,
}: SaveControlProps) {
  if (unavailable) {
    return (
      <p className={css({ m: "0", fontSize: "sm", color: "text.subtle" })}>
        検討リストは一般ユーザー向けの機能です。
      </p>
    );
  }

  if (saved === null || toggleAction === undefined) {
    const loginHref = `/login?next=${encodeURIComponent(materialPath)}`;

    return (
      <Link
        href={loginHref}
        className={cx(buttonRecipe({ variant: "ghost", size: "sm" }), saveButton)}
      >
        ログインして検討リストに保存
      </Link>
    );
  }

  return (
    <form
      action={async (formData) => {
        await toggleAction(formData);
        if (!saved) trackMaterialSaved(materialId);
      }}
      className={saveForm}
    >
      <button
        type="submit"
        className={cx(buttonRecipe({ variant: "ghost", size: "sm" }), saveButton)}
      >
        {saved ? "保存済み（解除する）" : "検討リストに保存"}
      </button>
    </form>
  );
}
