"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Notice, Textarea } from "@/components/form";
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
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function submit(publish: boolean) {
    startTransition(async () => {
      const next = await (
        kind === "material" ? reviewMaterialPageAction : reviewManufacturerProfileAction
      )({ versionId, publish, note });
      setResult(next);
      if (next.ok) router.refresh();
    });
  }
  return (
    <div className={materialPageStack}>
      <Textarea
        description="メーカーにも表示されます。修正を求める場合は、該当箇所と理由を記入してください。"
        label="確認メモ・修正が必要な箇所"
        onChange={(event) => setNote(event.target.value)}
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
