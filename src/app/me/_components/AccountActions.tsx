import Link from "next/link";

import { Button, buttonRecipe } from "@/components";
import { css, cx } from "../../../../styled-system/css";

const wrap = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "8",
  pb: "4",
});

/** ログアウトとメーカー申請への導線。 */
export function AccountActions() {
  return (
    <div className={wrap}>
      <form action="/logout" method="post">
        <Button type="submit" variant="ghost">
          ログアウト
        </Button>
      </form>
      <Link
        href="/sellers?from=me"
        className={cx(
          buttonRecipe({ variant: "ghost", size: "md" }),
          css({ display: "flex", textAlign: "center" }),
        )}
      >
        メーカーアカウントを申請
      </Link>
    </div>
  );
}
