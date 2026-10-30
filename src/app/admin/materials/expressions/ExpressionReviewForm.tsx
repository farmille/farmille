"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useReducer, useTransition } from "react";
import * as v from "valibot";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Notice, Textarea, usePersistedInput } from "@/components/form";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { reviewMaterialPageAction, reviewManufacturerProfileAction } from "./actions";

export function ExpressionReviewForm({
  versionId,
  kind = "material",
}: {
  versionId: string;
  kind?: "material" | "profile";
}) {
  const form = useForm({ defaultValues: { note: "" } });
  const note = useStore(form.store, (state) => state.values.note);
  const [recordedNote, setRecordedNote] = useReducer((_state: string, next: string) => next, "");
  const [result, setResult] = useReducer(
    (
      _state: { ok: boolean; message: string } | null,
      next: { ok: boolean; message: string } | null,
    ) => next,
    null,
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  usePersistedInput({
    name: "expression-review",
    schema: v.string(),
    unsaved: note === recordedNote ? null : note,
    restore: (value) => form.setFieldValue("note", value),
  });
  function submit(publish: boolean) {
    startTransition(async () => {
      const next = await (
        kind === "material" ? reviewMaterialPageAction : reviewManufacturerProfileAction
      )({ versionId, publish, note });
      setResult(next);
      if (next.ok) {
        setRecordedNote(note);
        router.refresh();
      }
    });
  }
  return (
    <div className={materialPageStack}>
      <Textarea
        description="メーカーにも表示されます。修正を求める場合は、該当箇所と理由を記入してください。"
        label="確認メモ・修正が必要な箇所"
        onChange={(event) => form.setFieldValue("note", event.target.value)}
        rows={4}
        value={note}
      />
      {result === null ? null : (
        <Notice tone={result.ok ? "success" : "error"}>{result.message}</Notice>
      )}
      <Button disabled={pending} onClick={() => submit(true)}>
        表現確認を完了して反映
      </Button>
      <Button variant="ghost" disabled={pending} onClick={() => submit(false)}>
        修正を依頼
      </Button>
    </div>
  );
}
