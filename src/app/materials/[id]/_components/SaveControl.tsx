"use client";

import Link from "next/link";
import { useActionState } from "react";

import { trackMaterialSaved } from "@/lib/analytics/events";
import { css, cva } from "../../../../../styled-system/css";

import type { SaveControlState } from "../actions";

const favRecipe = cva({
  base: {
    mt: "2",
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    px: "3",
    py: "1",
    fontSize: "sm",
    color: "text.muted",
    bg: "surface.card",
    borderWidth: "1px",
    borderColor: "border.strong",
    borderRadius: "pill",
    textDecoration: "none",
    cursor: "pointer",
  },
  variants: {
    saved: {
      true: { color: "accent.danger" },
      false: {},
    },
  },
  defaultVariants: { saved: false },
});

const noteStyle = css({ mt: "2", fontSize: "xs", color: "text.subtle" });

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
    <form action={formAction}>
      <button
        type="submit"
        onClick={state.saved ? undefined : () => trackMaterialSaved(materialId)}
        className={favRecipe({ saved: state.saved })}
        aria-label={state.saved ? "お気に入りから解除" : "お気に入りに追加"}
        aria-pressed={state.saved}
      >
        <span aria-hidden="true">{state.saved ? "★" : "☆"}</span>
        {state.saved ? "お気に入り済み" : "お気に入り"}
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
    return <div className={noteStyle}>お気に入りは一般ユーザー向けの機能です。</div>;
  }

  if (saved === null || toggleAction === undefined) {
    const loginHref = `/login?next=${encodeURIComponent(materialPath)}`;

    return (
      <Link href={loginHref} className={favRecipe()}>
        <span aria-hidden="true">☆</span>
        ログインしてお気に入りに保存
      </Link>
    );
  }

  return <SaveToggleForm materialId={materialId} saved={saved} toggleAction={toggleAction} />;
}
