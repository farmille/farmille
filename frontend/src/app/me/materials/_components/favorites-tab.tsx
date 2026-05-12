import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FavoriteCard, type FavoriteItem } from "./favorite-card";

type Props = {
  items: FavoriteItem[];
  emptyHeadline: string;
  emptyHelpText: string;
};

export function FavoritesTab({ items, emptyHeadline, emptyHelpText }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center space-y-3">
        <p className="text-lg font-medium text-foreground">{emptyHeadline}</p>
        <p className="text-sm text-muted-foreground">{emptyHelpText}</p>
        <Button asChild>
          <Link href="/products">資材一覧へ</Link>
        </Button>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <FavoriteCard key={item.id} item={item} />
      ))}
    </ul>
  );
}
