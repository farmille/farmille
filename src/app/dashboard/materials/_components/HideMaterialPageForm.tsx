"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { Notice, Textarea } from "@/components/form";
import { css } from "../../../../../styled-system/css";
import { hideMaterialPage } from "../editor-actions";

const descriptionStyle = css({ textStyle: "supporting", color: "text.muted" });

export function HideMaterialPageForm({ materialId }: { materialId: string }) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div>
      <p className={descriptionStyle}>
        この資材ページを非公開にします。原稿と投稿履歴は残します。再公開は運営へご連絡ください。
      </p>
      <Textarea
        label="非公開にする理由"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      {message ? <Notice tone="error">{message}</Notice> : null}
      <Button
        variant="danger"
        disabled={pending || note.trim().length === 0}
        onClick={() =>
          startTransition(async () => {
            if (await hideMaterialPage({ materialId, note })) router.refresh();
            else setMessage("非公開にできませんでした。編集権と通信状態を確認してください。");
          })
        }
      >
        理由を記録して非公開にする
      </Button>
    </div>
  );
}
