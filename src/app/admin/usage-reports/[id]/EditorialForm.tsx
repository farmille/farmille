"use client";

import { useActionState } from "react";

import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { updateUsageReportEditorialAction } from "@/app/admin/usage-reports/[id]/actions";
import { Button } from "@/components";
import { Field, Form, FormActions, Input, Notice, Textarea } from "@/components/form";
import type { UsageReportEditorialDetail } from "@/server/admin/usage-reports";

export function UsageReportEditorialForm({ report }: { report: UsageReportEditorialDetail }) {
  const [state, formAction, pending] = useActionState(
    updateUsageReportEditorialAction,
    initialAdminActionState,
  );
  const editable = report.status === "pending";

  return (
    <Form action={formAction}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}

      <Field label="タイトル" labelSize="sm" name="title" requirement="required">
        <Input defaultValue={report.title} disabled={!editable} />
      </Field>
      <Field
        label={report.formVersion === 2 ? "結果・感想" : "観察した変化"}
        labelSize="sm"
        name="observedChange"
        requirement="required"
      >
        <Textarea defaultValue={report.observedChange} disabled={!editable} size="lg" />
      </Field>
      {report.formVersion === 2 ? (
        <>
          <input name="negativeNote" type="hidden" value="" />
          <input name="summary" type="hidden" value={report.summary} />
        </>
      ) : (
        <>
          <Field label="悪影響・気になった点" labelSize="sm" name="negativeNote">
            <Textarea defaultValue={report.negativeNote ?? ""} disabled={!editable} />
          </Field>
          <Field label="まとめ" labelSize="sm" name="summary" requirement="required">
            <Textarea defaultValue={report.summary} disabled={!editable} size="lg" />
          </Field>
        </>
      )}
      <Field
        description={
          editable
            ? "差し戻す場合は、投稿者が対応できる理由を編集局メモへ必ず入力する。"
            : undefined
        }
        label="編集局メモ（内部）"
        labelSize="sm"
        name="editorNote"
      >
        <Textarea defaultValue={report.editorNote ?? ""} disabled={!editable} />
      </Field>

      <input name="reportId" type="hidden" value={report.id} />
      <FormActions layout="row">
        {editable ? (
          <>
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
          </>
        ) : (
          <Notice tone="neutral">処理済みのため編集できません。</Notice>
        )}
      </FormActions>
    </Form>
  );
}
