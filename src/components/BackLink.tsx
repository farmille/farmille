"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import * as v from "valibot";

const HistoryEntrySchema = v.object({ url: v.string() });

/** Navigation API の履歴は、同じオリジンで続いている画面だけを並べる。 */
const NavigationSchema = v.object({
  currentEntry: v.object({ index: v.number() }),
  entries: v.function(),
});

/**
 * 履歴を今の画面から前へたどり、今の画面のパスと同じか、その配下（入力画面など）を飛ばした最初の画面まで、
 * いくつ戻るか。該当する画面が無い（このサイトの画面から来ていない）ときは null。
 */
function stepsBackInThisSite(): number | null {
  const navigation = "navigation" in window ? window.navigation : undefined;
  if (!v.is(NavigationSchema, navigation)) return null;
  const entries: unknown = navigation.entries();
  if (!v.is(v.array(HistoryEntrySchema), entries)) return null;
  const currentIndex = navigation.currentEntry.index;
  const current = entries[currentIndex];
  if (current === undefined) return null;
  const path = new URL(current.url).pathname;
  const target = entries.slice(0, currentIndex).findLastIndex(({ url }) => {
    const entryPath = new URL(url).pathname;
    return entryPath !== path && !entryPath.startsWith(`${path}/`);
  });
  return target === -1 ? null : currentIndex - target;
}

function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

type BackLinkProps = {
  /** このサイトの画面から来ていないとき（外部から来た・直接開いた）の行き先。 */
  href: string;
  className: string;
  "aria-label"?: string;
  children: ReactNode;
};

/**
 * このサイトの画面から来たときはブラウザの履歴で戻り、そうでなければ href へ移る「戻る」リンク。
 * 投稿の後に投稿画面や同じ画面へ戻らないよう、今の画面と同じパスやその配下の画面は飛ばす。
 */
export function BackLink({ href, className, "aria-label": ariaLabel, children }: BackLinkProps) {
  return (
    <Link
      aria-label={ariaLabel}
      className={className}
      href={href}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        const steps = stepsBackInThisSite();
        if (steps === null) return;
        event.preventDefault();
        window.history.go(-steps);
      }}
    >
      {children}
    </Link>
  );
}
