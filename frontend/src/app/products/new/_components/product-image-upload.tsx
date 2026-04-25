"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { X, ImagePlus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];

export type ProductImageItem =
  | {
      id: string;
      kind: "existing";
      url: string;
      path: string;
    }
  | {
      id: string;
      kind: "new";
      url: string;
      file: File;
    };

type Props = {
  items: ProductImageItem[];
  onItemsChange: (items: ProductImageItem[]) => void;
  disabled?: boolean;
};

export function ProductImageUpload({ items, onItemsChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const remaining = Math.max(0, MAX_FILES - items.length);

  const addFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const accepted: File[] = [];
      for (const f of incoming) {
        if (!ACCEPTED_MIME.includes(f.type)) {
          setError("JPEG / PNG / WebP のみアップロードできます");
          continue;
        }
        if (f.size > MAX_SIZE_BYTES) {
          setError("画像 1 枚あたり 10MB までです");
          continue;
        }
        accepted.push(f);
      }
      const truncated = accepted.slice(0, remaining);
      if (accepted.length > remaining) {
        setError(`画像は最大 ${MAX_FILES} 枚までです (残り ${remaining} 枚)`);
      }
      const newItems: ProductImageItem[] = truncated.map((file) => ({
        id: crypto.randomUUID(),
        kind: "new",
        url: URL.createObjectURL(file),
        file,
      }));
      onItemsChange([...items, ...newItems]);
    },
    [items, onItemsChange, remaining],
  );

  const removeAt = useCallback(
    (id: string) => {
      onItemsChange(items.filter((it) => it.id !== id));
    },
    [items, onItemsChange],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((it) => it.id === active.id);
      const newIndex = items.findIndex((it) => it.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      onItemsChange(arrayMove(items, oldIndex, newIndex));
    },
    [items, onItemsChange],
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "rounded-md border border-dashed border-border bg-muted/40 p-6 text-center cursor-pointer transition-colors",
          dragOver && "bg-muted",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIME.join(",")}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) {
              addFiles(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />
        <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-foreground">
          画像をドラッグ&ドロップ、またはクリックで選択
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG / PNG / WebP、1 枚あたり最大 10MB、最大 {MAX_FILES} 枚
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((it) => it.id)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {items.map((item) => (
                <SortableThumbnail
                  key={item.id}
                  item={item}
                  disabled={disabled}
                  onRemove={() => removeAt(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {items.length > 1 && (
        <p className="text-xs text-muted-foreground">
          サムネイルをドラッグして並び替えできます。先頭が代表画像になります。
        </p>
      )}
    </div>
  );
}

function SortableThumbnail({
  item,
  disabled,
  onRemove,
}: {
  item: ProductImageItem;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-sm border border-border overflow-hidden bg-muted touch-none"
      {...attributes}
      {...listeners}
    >
      <Image
        src={item.url}
        alt=""
        fill
        unoptimized={item.kind === "new"}
        sizes="(max-width: 640px) 33vw, 20vw"
        className="object-cover pointer-events-none"
      />
      <Button
        type="button"
        size="icon"
        variant="destructive"
        className="absolute top-1 right-1 h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={disabled}
        aria-label="画像を削除"
      >
        <X className="h-3 w-3" />
      </Button>
    </li>
  );
}
