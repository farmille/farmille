"use client";

import { useActionState } from "react";

import {
  adminActionsStyle,
  adminFormStyle,
  adminInlineNoteStyle,
} from "@/app/admin/_components/AdminUI";
import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { updateUsageReportEditorialAction } from "@/app/admin/usage-reports/[id]/actions";
import { Button, Input, Textarea } from "@/components";
import { FormMessage } from "@/components/auth/Fields";
import type { UsageReportEditorialDetail } from "@/server/admin/usage-reports";
import { css } from "../../../../../styled-system/css";

const labelStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
  color: "text.muted",
  fontSize: "sm",
  fontWeight: "700",
});

export function UsageReportEditorialForm({ report }: { report: UsageReportEditorialDetail }) {
  const [state, formAction, pending] = useActionState(
    updateUsageReportEditorialAction,
    initialAdminActionState,
  );
  const editable = report.status === "pending";

  return (
    <form action={formAction} className={adminFormStyle}>
      <input name="reportId" type="hidden" value={report.id} />
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}

      <label className={labelStyle}>
        タイトル
        <Input defaultValue={report.title} disabled={!editable} name="title" required />
      </label>
      <label className={labelStyle}>
        観察した変化
        <Textarea
          defaultValue={report.observedChange}
          disabled={!editable}
          name="observedChange"
          required
          size="lg"
        />
      </label>
      <label className={labelStyle}>
        悪影響・気になった点
        <Textarea
          defaultValue={report.negativeNote ?? ""}
          disabled={!editable}
          name="negativeNote"
        />
      </label>
      <label className={labelStyle}>
        まとめ
        <Textarea
          defaultValue={report.summary}
          disabled={!editable}
          name="summary"
          required
          size="lg"
        />
      </label>
      <label className={labelStyle}>
        編集局メモ（内部）
        <Textarea defaultValue={report.editorNote ?? ""} disabled={!editable} name="editorNote" />
      </label>

      {editable ? (
        <>
          <p className={adminInlineNoteStyle}>
            差し戻す場合は、投稿者が対応できる理由を編集局メモへ必ず入力する。
          </p>
          <div className={adminActionsStyle}>
            <Button disabled={pending} name="operation" size="sm" type="submit" value="save">
              編集内容を保存
            </Button>
            <Button disabled={pending} name="operation" size="sm" type="submit" value="publish">
              公開する
            </Button>
            <Button
              disabled={pending}
              name="operation"
              size="sm"
              type="submit"
              value="decline"
              variant="danger"
            >
              差し戻す
            </Button>
          </div>
        </>
      ) : (
        <p className={adminInlineNoteStyle}>処理済みのため編集できません。</p>
      )}
    </form>
  );
}
