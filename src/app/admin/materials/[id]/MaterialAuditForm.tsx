"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { startTransition, useActionState } from "react";
import * as v from "valibot";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Notice, Select, Textarea, usePersistedInput, type Option } from "@/components/form";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { recordMaterialAuditAction } from "./audit-actions";

type AuditOutcome = "checked" | "correction_requested" | "hidden";

type MaterialAuditInput = { outcome: AuditOutcome; note: string };
type AuditState = {
  result: Awaited<ReturnType<typeof recordMaterialAuditAction>> | null;
  recordedNote: string;
};

const AUDIT_OUTCOMES: readonly Option<AuditOutcome>[] = [
  { value: "checked", label: "確認済み" },
  { value: "correction_requested", label: "修正を依頼" },
  { value: "hidden", label: "非公開にする" },
];

export function MaterialAuditForm({ materialId }: { materialId: string }) {
  const initialValues: MaterialAuditInput = { outcome: "checked", note: "" };
  const form = useForm({ defaultValues: initialValues });
  const { outcome, note } = useStore(form.store, (state) => state.values);
  const router = useRouter();
  const [{ result, recordedNote }, record, pending] = useActionState(
    async (previous: AuditState, input: MaterialAuditInput): Promise<AuditState> => {
      const result = await recordMaterialAuditAction({ materialId, ...input });
      if (result.ok) router.refresh();
      return { result, recordedNote: result.ok ? input.note : previous.recordedNote };
    },
    { result: null, recordedNote: "" },
  );
  usePersistedInput({
    name: "material-audit",
    schema: v.string(),
    unsaved: note === recordedNote ? null : note,
    restore: (value) => form.setFieldValue("note", value),
  });
  return (
    <div className={materialPageStack}>
      <Select
        label="掲載後の確認結果"
        onValueChange={(value) => {
          if (value !== null) form.setFieldValue("outcome", value);
        }}
        options={AUDIT_OUTCOMES}
        value={outcome}
      />
      <Textarea
        description="メーカーにも表示されます。修正依頼の場合は該当箇所を記入し、案内メールでも連絡してください。"
        label="確認した内容と理由"
        onChange={(event) => form.setFieldValue("note", event.target.value)}
        rows={4}
        value={note}
      />
      {outcome === "hidden" ? (
        <p>保存すると資材ページを非公開にします。原稿と投稿履歴は保持します。</p>
      ) : null}
      {result === null ? null : (
        <Notice tone={result.ok ? "success" : "error"}>{result.message}</Notice>
      )}
      <Button disabled={pending} onClick={() => startTransition(() => record({ outcome, note }))}>
        {outcome === "hidden" ? "記録を保存して非公開にする" : "確認記録を保存"}
      </Button>
    </div>
  );
}
