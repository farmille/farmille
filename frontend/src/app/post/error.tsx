"use client";

import { Button } from "@/components/button";
import { FormPageShell } from "@/components/form-page-shell";
import { css } from "../../../styled-system/css";

type PostErrorProps = {
  unstable_retry: () => void;
};

export default function PostError({ unstable_retry }: PostErrorProps) {
  return (
    <FormPageShell title="投稿する" backHref="/">
      <h1 className={css({ m: "0", fontSize: "xl", fontWeight: "700" })}>
        投稿先を読み込めませんでした
      </h1>
      <p className={css({ mt: "2", mb: "4", color: "text.muted", fontSize: "sm" })}>
        時間をおいて、もう一度お試しください。
      </p>
      <Button type="button" onClick={unstable_retry}>
        もう一度試す
      </Button>
    </FormPageShell>
  );
}
