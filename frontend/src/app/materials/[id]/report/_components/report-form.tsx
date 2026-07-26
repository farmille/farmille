"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useMemo, useState, useTransition } from "react";

import { css } from "../../../../../../styled-system/css";
import {
  saveUsageReportDraftAction,
  submitUsageReportAction,
} from "@/app/materials/[id]/report/new/actions";
import { Button } from "@/components/button";
import { LeafIcon, OfficialCheckIcon } from "@/components/icons";
import { Textarea } from "@/components/textarea";
import type {
  CropOption,
  SubmittedUsageReport,
  UsageReportDraft,
} from "@/server/queries/usage-report-form";
import {
  type CropReportInput,
  type UsageReportActionResult,
  type UsageReportFieldErrors,
  type UsageReportFormPayload,
} from "@/server/usage-reports/model";
import type { Database } from "@/types/database.types";

import { CropPicker } from "./crop-picker";
import { CropReportFields } from "./crop-report-fields";
import { ConsentCheck, FieldError, FieldLabel, SectionHeading, formStyles } from "./form-ui";
import { MediaFields, type ReportMediaDraft } from "./media-fields";
import {
  activateCropTab,
  addCropTab,
  createCropTabState,
  removeCropTab,
  updateCropTabReport,
} from "./report-form-state";
import { ReportSubmitted } from "./report-submitted";

const targetCard = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  p: "3",
  boxShadow: "shadow",
});

const targetImage = css({
  w: "11",
  h: "11",
  flexShrink: "0",
  display: "grid",
  placeItems: "center",
  borderRadius: "button",
  bg: "green.soft2",
  color: "brand.primary",
  overflow: "hidden",
});

const targetImageContent = css({ w: "100%", h: "100%", objectFit: "cover" });
const targetCopy = css({ flex: "1", minW: "0" });
const targetName = css({ fontSize: "md", fontWeight: "700" });
const manufacturer = css({
  mt: "0.5",
  display: "flex",
  alignItems: "center",
  gap: "1",
  fontSize: "sm",
  color: "text.muted",
});

const autoBadge = css({
  flexShrink: "0",
  borderRadius: "pill",
  bg: "surface.page",
  color: "text.subtle",
  px: "2.5",
  py: "1",
  fontSize: "xs",
  fontWeight: "700",
});

const formActions = css({
  mt: "6",
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
});

const actionMessage = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  bg: "brand.soft",
  color: "brand.primaryDeep",
  p: "3",
  fontSize: "sm",
  fontWeight: "600",
  textAlign: "center",
});

const globalError = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "accent.danger",
  borderRadius: "button",
  bg: "danger.soft",
  color: "accent.danger",
  p: "3",
  fontSize: "sm",
  fontWeight: "600",
  lineHeight: "1.55",
});

function requirePublicEnv(name: string, value: string | undefined): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`必須の環境変数 ${name} が設定されていません。`);
  }
  return value;
}

