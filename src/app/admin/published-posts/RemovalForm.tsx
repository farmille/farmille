"use client";

import { useActionState } from "react";

import { adminBodyStyle } from "@/app/admin/_components/AdminUI";
import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
import { Checkbox, Field, Form, Notice, SubmitButton } from "@/components/form";
import { removePublishedPostAction } from "./actions";
import { css } from "../../../../styled-system/css";

const formStyle = css({ display: "grid", gap: "3", mt: "3" });

export function RemovalForm({ id, type }: { id: string; type: "review" | "usage_report" }) {
  const [state, action] = useActionState(removePublishedPostAction, initialAdminActionState);
  return (
    <Collapsible>
      <CollapsibleTrigger>公開から削除する</CollapsibleTrigger>
      <CollapsiblePanel>
        <Form action={action} className={formStyle}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="type" value={type} />
          <p className={adminBodyStyle}>
            この投稿を非公開にします。公開ページと一覧から表示されなくなります。本文や添付データは保持されます。
          </p>
          <Field name="confirmed" requirement="required">
            <Checkbox>この投稿を非公開にすることを確認しました</Checkbox>
          </Field>
          {state.status === "idle" ? null : (
            <Notice tone={state.status === "error" ? "error" : "success"}>{state.message}</Notice>
          )}
          <SubmitButton
            disabled={state.status === "done"}
            pendingLabel="非公開にしています…"
            variant="danger"
          >
            非公開にする
          </SubmitButton>
        </Form>
      </CollapsiblePanel>
    </Collapsible>
  );
}
