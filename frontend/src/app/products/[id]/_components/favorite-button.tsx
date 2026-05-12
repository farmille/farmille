"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type FavoriteKind = "favorite" | "candidate";

export type ExistingFavorite = {
  id: string;
  kind: FavoriteKind;
};

type Mode =
  | { kind: "anon" }
  | { kind: "non-reviewer"; role: string | null }
  | { kind: "reviewer"; existing: ExistingFavorite | null };

export type FavoriteButtonProps = {
  productId: string;
  mode: Mode;
};

export function FavoriteButton({ productId, mode }: FavoriteButtonProps) {
  if (mode.kind === "anon") {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground space-y-2">
        <p>気になる資材を保存できます。</p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/login?next=/products/${productId}`}>
            ログインして保存する
          </Link>
        </Button>
      </div>
    );
  }
  if (mode.kind === "non-reviewer") {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        マイ資材機能は農家・JA・研究者向けです。
      </p>
    );
  }
  return (
    <ReviewerButtons productId={productId} existing={mode.existing} />
  );
}

function ReviewerButtons({
  productId,
  existing,
}: {
  productId: string;
  existing: ExistingFavorite | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"add-fav" | "add-cand" | "remove" | "switch" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function add(kind: FavoriteKind) {
    if (busy) return;
    setBusy(kind === "favorite" ? "add-fav" : "add-cand");
    setError(null);
    try {
      const res = await fetch(`/api/me/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, kind }),
      });
      if (res.status === 401) {
        router.push(`/login?next=/products/${productId}`);
        return;
      }
      if (res.status === 409) {
        setError("すでに追加されています。ページを再読込してください");
        setBusy(null);
        return;
      }
      if (!res.ok) {
        setError("追加に失敗しました");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("追加に失敗しました");
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    setBusy("remove");
    setError(null);
    try {
      const res = await fetch(`/api/me/favorites/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.push(`/login?next=/products/${productId}`);
        return;
      }
      if (!res.ok && res.status !== 204) {
        setError("外すのに失敗しました");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("外すのに失敗しました");
      setBusy(null);
    }
  }

  async function switchKind(id: string, otherKind: FavoriteKind) {
    if (busy) return;
    setBusy("switch");
    setError(null);
    try {
      const res = await fetch(`/api/me/favorites/${id}/kind`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: otherKind }),
      });
      if (res.status === 401) {
        router.push(`/login?next=/products/${productId}`);
        return;
      }
      if (!res.ok) {
        setError("切替に失敗しました");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("切替に失敗しました");
      setBusy(null);
    }
  }

  if (!existing) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm text-foreground">この資材をマイ資材に追加</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => add("favorite")}
            disabled={busy !== null}
          >
            {busy === "add-fav" ? "追加中…" : "お気に入りに追加"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add("candidate")}
            disabled={busy !== null}
          >
            {busy === "add-cand" ? "追加中…" : "候補に追加"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  const otherKind: FavoriteKind =
    existing.kind === "favorite" ? "candidate" : "favorite";
  const currentLabel =
    existing.kind === "favorite" ? "お気に入りに追加済み" : "候補に追加済み";
  const switchLabel =
    existing.kind === "favorite" ? "候補に移動" : "お気に入りに移動";

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">{currentLabel}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => switchKind(existing.id, otherKind)}
          disabled={busy !== null}
        >
          {busy === "switch" ? "切替中…" : switchLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => remove(existing.id)}
          disabled={busy !== null}
        >
          {busy === "remove" ? "外す中…" : "外す"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
