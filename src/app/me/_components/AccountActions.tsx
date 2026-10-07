import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { css } from "../../../../styled-system/css";

const actions = css({ display: "flex", flexDirection: "column", gap: "2.5", mt: "8", pb: "4" });

const action = buttonRecipe({ variant: "ghost" });

/** ログアウトとメーカー申請への導線。項目名と並びは以前の本番（b4ef5df）どおり。 */
export function AccountActions({ admin = false }: { admin?: boolean }) {
  return (
    <div className={actions}>
      {admin ? (
        <Link className={action} href="/admin">
          運営管理へ
        </Link>
      ) : null}
      <Link className={action} href="/account/passkeys">
        パスキーを管理
      </Link>
      <Link className={action} href="/account/password">
        パスワードを変更
      </Link>
      <form action="/logout" method="post">
        <button type="submit" className={action}>
          ログアウト
        </button>
      </form>
      {!admin ? (
        <Link className={action} href="/sellers?from=me">
          企業会員登録を申請
        </Link>
      ) : null}
    </div>
  );
}
