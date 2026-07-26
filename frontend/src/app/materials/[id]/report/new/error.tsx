"use client";

import { css } from "../../../../../../styled-system/css";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/button";

const shell = css({
  minH: "100dvh",
  maxW: "430px",
  mx: "auto",
  bg: "surface.panel",
});

const main = css({ px: "4", py: "12", textAlign: "center" });
const title = css({ fontSize: "xl", fontWeight: "800" });
const message = css({
  mt: "3",
  color: "text.muted",
  fontSize: "md",
  lineHeight: "1.7",
});
const action = css({ mt: "6" });

export default function ReportFormError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={shell}>
      <AppBar title="使用結果入力" />
      <main className={main}>
        <h1 className={title}>入力画面を表示できませんでした</h1>
        <p className={message}>
          通信状態を確認して、もう一度お試しください。入力済みの下書きは削除されません。
        </p>
        <div className={action}>
          <Button onClick={reset}>もう一度試す</Button>
        </div>
      </main>
    </div>
  );
}
