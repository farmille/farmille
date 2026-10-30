"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { updateUsageReportEditorialAction } from "@/app/admin/usage-reports/[id]/actions";
import { Button } from "@/components";
import { Form, FormActions, Input, Notice, Textarea } from "@/components/form";
import type { UsageReportEditorialDetail } from "@/server/admin/usage-reports";

export function UsageReportEditorialForm({ report }: { report: UsageReportEditorialDetail }) {
  const form = useForm({
    defaultValues: {
      title: report.title,
      observedChange: report.observedChange,
      negativeNote: report.negativeNote ?? "",
      summary: report.summary,
      editorNote: report.editorNote ?? "",
    },
  });
  const values = useStore(form.store, (state) => state.values);
  const [state, formAction, pending] = useActionState(
    updateUsageReportEditorialAction,
    initialAdminActionState,
  );
  const editable = report.status === "pending";

  return (
    <Form
      action={formAction}
      persist="editorial"
      onRestore={(restored) => {
        for (const name of [
          "title",
          "observedChange",
          "negativeNote",
          "summary",
          "editorNote",
        ] as const) {
          const value = restored.get(name)?.[0];
          if (value !== undefined) form.setFieldValue(name, value);
        }
      }}
    >
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}

      <Input
        label="タイトル"
        labelSize="sm"
        name="title"
        requirement="required"
        value={values.title}
        onChange={(event) => form.setFieldValue("title", event.target.value)}
        disabled={!editable}
      />
      <Textarea
        label={report.formVersion === 2 ? "結果・感想" : "観察した変化"}
        labelSize="sm"
        name="observedChange"
        requirement="required"
        value={values.observedChange}
        onChange={(event) => form.setFieldValue("observedChange", event.target.value)}
        disabled={!editable}
        size="lg"
      />
      {report.formVersion === 2 ? (
        <>
          <input name="negativeNote" type="hidden" value="" />
          <input name="summary" type="hidden" value={report.summary} />
        </>
      ) : (
        <>
          <Textarea
            label="悪影響・気になった点"
            labelSize="sm"
            name="negativeNote"
            value={values.negativeNote}
            onChange={(event) => form.setFieldValue("negativeNote", event.target.value)}
            disabled={!editable}
          />
          <Textarea
            label="まとめ"
            labelSize="sm"
            name="summary"
            requirement="required"
            value={values.summary}
            onChange={(event) => form.setFieldValue("summary", event.target.value)}
            disabled={!editable}
            size="lg"
          />
        </>
      )}
      <Textarea
        description={
          editable
            ? "差し戻す場合は、投稿者が対応できる理由を編集局メモへ必ず入力する。"
            : undefined
        }
        label="編集局メモ（内部）"
        labelSize="sm"
        name="editorNote"
        value={values.editorNote}
        onChange={(event) => form.setFieldValue("editorNote", event.target.value)}
        disabled={!editable}
      />

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
