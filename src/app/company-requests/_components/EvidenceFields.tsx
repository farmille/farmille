"use client";

import { startTransition, useActionState } from "react";
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

type EvidenceState = { files: EvidenceFile[]; error: string };

type EvidenceAction = { type: "upload"; files: File[] } | { type: "remove"; id: string };

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
  const [{ files, error }, send, busy] = useActionState(
    async (state: EvidenceState, action: EvidenceAction): Promise<EvidenceState> => {
      let files = state.files;

      if (action.type === "upload" && files.length + action.files.length > 5) {
        return { files, error: "この添付欄に登録できる資料は5件までです。" };
      }

      onBusy(true);

      try {
        if (action.type === "remove") {
          const result = await removeEvidence(action.id);

          if (!result.ok) return { files, error: errorMessageJa[result.error] };
          files = files.filter((file) => file.id !== action.id);
          onCount?.(files.length);

          return { files, error: "" };
        }

        for (const file of action.files) {
          const mime = v.safeParse(evidenceMimeSchema, file.type);

          if (!mime.success || file.size < 1 || file.size > 10 * 1024 * 1024) {
            return { files, error: "JPG・PNG・PDFを、1ファイル10MB以内で選択してください。" };
          }

          const reserved = await reserveEvidence({
            intentId,
            itemKey,
            purpose,
            fileName: file.name,
            mime: mime.output,
            size: file.size,
          });

          if (!reserved.ok) return { files, error: errorMessageJa[reserved.error] };
          files = [...files, { id: reserved.data.id, name: file.name, verified: false }];
          onCount?.(files.length);

          const result = await createAuthBrowserClient()
            .storage.from("company-application-evidence")
            .uploadToSignedUrl(reserved.data.path, reserved.data.token, file, {
              contentType: mime.output,
            });

          if (result.error) {
            return {
              files,
              error:
                "資料をアップロードできませんでした。失敗した資料を削除し、もう一度選択してください。",
            };
          }

          const verified = await finalizeEvidence(reserved.data.id);

          if (!verified.ok) {
            return {
              files,
              error:
                "資料の形式を確認できませんでした。失敗した資料を削除し、JPG・PNG・PDFの元ファイルを選択してください。",
            };
          }

          files = files.map((item) =>
            item.id === reserved.data.id ? { ...item, verified: true } : item,
          );
        }

        return { files, error: "" };
      } catch (error) {
        return {
          files,
          error: error instanceof Error ? error.message : "資料の登録に失敗しました。",
        };
      } finally {
        onBusy(false);
      }
    },
    { files: [], error: "" },
  );

  return (
    <div className={stackStyle}>
      <FileInput
        accept="image/jpeg,image/png,application/pdf"
        disabled={busy || files.length >= 5}
        label={null}
        multiple
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";

          if (files.length > 0) startTransition(() => send({ type: "upload", files }));
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
                onClick={() => startTransition(() => send({ type: "remove", id: file.id }))}
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
      {!busy && error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
