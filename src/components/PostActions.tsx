"use client";

import { useEffect, useRef, useState } from "react";
import type { PostTarget } from "@/server/queries/post-actions";
import { recordReviewCardView, setPostSavedAction } from "@/server/actions/post-actions";
import { toggleHelpfulAction } from "@/server/actions/helpful";
import { BookmarkButton } from "./BookmarkButton";
import { HelpfulButton } from "./HelpfulButton";
import { Icon } from "./Icon";
import { helpfulPillRecipe } from "./helpful-pill";
import { css } from "../../styled-system/css";

type PostActionsProps = {
  target: PostTarget;
  id?: string;
  currentPath: string;
  helpfulCount: number;
  voted: boolean;
  saved: boolean;
  viewCount: number;
  own?: boolean;
};

/** 投稿種別によらず、参考になった・保存・閲覧数を同じ順序に並べる。 */
export function PostActions({
  target,
  id,
  currentPath,
  helpfulCount,
  voted,
  saved,
  viewCount,
  own = false,
}: PostActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const viewRef = useRef<HTMLSpanElement>(null);
  const recorded = useRef(false);
  useEffect(() => {
    if (target !== "review" || id === undefined || viewRef.current === null) return;
    const observer = new IntersectionObserver((entries) => {
      if (recorded.current || !entries.some((entry) => entry.isIntersecting)) return;
      recorded.current = true;
      observer.disconnect();
      void recordReviewCardView(id).catch(() => setError("閲覧数を記録できませんでした。"));
    });
    observer.observe(viewRef.current);
    return () => observer.disconnect();
  }, [target, id]);
  return (
    <div className={css({ mt: "2.5" })}>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "1.5",
          flexWrap: "wrap",
          fontSize: "2xs",
          color: "text.subtle",
        })}
      >
        {id !== undefined && !own ? (
          <HelpfulButton
            action={toggleHelpfulAction.bind(null, target, id, currentPath)}
            count={helpfulCount}
            voted={voted}
            layout="card"
          />
        ) : (
          <button type="button" disabled className={helpfulPillRecipe({ layout: "card" })}>
            <Icon name="thumb_up" size="xs" />
            <span>参考になった</span>
            {helpfulCount}
          </button>
        )}
        <BookmarkButton
          saved={saved}
          action={
            id === undefined ? undefined : setPostSavedAction.bind(null, target, id, currentPath)
          }
        />
        <span
          ref={viewRef}
          aria-label={`${viewCount}回閲覧`}
          className={css({
            ml: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: "1",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          })}
        >
          <Icon name="visibility" size="xs" />
          {viewCount.toLocaleString("ja-JP")}
        </span>
      </div>
      {error ? (
        <p role="status" className={css({ fontSize: "xs", color: "text.muted" })}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
