"use client";
import { useState } from "react";
import * as v from "valibot";
import { Button, Input } from "@/components";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import { evidenceMimeSchema, evidencePurposeSchema } from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";
import { reserveEvidence, finalizeEvidence, removeEvidence } from "../actions";
import { applicationField, applicationStack } from "./ContactFields";

type EvidenceFile = { id: string; name: string; verified: boolean };
export function EvidenceFields({
  intentId,
  itemKey,
  purpose,
  label,
  onBusy,
  onCount,
}: {
  intentId: string;
  itemKey: string | null;
  purpose: v.InferOutput<typeof evidencePurposeSchema>;
  label: string;
  onBusy: (busy: boolean) => void;
  onCount?: (count: number) => void;
}) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function update(next: EvidenceFile[]) {
    setFiles(next);
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
    <div className={applicationStack}>
      <label className={applicationField}>
        {label}
        <Input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          multiple
          disabled={busy || files.length >= 5}
          onChange={(event) => {
            void upload(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <span>JPG・PNG・PDF、1ファイル10MB以内、各欄5件まで</span>
      </label>
      {files.map((file) => (
        <div key={file.id}>
          <span>
            {file.name}（{file.verified ? "登録済み" : "未完了"}）
          </span>{" "}
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void remove(file.id)}
          >
            削除
          </Button>
        </div>
      ))}
      {busy && <p role="status">資料を処理しています…</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
