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

export type TagItem = {
  id: string;
  name: string;
  group?: string;
};

type Props = {
  items: TagItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

export function TagMultiSelect({
  items,
  selected,
  onChange,
  placeholder = "選択してください",
  emptyText = "該当する項目がありません",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  const itemById = useMemo(
    () => new Map(items.map((it) => [it.id, it] as const)),
    [items],
  );

  const groups = useMemo(() => {
    const hasGroup = items.some((it) => it.group !== undefined);
    if (!hasGroup) {
      return [{ heading: "", items }];
    }
    const byGroup = new Map<string, TagItem[]>();
    for (const it of items) {
      const key = it.group ?? "";
      const arr = byGroup.get(key) ?? [];
      arr.push(it);
      byGroup.set(key, arr);
    }
    return Array.from(byGroup, ([heading, items]) => ({ heading, items }));
  }, [items]);

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
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {selected.length === 0
              ? placeholder
              : `${selected.length} 件選択中`}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="検索..." />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup
                  key={group.heading || "default"}
                  heading={group.heading || undefined}
                >
                  {group.items.map((it) => {
                    const isSelected = selected.includes(it.id);
                    return (
                      <CommandItem
                        key={it.id}
                        value={`${it.name} ${group.heading}`}
                        onSelect={() => toggle(it.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {it.name}
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
            const it = itemById.get(id);
            if (!it) return null;
            return (
              <li
                key={id}
                className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-2 py-1 text-sm text-foreground"
              >
                {it.name}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  disabled={disabled}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-background disabled:opacity-50"
                  aria-label={`${it.name} を削除`}
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
