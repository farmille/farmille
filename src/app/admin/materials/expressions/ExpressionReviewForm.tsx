"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { startTransition, useActionState } from "react";
import * as v from "valibot";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Notice, Textarea, PersistedInput } from "@/components/form";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { reviewMaterialPageAction, reviewManufacturerProfileAction } from "./actions";

type ReviewState = {
  result: Awaited<ReturnType<typeof reviewMaterialPageAction>> | null;
  recordedNote: string;
};

export function ExpressionReviewForm({
  versionId,
  kind = "material",
}: {
  versionId: string;
  kind?: "material" | "profile";
}) {
  const form = useForm({ defaultValues: { note: "" } });
  const note = useStore(form.store, (state) => state.values.note);
  const router = useRouter();
  const [{ result, recordedNote }, review, pending] = useActionState(
    async (
      previous: ReviewState,
      input: { publish: boolean; note: string },
    ): Promise<ReviewState> => {
      const result = await (
        kind === "material" ? reviewMaterialPageAction : reviewManufacturerProfileAction
      )({ versionId, ...input });
      if (result.ok) router.refresh();
      return { result, recordedNote: result.ok ? input.note : previous.recordedNote };
    },
    { result: null, recordedNote: "" },
  );
  const persistedInput = (
    <PersistedInput
      name="expression-review"
      schema={v.string()}
      unsaved={note === recordedNote ? null : note}
      restore={(value) => form.setFieldValue("note", value)}
    />
  );
  function submit(publish: boolean) {
    startTransition(() => review({ publish, note }));
  }
  return (
    <div className={materialPageStack}>
      {persistedInput}
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
