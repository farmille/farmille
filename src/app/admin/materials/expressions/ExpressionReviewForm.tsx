"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Field, FormMessage, controlStyle } from "@/components/auth/Fields";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { reviewMaterialPageAction, reviewManufacturerProfileAction } from "./actions";

export function ExpressionReviewForm({
  versionId,
  kind = "material",
}: {
  versionId: string;
  kind?: "material" | "profile";
}) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function submit(publish: boolean) {
    startTransition(async () => {
      const result = await (
        kind === "material" ? reviewMaterialPageAction : reviewManufacturerProfileAction
      )({ versionId, publish, note });
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }
  return (
    <div className={materialPageStack}>
      <Field
        htmlFor="review-note"
        label="確認メモ・修正が必要な箇所"
        guide="メーカーにも表示されます。修正を求める場合は、該当箇所と理由を記入してください。"
      >
        <textarea
          id="review-note"
          className={controlStyle}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
        />
      </Field>
      {message ? <FormMessage tone="info">{message}</FormMessage> : null}
      <Button disabled={pending} onClick={() => submit(true)}>
        表現確認を完了して反映
      </Button>
      <Button variant="ghost" disabled={pending} onClick={() => submit(false)}>
        修正を依頼
      </Button>
    </div>
  );
}
