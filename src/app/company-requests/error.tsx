"use client";

import Link from "next/link";
import { buttonRecipe } from "@/components/Button";

import { css } from "../../../styled-system/css";
import { DoneMessage } from "./_components/DoneMessage";

/** error.tsx はクライアント部品なので、ログイン状態を読む外枠（SitePageShell）は使わない。 */
export default function ApplicationErrorPage({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <div className={css({ minH: "100dvh", bg: "surface.panel", px: "4", pt: "4", pb: "10" })}>
      <main>
        <DoneMessage
          as="h1"
          check={false}
          className={css({ maxW: "content.form", mx: "auto" })}
          title="申請ページを開けませんでした"
          actions={
            <>
              <button
                className={buttonRecipe({ variant: "primary" })}
                onClick={unstable_retry}
                type="button"
              >
                再読み込み
              </button>
              <Link
                className={buttonRecipe({ variant: "ghost" })}
                href="/company-requests/receipts"
              >
                受付票の確認メールを再発行
              </Link>
              <Link className={buttonRecipe({ variant: "ghost" })} href="/company-requests/removal">
                申請用メールを再発行
              </Link>
            </>
          }
        >
          <p>
            認証の有効期限が切れた場合は、確認メールを再発行してください。受付済みの申請は、受付番号とメールアドレスで再確認できます。時間をおいても開けない場合は、受付番号を添えて運営へご連絡ください。
          </p>
        </DoneMessage>
      </main>
    </div>
  );
}
