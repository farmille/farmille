"use client";

import Link from "next/link";
import { useActionState } from "react";

import { buttonRecipe } from "@/components";
import { trackMaterialSaved } from "@/lib/analytics/events";
import { css, cx } from "../../../../../styled-system/css";
import type { SaveControlState } from "../actions";

const saveForm = css({
  display: "flex",
});

const saveButton = css({
  flex: "1",
});

type ToggleAction = (previous: SaveControlState, formData: FormData) => Promise<SaveControlState>;

type SaveControlProps = {
  materialId: string;
  materialPath: string;
  saved: boolean | null;
  toggleAction?: ToggleAction;
  unavailable?: boolean;
};

function SaveToggleForm({
  materialId,
  saved,
  toggleAction,
}: {
  materialId: string;
  saved: boolean;
  toggleAction: ToggleAction;
}) {
  const [state, formAction] = useActionState(toggleAction, { saved });

  return (
    <form action={formAction} className={saveForm}>
      <button
        type="submit"
        onClick={state.saved ? undefined : () => trackMaterialSaved(materialId)}
        className={cx(buttonRecipe({ variant: "ghost", size: "sm" }), saveButton)}
      >
        {state.saved ? "保存済み（解除する）" : "検討リストに保存"}
      </button>
    </form>
  );
}

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

  return <SaveToggleForm materialId={materialId} saved={saved} toggleAction={toggleAction} />;
}
