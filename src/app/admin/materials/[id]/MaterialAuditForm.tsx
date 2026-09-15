"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Field, FormMessage, controlStyle } from "@/components/auth/Fields";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { recordMaterialAuditAction } from "./audit-actions";

export function MaterialAuditForm({ materialId }: { materialId: string }) {
  const [outcome, setOutcome] = useState("checked");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className={materialPageStack}>
      <Field label="掲載後の確認結果" htmlFor="audit-outcome">
        <select
          id="audit-outcome"
          className={controlStyle}
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
        >
          <option value="checked">確認済み</option>
          <option value="correction_requested">修正を依頼</option>
          <option value="hidden">非公開にする</option>
        </select>
      </Field>
      <Field
        label="確認した内容と理由"
        htmlFor="audit-note"
        guide="メーカーにも表示されます。修正依頼の場合は該当箇所を記入し、案内メールでも連絡してください。"
      >
        <textarea
          id="audit-note"
          className={controlStyle}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
        />
      </Field>
      {outcome === "hidden" ? (
        <p>保存すると資材ページを非公開にします。原稿と投稿履歴は保持します。</p>
      ) : null}
      {message ? <FormMessage tone="info">{message}</FormMessage> : null}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await recordMaterialAuditAction({ materialId, outcome, note });
            setMessage(result.message);
            if (result.ok) router.refresh();
          })
        }
      >
        {outcome === "hidden" ? "記録を保存して非公開にする" : "確認記録を保存"}
      </Button>
    </div>
  );
}
