"use client";

import { useState } from "react";
import { css } from "../../../../styled-system/css";
import { FilterPills } from "@/components/FilterPills";
import { StarRating } from "@/components/StarRating";
import { TagChip, type TagCategory } from "@/components/TagChip";

const FILTER_ITEMS = [
  { href: "/articles", label: "すべて", current: true },
  { href: "/articles?type=report", label: "実証詳細レポート", current: false },
  { href: "/articles?type=article", label: "記事", current: false },
];

const SELECTED_TAGS: Array<{ cat: TagCategory; v: string }> = [
  { cat: "crop", v: "ミニトマト" },
  { cat: "concern", v: "高温対策" },
  { cat: "effect", v: "草勢維持" },
];

/** /dev/ui 用のインタラクティブ見本。 */
export function UiKitInteractiveDemos() {
  const [stars, setStars] = useState(4);
  const [tags, setTags] = useState(SELECTED_TAGS);

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <div>
        <p className={css({ fontSize: "xs", color: "text.subtle", mb: "2" })}>FilterPills</p>
        <FilterPills aria-label="コンテンツ種別" items={FILTER_ITEMS} />
      </div>
      <div>
        <p className={css({ fontSize: "xs", color: "text.subtle", mb: "2" })}>
          StarRating（入力） value={stars}
        </p>
        <StarRating mode="input" value={stars} onChange={setStars} />
      </div>
      <div>
        <p className={css({ fontSize: "xs", color: "text.subtle", mb: "2" })}>TagChip（削除可）</p>
        <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5" })}>
          {tags.map((t, i) => (
            <TagChip
              key={`${t.cat}-${t.v}`}
              category={t.cat}
              label={t.v}
              onRemove={() => setTags((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
