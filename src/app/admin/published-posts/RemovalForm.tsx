"use client";

import { useActionState } from "react";
import { Button } from "@/components";
import { FormMessage } from "@/components/auth/Fields";
import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { removePublishedPostAction } from "./actions";
import { css } from "../../../../styled-system/css";

export function RemovalForm({ id, type }: { id: string; type: "review" | "usage_report" }) {
  const [state, action, pending] = useActionState(
    removePublishedPostAction,
    initialAdminActionState,
  );
  return (
    <details>
      <summary className={css({ color: "primary.700", cursor: "pointer", fontWeight: "700" })}>
        公開から削除する
      </summary>
      <form action={action} className={css({ display: "grid", gap: "3", mt: "3" })}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="type" value={type} />
        <p>
          この投稿を非公開にします。公開ページと一覧から表示されなくなります。本文や添付データは保持されます。
        </p>
        <label>
          <input type="checkbox" name="confirmed" required />{" "}
          この投稿を非公開にすることを確認しました
        </label>
        {state.status !== "idle" ? (
          <FormMessage tone={state.status === "error" ? "error" : "info"}>
            {state.message}
          </FormMessage>
        ) : null}
        <Button variant="danger" type="submit" disabled={pending || state.status === "done"}>
          非公開にする
        </Button>
      </form>
    </details>
  );
}
