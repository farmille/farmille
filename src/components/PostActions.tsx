"use client";

import { usePostCardView } from "@/lib/hooks/use-post-card-view";
import type { PostTarget } from "@/server/queries/post-actions";
import { setPostSavedAction } from "@/server/actions/post-actions";
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
  const { error, viewRef } = usePostCardView(target, id);
  return (
    <div className={css({ mt: "2.5" })}>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "1.5",
          flexWrap: "wrap",
          fontSize: "sm",
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
          閲覧 {viewCount.toLocaleString("ja-JP")}
        </span>
      </div>
      {error ? (
        <p role="status" className={css({ textStyle: "note", color: "text.muted" })}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
