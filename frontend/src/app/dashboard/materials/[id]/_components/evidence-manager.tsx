"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";

import { Button, DataList, FormMessage, Input, Select, SurfaceCard, TextLink } from "@/components";
import { Field } from "@/components/auth/fields";
import { clientEnv } from "@/env";
import { errorMessageJa } from "@/server/errors";
import type { SellerMaterialEvidence } from "@/server/queries/seller-dashboard";
import type { Database } from "@/types/database.types";
import { css } from "../../../../../../styled-system/css";
import { addEvidenceAction, deleteEvidenceAction } from "../actions";
import { initialSellerFormState, sellerFieldErrors, type SellerFormState } from "./form-state";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const fileExtensionByType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const evidenceTypeLabel: Record<string, string> = {
  sds: "SDS",
  paper: "論文",
  trial: "試験結果",
  leaflet: "チラシ",
};

const formLayout = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

const listLayout = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
  mt: "5",
});

const deleteRow = css({
  display: "flex",
  justifyContent: "flex-end",
  mt: "3",
});

function evidenceHref(evidence: SellerMaterialEvidence): string {
  const value = evidence.file_url ?? evidence.external_url;
  if (value === null) {
    throw new Error(`エビデンス ${evidence.id} の参照先がありません。`);
  }

  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`エビデンス ${evidence.id} のURL形式が不正です。`);
  }

  return url.toString();
}

function invalidState(fieldErrors: Record<string, string>): SellerFormState {
  return {
    status: "error",
    message: errorMessageJa.invalid_body,
    fieldErrors,
  };
}

type EvidenceManagerProps = {
  sellerId: string;
  materialId: string;
  evidences: SellerMaterialEvidence[];
};

export function EvidenceManager({ sellerId, materialId, evidences }: EvidenceManagerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<SellerFormState>(initialSellerFormState);
  const [pending, startTransition] = useTransition();
  const fieldErrors = sellerFieldErrors(state);

  function handleAdd(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get("title");
    const externalUrl = formData.get("externalUrl");
    const file = formData.get("file");
    const hasFile = file instanceof File && file.size > 0;
    const hasExternalUrl = typeof externalUrl === "string" && externalUrl.trim().length > 0;
    const validationErrors: Record<string, string> = {};

    if (typeof title !== "string" || title.trim().length === 0) {
      validationErrors.title = "タイトルを入力してください。";
    }
    if (hasFile === hasExternalUrl) {
      validationErrors.source = "ファイルまたは外部URLのどちらか一方を指定してください。";
    }
    if (hasFile) {
      if (!(file.type in fileExtensionByType)) {
        validationErrors.file = "JPEG、PNG、WebPのいずれかを選択してください。";
      } else if (file.size > MAX_FILE_BYTES) {
        validationErrors.file = "ファイルは5MB以下にしてください。";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setState(invalidState(validationErrors));
      return;
    }

    startTransition(async () => {
      const supabase = createBrowserClient<Database>(
        clientEnv.supabaseUrl,
        clientEnv.supabaseAnonKey,
      );
      let storagePath: string | null = null;

      if (hasFile) {
        const extension = fileExtensionByType[file.type as keyof typeof fileExtensionByType];
        storagePath = `${sellerId}/${materialId}/evidences/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("material-images").upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

        if (error !== null) {
          console.error("[dashboard/evidence] ファイルのアップロードに失敗", error);
          setState({ status: "error", message: errorMessageJa.internal });
          return;
        }
      }

      formData.delete("file");
      formData.set("storagePath", storagePath ?? "");
      if (storagePath !== null) {
        formData.set("externalUrl", "");
      }

      const result = await addEvidenceAction(materialId, formData);

      if (result.status === "error" && storagePath !== null) {
        const { error: cleanupError } = await supabase.storage
          .from("material-images")
          .remove([storagePath]);
        if (cleanupError !== null) {
          console.error("[dashboard/evidence] 登録失敗後のファイル回収に失敗", cleanupError);
        }
      }

      setState(result);
      if (result.status === "success") {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  function handleDelete(evidenceId: string): void {
    startTransition(async () => {
      const result = await deleteEvidenceAction(materialId, evidenceId);
      setState(result);
      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <SurfaceCard description="SDS、試験結果、論文、チラシを追加できます。" title="エビデンス管理">
      <form className={formLayout} onSubmit={handleAdd} ref={formRef}>
        <Field
          error={fieldErrors.evidenceType}
          htmlFor="evidenceType"
          label="種類"
          requirement="required"
        >
          <Select defaultValue="sds" id="evidenceType" name="evidenceType">
            <option value="sds">SDS</option>
            <option value="trial">試験結果</option>
            <option value="paper">論文</option>
            <option value="leaflet">チラシ</option>
          </Select>
        </Field>
        <Field
          error={fieldErrors.title}
          htmlFor="evidenceTitle"
          label="タイトル"
          requirement="required"
        >
          <Input id="evidenceTitle" name="title" placeholder="例）2026年版 安全データシート" />
        </Field>
        <Field
          error={fieldErrors.file ?? fieldErrors.source}
          guide="Storageの制約に合わせ、JPEG、PNG、WebPを5MBまで登録できます。PDFは外部URLを利用してください。"
          htmlFor="evidenceFile"
          label="ファイル"
          requirement="optional"
        >
          <Input
            accept="image/jpeg,image/png,image/webp"
            id="evidenceFile"
            name="file"
            type="file"
          />
        </Field>
        <Field
          error={fieldErrors.externalUrl ?? fieldErrors.source}
          htmlFor="evidenceExternalUrl"
          label="外部URL"
          requirement="optional"
        >
          <Input
            id="evidenceExternalUrl"
            name="externalUrl"
            placeholder="https://example.com/evidence.pdf"
            type="url"
          />
        </Field>

        {state.status === "idle" ? null : (
          <FormMessage status={state.status}>{state.message}</FormMessage>
        )}
        <Button disabled={pending} type="submit">
          {pending ? "処理中…" : "エビデンスを追加"}
        </Button>
      </form>

      {evidences.length === 0 ? null : (
        <div className={listLayout}>
          {evidences.map((evidence) => (
            <SurfaceCard key={evidence.id} title={evidence.title} tone="soft">
              <DataList
                rows={[
                  {
                    label: "種類",
                    value: evidenceTypeLabel[evidence.evidence_type] ?? evidence.evidence_type,
                  },
                  {
                    label: "参照先",
                    value: (
                      <TextLink external href={evidenceHref(evidence)}>
                        ファイルを開く
                      </TextLink>
                    ),
                  },
                ]}
              />
              <div className={deleteRow}>
                <Button
                  disabled={pending}
                  onClick={() => handleDelete(evidence.id)}
                  size="sm"
                  type="button"
                  variant="danger"
                >
                  削除
                </Button>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}
