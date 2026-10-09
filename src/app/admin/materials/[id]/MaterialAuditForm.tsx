"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Field, Notice, Select, Textarea, type Option } from "@/components/form";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { recordMaterialAuditAction } from "./audit-actions";

type AuditOutcome = "checked" | "correction_requested" | "hidden";

const AUDIT_OUTCOMES: readonly Option<AuditOutcome>[] = [
  { value: "checked", label: "確認済み" },
  { value: "correction_requested", label: "修正を依頼" },
  { value: "hidden", label: "非公開にする" },
];

export function MaterialAuditForm({ materialId }: { materialId: string }) {
  const [outcome, setOutcome] = useState<AuditOutcome>("checked");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className={materialPageStack}>
      <Field label="掲載後の確認結果">
        <Select
          onValueChange={(value) => {
            if (value !== null) setOutcome(value);
          }}
          options={AUDIT_OUTCOMES}
          value={outcome}
        />
      </Field>
      <Field
        description="メーカーにも表示されます。修正依頼の場合は該当箇所を記入し、案内メールでも連絡してください。"
        label="確認した内容と理由"
      >
        <Textarea onChange={(event) => setNote(event.target.value)} rows={4} value={note} />
      </Field>
      {outcome === "hidden" ? (
        <p>保存すると資材ページを非公開にします。原稿と投稿履歴は保持します。</p>
      ) : null}
      {result === null ? null : (
        <Notice tone={result.ok ? "success" : "error"}>{result.message}</Notice>
      )}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const next = await recordMaterialAuditAction({ materialId, outcome, note });
            setResult(next);
            if (next.ok) router.refresh();
          })
        }
      >
        {outcome === "hidden" ? "記録を保存して非公開にする" : "確認記録を保存"}
      </Button>
    </div>
  );
}
