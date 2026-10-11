import Link from "next/link";

import { buttonRecipe } from "@/components";
import { SuccessMark, completionStepRecipe } from "@/components/SuccessMark";

import { css, cx } from "../../../../styled-system/css";

const wrap = css({
  textAlign: "center",
  pt: "7.5",
  px: "3",
  pb: "2.5",
  _print: { display: "none" },
});

const kindTitle = css({ fontSize: "md", color: "text.muted", mt: "2", lineHeight: "prose" });

const actions = css({ mt: "4.5", display: "flex", flexDirection: "column", gap: "2.5" });

export function ApplicationReceivedHeader({ title }: { title: string | null }) {
  return (
    <div className={wrap}>
      <SuccessMark entrance className={css({ mb: "4.5" })} />
      <h1 className={cx(css({ fontSize: "2xl" }), completionStepRecipe({ step: 1 }))}>
        ご申請を受け付けました
      </h1>
      {title === null ? null : (
        <p className={cx(kindTitle, completionStepRecipe({ step: 2 }))}>{title}</p>
      )}
      <div className={cx(actions, completionStepRecipe({ step: 3 }))}>
        <Link className={buttonRecipe({ variant: "ghost" })} href="/dashboard/applications">
          各種お手続きへ戻る
        </Link>
      </div>
    </div>
  );
}
