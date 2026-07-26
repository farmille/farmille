import Link from "next/link";
import { css, cx } from "../../../../styled-system/css";

import { buttonRecipe, EmptyState } from "@/components";

import { MaterialPageShell } from "./_components/page-shell";

export default function MaterialNotFound() {
  return (
    <MaterialPageShell title="資材が見つかりません" backHref="/">
      <EmptyState
        title="資材が見つかりません"
        description="指定された資材は存在しないか、公開が終了した可能性があります。"
        className={css({ minH: "60dvh" })}
      >
        <Link
          href="/"
          className={cx(buttonRecipe({ variant: "primary", size: "sm" }), css({ mt: "3" }))}
        >
          ホームへ戻る
        </Link>
      </EmptyState>
    </MaterialPageShell>
  );
}
