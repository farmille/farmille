"use client";

import { useState } from "react";
import Image from "next/image";
import { PRODUCT_IMAGES_ENABLED } from "@/lib/flags";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type FavoriteKind = "favorite" | "candidate";

export type FavoriteItem = {
  id: string;
  kind: FavoriteKind;
  created_at: string | null;
  product: {
    id: string | null;
    name: string | null;
    maker_name: string | null;
    image_url: string | null;
    type_name: string | null;
  };
};

type Props = {
  item: FavoriteItem;
};

export function FavoriteCard({ item }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"delete" | "switch" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const otherKind: FavoriteKind =
    item.kind === "favorite" ? "candidate" : "favorite";
  const switchLabel =
    item.kind === "favorite" ? "候補に移動" : "お気に入りに移動";

  async function handleDelete() {
    if (busy) return;
    const ok = window.confirm("マイ資材から外しますか？");
    if (!ok) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/me/favorites/${item.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.push("/login?expired=1");
        return;
      }
      if (!res.ok && res.status !== 204) {
        setError("削除に失敗しました。時間をおいて再度お試しください");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("削除に失敗しました");
      setBusy(null);
    }
  }

  async function handleSwitchKind() {
    if (busy) return;
    setBusy("switch");
    setError(null);
    try {
      const res = await fetch(`/api/me/favorites/${item.id}/kind`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: otherKind }),
      });
      if (res.status === 401) {
        router.push("/login?expired=1");
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

  const productHref = item.product.id ? `/products/${item.product.id}` : "#";

  return (
    <li className="rounded-lg border border-border bg-card p-4 flex gap-4">
      {PRODUCT_IMAGES_ENABLED && item.product.image_url ? (
        <Image
          src={item.product.image_url}
          alt={item.product.name ?? ""}
          width={96}
          height={96}
          className="h-24 w-24 rounded-md object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-24 w-24 rounded-md bg-muted flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href={productHref}
            className="text-base font-medium hover:text-primary truncate"
          >
            {item.product.name ?? "（製品情報なし）"}
          </Link>
          {item.created_at && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {item.created_at.slice(0, 10)}
            </span>
          )}
        </div>
        {item.product.maker_name && (
          <p className="text-xs text-muted-foreground truncate">
            {item.product.maker_name}
          </p>
        )}
        {item.product.type_name && (
          <span className="inline-block rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {item.product.type_name}
          </span>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSwitchKind}
            disabled={busy !== null}
          >
            {busy === "switch" ? "切替中…" : switchLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={busy !== null}
          >
            {busy === "delete" ? "削除中…" : "外す"}
          </Button>
        </div>
      </div>
    </li>
  );
}
