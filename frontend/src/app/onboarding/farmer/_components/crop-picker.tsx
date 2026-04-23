"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Crop = {
  id: string;
  name: string;
  crop_categories_l2_id: string;
};
export type CategoryL2 = {
  id: string;
  name: string;
  crop_categories_l1_id: string;
};
export type CategoryL1 = { id: string; name: string };

type Props = {
  crops: Crop[];
  categoriesL1: CategoryL1[];
  categoriesL2: CategoryL2[];
  selected: string[];
  onChange: (ids: string[]) => void;
};

export function CropPicker({
  crops,
  categoriesL1,
  categoriesL2,
  selected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const cropById = useMemo(
    () => new Map(crops.map((c) => [c.id, c] as const)),
    [crops],
  );

  const groups = useMemo(() => {
    const l1ById = new Map(categoriesL1.map((x) => [x.id, x] as const));
    const l2ById = new Map(categoriesL2.map((x) => [x.id, x] as const));
    const byL2 = new Map<string, Crop[]>();
    for (const crop of crops) {
      const arr = byL2.get(crop.crop_categories_l2_id) ?? [];
      arr.push(crop);
      byL2.set(crop.crop_categories_l2_id, arr);
    }
    const entries: Array<{ heading: string; crops: Crop[] }> = [];
    for (const [l2Id, cropsOfL2] of byL2) {
      const l2 = l2ById.get(l2Id);
      if (!l2) continue;
      const l1 = l1ById.get(l2.crop_categories_l1_id);
      entries.push({
        heading: `${l1?.name ?? ""} › ${l2.name}`,
        crops: cropsOfL2.slice().sort((a, b) => a.name.localeCompare(b.name, "ja")),
      });
    }
    entries.sort((a, b) => a.heading.localeCompare(b.heading, "ja"));
    return entries;
  }, [crops, categoriesL1, categoriesL2]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selected.length === 0
              ? "作目を選択してください"
              : `${selected.length} 件選択中`}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="作目名で検索..." />
            <CommandList>
              <CommandEmpty>該当する作目がありません</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading}>
                  {group.crops.map((crop) => {
                    const isSelected = selected.includes(crop.id);
                    return (
                      <CommandItem
                        key={crop.id}
                        value={`${crop.name} ${group.heading}`}
                        onSelect={() => toggle(crop.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {crop.name}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const crop = cropById.get(id);
            if (!crop) return null;
            return (
              <li
                key={id}
                className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-2 py-1 text-sm text-foreground"
              >
                {crop.name}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-background"
                  aria-label={`${crop.name} を削除`}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