function reportStorageClient() {
  return createBrowserClient<Database>(
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

function extensionFor(file: File): string {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    default:
      throw new Error("対応していないファイル形式です。");
  }
}

function initialCropReports(draft: UsageReportDraft | null): CropReportInput[] {
  return draft?.cropReports ?? [];
}

function firstCropWithError(cropIds: string[], fieldErrors: UsageReportFieldErrors): string | null {
  return (
    cropIds.find((cropId) =>
      Object.keys(fieldErrors).some((key) => key.startsWith(`${cropId}.`)),
    ) ?? null
  );
}

export function ReportForm({
  material,
  userId,
  crops,
  draft,
  initialMonth,
}: {
  material: {
    id: string;
    name: string;
    manufacturerName: string;
    isOfficial: boolean;
    imageUrl: string | null;
  };
  userId: string;
  crops: CropOption[];
  draft: UsageReportDraft | null;
  initialMonth: string;
}) {
  const initialReports = initialCropReports(draft);
  const [cropTabs, setCropTabs] = useState(() => createCropTabState(initialReports));
  const [media, setMedia] = useState<ReportMediaDraft[]>(
    (draft?.media ?? []).map((item) => ({ ...item, file: null })),
  );
  const [summary, setSummary] = useState(draft?.summary ?? "");
  const [pesticideAck, setPesticideAck] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<UsageReportFieldErrors>({});
  const [message, setMessage] = useState<string>();
  const [globalErrorMessage, setGlobalErrorMessage] = useState<string>();
  const [submitted, setSubmitted] = useState<SubmittedUsageReport[] | null>(null);
  const [pending, startTransition] = useTransition();

  const cropById = useMemo(() => new Map(crops.map((crop) => [crop.id, crop])), [crops]);
  const { selectedCropIds, activeCropId, cropReports } = cropTabs;
  const activeCrop = activeCropId === null ? undefined : cropById.get(activeCropId);
  const activeInput = activeCropId === null ? undefined : cropReports[activeCropId];

  function addCrop(cropId: string): void {
    setCropTabs((current) => addCropTab(current, cropId));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.crops;
      return next;
    });
  }

  function removeCrop(cropId: string): void {
    setCropTabs((current) => removeCropTab(current, cropId));
  }

  function updateActiveCrop(input: CropReportInput): void {
    setCropTabs((current) => updateCropTabReport(current, input));
  }

  async function uploadMedia(items: ReportMediaDraft[]): Promise<ReportMediaDraft[]> {
    if (items.every(({ file }) => file === null)) return items;
    const supabase = reportStorageClient();
    const uploaded = [...items];

    for (const [index, item] of items.entries()) {
      if (item.file === null) {
        continue;
      }

      const path = `${userId}/${crypto.randomUUID()}.${extensionFor(item.file)}`;
      const { error } = await supabase.storage.from("report-media").upload(path, item.file, {
        contentType: item.file.type,
        upsert: false,
      });
      if (error !== null) {
        throw new Error("写真・動画を保存できませんでした。時間をおいて再度お試しください。");
      }
      const { data } = supabase.storage.from("report-media").getPublicUrl(path);
      uploaded[index] = { ...item, file: null, url: data.publicUrl };
      // 後続ファイルが失敗しても、アップロード済みのURLは再利用できるよう即時反映する。
      setMedia([...uploaded]);
    }

    return uploaded;
  }

  function payloadFor(uploadedMedia: ReportMediaDraft[]): UsageReportFormPayload {
    return {
      cropReports: selectedCropIds.flatMap((cropId) => {
        const report = cropReports[cropId];
        return report === undefined ? [] : [report];
      }),
      media: uploadedMedia.map(({ file: _file, ...item }) => item),
      summary,
      pesticideAck,
    };
  }

  function showResult(result: UsageReportActionResult): void {
    if (!result.ok) {
      setMessage(undefined);
      setGlobalErrorMessage(result.message);
      setFieldErrors(result.fieldErrors);
      const errorCrop = firstCropWithError(selectedCropIds, result.fieldErrors);
      if (errorCrop !== null) {
        setCropTabs((current) => activateCropTab(current, errorCrop));
      }
      requestAnimationFrame(() => {
        document.querySelector('[role="alert"]')?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return;
    }

    setFieldErrors({});
    setGlobalErrorMessage(undefined);
    setMessage(result.message);
    if (result.status === "pending") {
      setSubmitted(
        result.reportIds.map((id, index) => ({
          id,
          cropName: cropById.get(selectedCropIds[index] ?? "")?.name ?? "選択した作物",
          status: "pending",
          updatedAt: new Date().toISOString(),
        })),
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function runMutation(mode: "draft" | "submit"): void {
    setMessage(undefined);
    setGlobalErrorMessage(undefined);
    startTransition(async () => {
      try {
        const uploadedMedia = await uploadMedia(media);
        setMedia(uploadedMedia);
        const payload = payloadFor(uploadedMedia);
        const result =
          mode === "draft"
            ? await saveUsageReportDraftAction(material.id, payload)
            : await submitUsageReportAction(material.id, payload);
        showResult(result);
      } catch (caught) {
        setGlobalErrorMessage(
          caught instanceof Error
            ? caught.message
            : "保存中に問題が発生しました。時間をおいて再度お試しください。",
        );
      }
    });
  }

  if (submitted !== null) {
    return <ReportSubmitted materialId={material.id} reports={submitted} justSubmitted />;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        runMutation("submit");
      }}
    >
      <div className={formStyles.firstField}>
        <FieldLabel>対象資材</FieldLabel>
        <div className={targetCard}>
          <div className={targetImage}>
            {material.imageUrl ? (
              <img className={targetImageContent} src={material.imageUrl} alt="" />
            ) : (
              <LeafIcon size={28} />
            )}
          </div>
          <div className={targetCopy}>
            <div className={targetName}>{material.name}</div>
            <div className={manufacturer}>
              {material.manufacturerName}
              {material.isOfficial ? <OfficialCheckIcon /> : null}
            </div>
          </div>
          <span className={autoBadge}>自動</span>
        </div>
      </div>

      <CropPicker
        crops={crops}
        selectedCropIds={selectedCropIds}
        activeCropId={activeCropId}
        onAdd={addCrop}
        onRemove={removeCrop}
        onActivate={(cropId) => setCropTabs((current) => activateCropTab(current, cropId))}
        error={fieldErrors.crops}
      />

      {activeCrop && activeInput ? (
        <CropReportFields
          key={activeCrop.id}
          input={activeInput}
          crop={activeCrop}
          initialMonth={initialMonth}
          tabbed={selectedCropIds.length >= 2}
          errors={fieldErrors}
          onChange={updateActiveCrop}
        />
      ) : null}

      <MediaFields media={media} onChange={setMedia} error={fieldErrors.media} />

      <SectionHeading number="4" title="まとめ・感想" />
      <div className={formStyles.field}>
        <FieldLabel required htmlFor="report-summary">
          全体をまとめてひとこと
        </FieldLabel>
        <Textarea
          id="report-summary"
          size="lg"
          value={summary}
          placeholder="例：暑い時期の萎れや樹勢低下を抑える補助として、一定の可能性を感じました。"
          onChange={(event) => setSummary(event.target.value)}
        />
        <FieldError message={fieldErrors.summary} />
      </div>

      <ConsentCheck
        checked={pesticideAck}
        onChange={setPesticideAck}
        error={fieldErrors.pesticideAck}
      />

      <div className={formActions}>
        {globalErrorMessage ? (
          <p className={globalError} role="alert">
            {globalErrorMessage}
          </p>
        ) : null}
        {message ? (
          <p className={actionMessage} role="status">
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "保存しています…" : "レポートを投稿する"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => runMutation("draft")}
        >
          下書き保存
        </Button>
      </div>
    </form>
  );
}
