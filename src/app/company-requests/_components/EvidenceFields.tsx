"use client";
import { useState } from "react";
import * as v from "valibot";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import { evidenceMimeSchema, evidencePurposeSchema } from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";
import { reserveEvidence, finalizeEvidence, removeEvidence } from "../actions";

type EvidenceFile = { id: string; name: string; verified: boolean };
/** 見本 formScreen の添付欄（label.upload「ファイルを添付」）。送信の手順は本番のまま（予約 → 署名付きURLへ直接送信 → サーバーで形式を検査）。 */
export function EvidenceFields({
  intentId,
  itemKey,
  purpose,
  label,
  inputId,
  describedBy,
  onBusy,
  onCount,
}: {
  intentId: string;
  itemKey: string | null;
  purpose: v.InferOutput<typeof evidencePurposeSchema>;
  /** 読み上げ用の添付欄の名前。 */
  label: string;
  inputId: string;
  describedBy?: string;
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
    <div>
      <label className="upload" htmlFor={inputId}>
        <input
          accept="image/jpeg,image/png,application/pdf"
          aria-describedby={describedBy}
          aria-label={label}
          disabled={busy || files.length >= 5}
          id={inputId}
          multiple
          onChange={(event) => {
            void upload(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
          type="file"
        />
        ファイルを添付
        <br />
        <span style={{ fontSize: 11 }}>jpg / png / pdf、1ファイル10MBまで、最大5ファイル</span>
        {files.length > 0 ? <div className="uf">{files.length}件を添付</div> : null}
      </label>
      {files.length > 0 ? (
        <ul className="uf-list">
          {files.map((file) => (
            <li key={file.id}>
              <span>
                {file.name}
                <span className="uf-state">（{file.verified ? "登録済み" : "未完了"}）</span>
              </span>
              <button
                aria-label={`${file.name}を削除`}
                disabled={busy}
                onClick={() => void remove(file.id)}
                type="button"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {busy ? (
        <p className="fguide" role="status" style={{ marginTop: 6 }}>
          資料を処理しています…
        </p>
      ) : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
