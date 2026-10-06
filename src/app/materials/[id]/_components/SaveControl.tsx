"use client";

import Link from "next/link";
import { useActionState } from "react";

import { trackMaterialSaved } from "@/lib/analytics/events";
import type { SaveControlState } from "../actions";

// 見本 S.material の data-fav ボタン。見た目は src/app/_mock/mock-extra.css の .mat-fav。

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
        className={state.saved ? "mat-fav on" : "mat-fav"}
      >
        <span aria-hidden="true">{state.saved ? "★" : "☆"}</span>
        {state.saved ? "お気に入りから解除" : "お気に入りに追加"}
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
    return <p className="mat-fav-note">お気に入りは一般ユーザー向けの機能です。</p>;
  }

  if (saved === null || toggleAction === undefined) {
    const loginHref = `/login?next=${encodeURIComponent(materialPath)}`;

    return (
      <Link href={loginHref} className="mat-fav">
        <span aria-hidden="true">☆</span>
        ログインしてお気に入りに保存
      </Link>
    );
  }

  return <SaveToggleForm materialId={materialId} saved={saved} toggleAction={toggleAction} />;
}
