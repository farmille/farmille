"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type CropNode = { id: string; name: string };
export type L2Node = { id: string; name: string; children: CropNode[] };
export type L1Node = { id: string; name: string; children: L2Node[] };

type Props = {
  tree: L1Node[];
  selectedCropId: string | null;
};

const SELECT_CLASS =
  "h-10 rounded-sm border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

function findAncestors(
  tree: L1Node[],
  cropId: string | null,
): { l1: string | null; l2: string | null } {
  if (!cropId) return { l1: null, l2: null };
  for (const l1 of tree) {
    for (const l2 of l1.children) {
      if (l2.children.some((c) => c.id === cropId)) {
        return { l1: l1.id, l2: l2.id };
      }
    }
  }
  return { l1: null, l2: null };
}

// 注: parent から `key={selectedCropId ?? "none"}` で remount される前提。
// useEffect で props を local state に同期する derived-state アンチパターンを避ける。
export function CropCascadeFilter({ tree, selectedCropId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [l1Id, setL1Id] = useState<string | null>(
    () => findAncestors(tree, selectedCropId).l1,
  );
  const [l2Id, setL2Id] = useState<string | null>(
    () => findAncestors(tree, selectedCropId).l2,
  );

  const l2Options = useMemo(
    () => (l1Id ? tree.find((l) => l.id === l1Id)?.children ?? [] : []),
    [tree, l1Id],
  );
  const cropOptions = useMemo(
    () =>
      l1Id && l2Id
        ? l2Options.find((l) => l.id === l2Id)?.children ?? []
        : [],
    [l2Options, l1Id, l2Id],
  );

  const updateUrl = (cropId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cropId) {
      params.set("crop_id", cropId);
    } else {
      params.delete("crop_id");
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleL1 = (id: string) => {
    setL1Id(id || null);
    setL2Id(null);
    if (selectedCropId) updateUrl(null);
  };
  const handleL2 = (id: string) => {
    setL2Id(id || null);
    if (selectedCropId) updateUrl(null);
  };
  const handleCrop = (id: string) => updateUrl(id || null);
  const handleClear = () => {
    setL1Id(null);
    setL2Id(null);
    updateUrl(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">作目で絞り込む</p>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          isPending && "opacity-60 pointer-events-none",
        )}
        role="group"
        aria-label="作目カスケードフィルタ"
      >
        <select
          value={l1Id ?? ""}
          onChange={(e) => handleL1(e.target.value)}
          className={SELECT_CLASS}
          aria-label="大分類"
        >
          <option value="">大分類</option>
          {tree.map((l1) => (
            <option key={l1.id} value={l1.id}>
              {l1.name}
            </option>
          ))}
        </select>
        <select
          value={l2Id ?? ""}
          onChange={(e) => handleL2(e.target.value)}
          disabled={!l1Id}
          className={SELECT_CLASS}
          aria-label="中分類"
        >
          <option value="">中分類</option>
          {l2Options.map((l2) => (
            <option key={l2.id} value={l2.id}>
              {l2.name}
            </option>
          ))}
        </select>
        <select
          value={selectedCropId ?? ""}
          onChange={(e) => handleCrop(e.target.value)}
          disabled={!l2Id}
          className={SELECT_CLASS}
          aria-label="作目"
        >
          <option value="">作目</option>
          {cropOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {selectedCropId && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            クリア
          </button>
        )}
      </div>
    </div>
  );
}
