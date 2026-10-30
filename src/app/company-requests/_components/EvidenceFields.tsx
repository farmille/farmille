"use client";
import { useReducer } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import * as v from "valibot";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import { evidenceMimeSchema, evidencePurposeSchema } from "@/lib/company-application";
import { Button } from "@/components/Button";
import { FileInput, Notice } from "@/components/form";
import { errorMessageJa } from "@/server/errors";

import { css } from "../../../../styled-system/css";
import { reserveEvidence, finalizeEvidence, removeEvidence } from "../actions";

const stackStyle = css({ display: "flex", flexDirection: "column", gap: "2" });

const fileListStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
  fontSize: "sm",
  "& li": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2.5",
    overflowWrap: "anywhere",
  },
});

type EvidenceFile = { id: string; name: string; verified: boolean };
export function EvidenceFields({
  intentId,
  itemKey,
  purpose,
  onBusy,
  onCount,
}: {
  intentId: string;
  itemKey: string | null;
  purpose: v.InferOutput<typeof evidencePurposeSchema>;
  onBusy: (busy: boolean) => void;
  onCount?: (count: number) => void;
}) {
  const initialFiles: EvidenceFile[] = [];
  const form = useForm({ defaultValues: { files: initialFiles } });
  const files = useStore(form.store, (state) => state.values.files);
  const [busy, setBusy] = useReducer((_state: boolean, next: boolean) => next, false);
  const [error, setError] = useReducer((_state: string, next: string) => next, "");
  function update(next: EvidenceFile[]) {
    form.setFieldValue("files", next);
    onCount?.(next.length);
  }
  async function upload(selected: FileList | null) {
    if (!selected?.length) return;
    setError("");
    if (files.length + selected.length > 5) {
      setError("この添付欄に登録できる資料は5件までです。");
      return;
    }
    setBusy(true);
    onBusy(true);
    let current = files;
    try {
      for (const file of Array.from(selected)) {
        const mime = v.safeParse(evidenceMimeSchema, file.type);
        if (!mime.success || file.size < 1 || file.size > 10 * 1024 * 1024)
          throw new Error("JPG・PNG・PDFを、1ファイル10MB以内で選択してください。");
        const reserved = await reserveEvidence({
          intentId,
          itemKey,
          purpose,
          fileName: file.name,
          mime: mime.output,
          size: file.size,
        });
        if (!reserved.ok) throw new Error(errorMessageJa[reserved.error]);
        current = [...current, { id: reserved.data.id, name: file.name, verified: false }];
        update(current);
        const result = await createAuthBrowserClient()
          .storage.from("company-application-evidence")
          .uploadToSignedUrl(reserved.data.path, reserved.data.token, file, {
            contentType: mime.output,
          });
        if (result.error)
          throw new Error(
            "資料をアップロードできませんでした。失敗した資料を削除し、もう一度選択してください。",
          );
        const verified = await finalizeEvidence(reserved.data.id);
        if (!verified.ok)
          throw new Error(
            "資料の形式を確認できませんでした。失敗した資料を削除し、JPG・PNG・PDFの元ファイルを選択してください。",
          );
        current = current.map((item) =>
          item.id === reserved.data.id ? { ...item, verified: true } : item,
        );
        update(current);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "資料の登録に失敗しました。");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const result = await removeEvidence(id);
      if (!result.ok) {
        setError(errorMessageJa[result.error]);
        return;
      }
      update(files.filter((file) => file.id !== id));
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className={stackStyle}>
      <FileInput
        accept="image/jpeg,image/png,application/pdf"
        disabled={busy || files.length >= 5}
        label={null}
        multiple
        onChange={(event) => {
          void upload(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <Notice tone="neutral">jpg / png / pdf、1ファイル10MBまで、最大5ファイル</Notice>
      {files.length > 0 ? (
        <ul className={fileListStyle}>
          {files.map((file) => (
            <li key={file.id}>
              <span>
                {file.name}（{file.verified ? "登録済み" : "未完了"}）
              </span>
              <Button
                aria-label={`${file.name}を削除`}
                disabled={busy}
                onClick={() => void remove(file.id)}
                size="sm"
                variant="danger"
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {busy ? <Notice tone="info">資料を処理しています…</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
