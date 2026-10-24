"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  saveUsageReportDraftAction,
  submitUsageReportAction,
} from "@/app/materials/[id]/report/new/actions";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import {
  createBlankUsageReport,
  reportErrorStep,
  UsageReportInputSchema,
  validateUsageReportSubmission,
  type UsageReportFieldErrors,
  type UsageReportInput,
} from "@/lib/usage-report";
import type { RegisteredAddress } from "@/server/accounts/registered-address";
import type { CropOption } from "@/server/queries/usage-report-form";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Notice, usePersistedInput } from "@/components/form";
import { SuccessMark, completionStepRecipe } from "@/components/SuccessMark";
import { toast } from "@/components/Toaster";

import { css, cva, cx } from "../../../../../../styled-system/css";

import { ReportArticleEditor } from "./ReportArticleEditor";
import type { ReportSection } from "./ReportArticleParts";
import { ReportComparisonFields } from "./ReportComparisonFields";
import { pillButtonRecipe, reportFrame, ReportToaster, reportToasterId } from "./ReportFormParts";
import { ReportPublishedView } from "./ReportPublishedView";
import { ReportStepBasics, type ReportMaterialSummary } from "./ReportStepBasics";
import { ReportStepConditions } from "./ReportStepConditions";
import { ReportStepResult, type ReportEffectOption } from "./ReportStepResult";

const STEPS = ["資材・作物", "結果", "栽培条件", "比較・使用結果", "写真・記事の確認"];
const TOTAL = STEPS.length;

function missingLabels(errors: UsageReportFieldErrors) {
  const label = (key: string) => {
    if (key === "cropId") return "使用対象作目";
    if (key === "variety") return "品種";
    if (key === "prefectureCode") return "都道府県";
    if (key === "observedChange") return "結果・感想";
    if (key === "purposeTags") return "使用目的";
    if (key === "cultivationEnvironment") return "栽培環境";
    if (key === "timingStages" || key === "timingNote") return "施用時期（段階と処理日）";
    if (key.startsWith("plots")) return "区の設定（名前・調査した範囲・説明）";
    if (key === "methodDetailsAck") return "使用方法の明記の確認";
    if (key.startsWith("measurements")) return "グラフ（調査項目と数値）";
    if (key === "documentsAck") return "秘密保持の確認";
    return "公開前の確認";
  };
  return [...new Set(Object.keys(errors).map(label))];
}

function missingMessages(errors: UsageReportFieldErrors) {
  const message = (key: string) => {
    if (key === "cropId") return "使用対象作目を選んでください";
    if (key === "variety") return "品種を入力するか、「品種が不明」にチェックしてください";
    if (key === "observedChange") return "結果・感想を入力してください";
    if (key === "purposeTags") return "使用目的を選んでください";
    if (key === "prefectureCode") return "都道府県を選んでください";
    if (key === "cultivationEnvironment") return "栽培環境を入力してください";
    if (key === "timingStages") return "施用時期の段階を選んでください";
    if (key === "timingNote") return "処理日・定植日・生育状況を入力してください";
    if (key === "plots") return "比較する区を2つ以上作ってください";
    if (/^plots\.\d+\.name$/.test(key)) return "区の名前を入力してください";
    if (/^plots\.\d+\.scope$/.test(key)) return "区の調査した範囲を入力してください";
    if (/^plots\.\d+\.description$/.test(key)) return "区の説明を入力してください";
    if (key === "methodDetailsAck") return "使用方法の明記を確認してください";
    if (key.startsWith("measurements")) return "グラフの調査項目と数値を入力してください";
    if (key === "documentsAck") return "資料の秘密保持を確認してください";
    if (key === "guidelineAck") return "投稿ガイドラインに同意してください";
    return "入力内容を確認してください";
  };
  return [
    ...new Set(
      Object.keys(errors)
        .toSorted((a, b) => reportErrorStep(a) - reportErrorStep(b))
        .map((key) => `ステップ${reportErrorStep(key)}：${message(key)}`),
    ),
  ];
}

const shell = css({ maxW: "content.medium", mx: "auto", pb: "28" });

const head = css({
  position: "sticky",
  top: "0",
  zIndex: "formBar",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  bg: "surface.card",
});

const headTop = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1.5",
  pt: "2.5",
  px: "3",
  tab: { flexWrap: "nowrap", gap: "2.5", pt: "3", px: "4.5" },
});

const title = css({
  flex: "[1 1 100%]",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "md",
  fontWeight: "extrabold",
  tab: { flex: "1" },
});

const titleMaterial = css({
  display: "block",
  textStyle: "supporting",
  fontWeight: "medium",
  color: "text.subtle",
  tab: { display: "inline", ml: "2" },
});

const closeButton = css({
  display: "grid",
  placeItems: "center",
  w: "8",
  h: "8",
  border: "none",
  borderRadius: "pill",
  bg: "transparent",
  fontSize: "xl",
  color: "text.subtle",
  cursor: "pointer",
  _hover: { bg: "surface.panel", color: "text.default" },
});

const stepper = css({
  position: "relative",
  display: "flex",
  alignItems: "flex-start",
  px: "2",
  py: "2.5",
  tab: { px: "4.5", py: "3" },
});

const stepButton = css({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.5",
  flex: "1",
  minW: "0",
  border: "none",
  bg: "transparent",
  p: "0",
  cursor: "pointer",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "0.5",
    borderRadius: "mark",
  },
});

const stepNumber = cva({
  base: {
    position: "relative",
    zIndex: "local.1",
    flex: "none",
    display: "grid",
    placeItems: "center",
    w: "6.5",
    h: "6.5",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "pill",
    bg: "surface.card",
    fontSize: "sm",
    fontWeight: "extrabold",
    color: "text.subtle",
  },
  variants: {
    state: {
      todo: {},
      done: { bg: "primary.700", borderColor: "primary.700", color: "text.inverse" },
      current: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        outlineWidth: "4px",
        outlineStyle: "solid",
        outlineColor: "primary.100",
      },
    },
  },
});

const stepLabel = cva({
  base: {
    maxW: "16",
    fontSize: "xs",
    lineHeight: "tight",
    textAlign: "center",
    color: "text.subtle",
    tab: { maxW: "none", fontSize: "sm", whiteSpace: "nowrap" },
  },
  variants: {
    state: {
      todo: {},
      done: { color: "text.muted" },
      current: { color: "text.default", fontWeight: "extrabold" },
    },
  },
});

const stepLine = cva({
  base: {
    position: "absolute",
    top: "3",
    left: "[50%]",
    right: "[-50%]",
    h: "0.5",
    bg: "border.strong",
  },
  variants: { state: { todo: {}, done: { bg: "primary.700" }, current: {} } },
});

const errorNotice = css({ mt: "3", mx: "4.5" });

const errorList = css({ mt: "1", pl: "4" });

const fields = css({ minW: "0", m: "0", border: "none", p: "0" });

const pane = css({ pt: "5.5", px: "4.5" });

const donePane = css({ pt: "10", px: "4.5", textAlign: "center" });

const doneMark = css({ mb: "4.5" });

const doneTitle = css({ m: "0", fontSize: "xl", textWrap: "balance" });

const doneText = css({ mt: "1", mb: "4", textStyle: "supporting", color: "text.subtle" });

const foot = css({
  position: "fixed",
  right: "0",
  bottom: "0",
  left: "0",
  zIndex: "formBar",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  bg: "surface.card",
});

const footInner = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  maxW: "content.medium",
  mx: "auto",
  px: "4.5",
  py: "2.5",
});

const stepCount = css({
  display: "none",
  textStyle: "supporting",
  color: "text.subtle",
  tab: { display: "inline" },
});

const stepCountNumber = css({ color: "text.default", fontVariantNumeric: "tabular-nums" });

const spacer = css({ flex: "1" });

const footButton = pillButtonRecipe({ tone: "quiet", size: "md", strong: true });

type StepState = "todo" | "done" | "current";

type Failure = { text: string; items?: string[] } | null;

export function ReportForm({
  material,
  userId,
  crops,
  effects,
  materialEffectNames,
  favoriteCropIds,
  materialCropIds,
  draft,
  registeredAddress,
  initialDocumentUrls = [],
}: {
  material: ReportMaterialSummary;
  userId: string;
  crops: CropOption[];
  effects: ReportEffectOption[];
  materialEffectNames: string[];
  favoriteCropIds: string[];
  materialCropIds: string[];
  draft: UsageReportInput | null;
  registeredAddress: RegisteredAddress;
  initialDocumentUrls?: { id: string; url: string }[];
}) {
  const router = useRouter();
  const [input, setInput] = useState(() => {
    const base = draft ?? createBlankUsageReport(material.id);
    return { ...base, prefectureCode: base.prefectureCode ?? registeredAddress.prefectureCode };
  });
  const [manualUnits, setManualUnits] = useState(
    () => new Set(input.measurements.filter((item) => item.unit).map((item) => item.id)),
  );
  const [documentUrls, setDocumentUrls] = useState(initialDocumentUrls);
  const [saved, setSaved] = useState(() => JSON.stringify(input));
  const [currentMaterial, setCurrentMaterial] = useState(material);
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(false);
  const [published, setPublished] = useState(false);
  const [errors, setErrors] = useState<UsageReportFieldErrors>({});
  const [notice, setNotice] = useState<Failure>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dirty = JSON.stringify(input) !== saved;
  const busy = pending || uploading;
  const cropName = crops.find((crop) => crop.id === input.cropId)?.name ?? "作物未選択";

  // 下書き保存の前に閉じても、同じタブで開き直せば保存前の入力に戻る
  usePersistedInput({
    name: "report",
    schema: UsageReportInputSchema,
    unsaved: dirty && !submitted ? input : null,
    restore: (restored) => {
      if (restored.materialId !== material.id) return;
      setInput(restored);
      setManualUnits(
        new Set(restored.measurements.filter((item) => item.unit).map((item) => item.id)),
      );
    },
  });

  useEffect(() => {
    if (!dirty || submitted) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, submitted]);

  const showError = useCallback((text: string) => setNotice({ text }), []);
  function showMissing(text: string, missing: UsageReportFieldErrors) {
    setErrors(missing);
    const first = Object.keys(missing).toSorted(
      (a, b) => reportErrorStep(a) - reportErrorStep(b),
    )[0];
    if (first) navigate(reportErrorStep(first));
    setNotice({ text, items: missingMessages(missing) });
  }
  function navigate(next: number) {
    if (next !== TOTAL) setPreview(false);
    setStep(Math.max(1, Math.min(TOTAL, next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function save(submit: boolean) {
    if (submit) {
      const missing = validateUsageReportSubmission(input);
      setErrors(missing);
      if (Object.keys(missing).length > 0) {
        showMissing("入力が足りない項目があります。", missing);
        return;
      }
    }
    startTransition(() => persist(submit));
  }
  async function persist(submit: boolean, close = false) {
    try {
      const result = submit
        ? await submitUsageReportAction(input.materialId, input)
        : await saveUsageReportDraftAction(input.materialId, input);
      if (!result.ok) {
        if (result.savedDraft !== undefined) {
          const savedInput = { ...input, expectedUpdatedAt: result.savedDraft.updatedAt };
          setInput(savedInput);
          if (result.savedDraft.status === "complete") setSaved(JSON.stringify(savedInput));
        }
        if (Object.keys(result.fieldErrors).length > 0)
          showMissing(result.message, result.fieldErrors);
        else {
          setErrors({});
          showError(result.message);
        }
        return;
      }
      setNotice(null);
      const savedInput = { ...input, expectedUpdatedAt: result.updatedAt };
      setInput(savedInput);
      setSaved(JSON.stringify(savedInput));
      setErrors({});
      if (result.status === "pending") setSubmitted(true);
      else toast(result.message, { toasterId: reportToasterId });
      if (close) {
        router.push(`/materials/${input.materialId}`);
      } else if (input.materialId !== material.id) {
        router.replace(`/materials/${input.materialId}/report/new`);
      }
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "保存できませんでした。通信状態を確認して再度お試しください。",
      );
    }
  }
  async function upload(file: File | undefined, section: ReportSection, document: boolean) {
    if (!file) return;
    const extension = document
      ? file.type === "application/pdf"
        ? "pdf"
        : null
      : file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : null;
    if (!extension || file.size > (document ? 20 : 50) * 1024 * 1024) {
      showError(
        document
          ? "20MB以下のPDFを選んでください。"
          : "50MB以下のJPEG・PNG・WebP画像を選んでください。",
      );
      return;
    }
    if (document ? input.documents.length >= 10 : input.media.length >= 30) {
      showError(document ? "資料は10件まで添付できます。" : "写真は30枚まで添付できます。");
      return;
    }
    setUploading(true);
    try {
      const client = createAuthBrowserClient();
      const id = crypto.randomUUID();
      const path = `${userId}/${input.reportId}/${id}.${extension}`;
      const bucket = document ? "report-documents" : "report-media";
      const { error } = await client.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error("ファイルを保存できませんでした。再度お試しください。");
      if (document) {
        const signed = await client.storage.from(bucket).createSignedUrl(path, 3600);
        if (signed.error) throw new Error("資料の確認リンクを生成できませんでした。");
        setDocumentUrls((current) => [...current, { id, url: signed.data.signedUrl }]);
        setInput((current) => ({
          ...current,
          documents: [...current.documents, { id, path, name: file.name }],
        }));
      } else {
        const { data } = client.storage.from(bucket).getPublicUrl(path);
        setInput((current) => ({
          ...current,
          media: [
            ...current.media,
            { id, url: data.publicUrl, mediaType: "photo", section, caption: "" },
          ],
        }));
      }
      setNotice(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "ファイルを保存できませんでした。");
    } finally {
      setUploading(false);
    }
  }

  if (submitted)
    return (
      <div className={reportFrame}>
        <div className={shell}>
          <section className={donePane}>
            <SuccessMark entrance className={doneMark} />
            <h2 className={cx(doneTitle, completionStepRecipe({ step: 1 }))}>
              レポートを受け付けました
            </h2>
            <p className={cx(doneText, completionStepRecipe({ step: 2 }))}>
              運営が内容を確認して公開します。修正をお願いする場合があります。
            </p>
            <a
              className={cx(pillButtonRecipe(), completionStepRecipe({ step: 3 }))}
              href={`/materials/${input.materialId}`}
            >
              資材ページに戻る
            </a>
          </section>
        </div>
      </div>
    );

  const readyToPost = input.cropId !== null && input.observedChange.trim().length > 0;
  const incompleteSteps = new Set(
    Object.keys(validateUsageReportSubmission(input)).map(reportErrorStep),
  );
  return (
    <div className={reportFrame}>
      <form
        className={shell}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step < TOTAL) navigate(step + 1);
          else save(true);
        }}
      >
        <div className={head} data-report-head>
          <div className={headTop}>
            <div className={title}>
              実証詳細レポート <small className={titleMaterial}>{currentMaterial.name}</small>
            </div>
            <button
              type="button"
              className={pillButtonRecipe({ strong: true })}
              disabled={busy}
              onClick={() => save(false)}
            >
              下書き保存
            </button>
            <button
              type="button"
              className={pillButtonRecipe({ strong: true })}
              disabled={busy}
              onClick={() => {
                if (preview) {
                  setPreview(false);
                  return;
                }
                navigate(TOTAL);
                setPreview(true);
              }}
            >
              {preview ? "編集に戻る" : "プレビュー"}
            </button>
            {preview && (
              <button
                type="button"
                className={pillButtonRecipe({ strong: true })}
                onClick={() => {
                  setPublished(true);
                  window.scrollTo(0, 0);
                }}
              >
                公開後の見え方
              </button>
            )}
            <button
              type="button"
              className={closeButton}
              aria-label="レポートを閉じる"
              title="下書きを保存して閉じる"
              disabled={busy}
              onClick={() =>
                dirty ? setLeaving(true) : router.push(`/materials/${input.materialId}`)
              }
            >
              ×
            </button>
          </div>
          <nav className={stepper} aria-label="入力ステップ">
            {STEPS.map((label, index) => {
              const n = index + 1;
              const done = n < step && !incompleteSteps.has(n);
              const state: StepState = n === step ? "current" : done ? "done" : "todo";
              return (
                <button
                  key={label}
                  type="button"
                  className={stepButton}
                  aria-current={n === step ? "step" : undefined}
                  aria-label={`${n} ${label}`}
                  onClick={() => navigate(n)}
                >
                  <span className={stepNumber({ state })}>{done ? "✓" : n}</span>
                  <span className={stepLabel({ state })}>{label}</span>
                  {n < TOTAL && <span className={stepLine({ state })} />}
                </button>
              );
            })}
          </nav>
        </div>
        {notice && (
          <Notice tone="error" className={errorNotice}>
            {notice.text}
            {notice.items && notice.items.length > 0 && (
              <ul className={errorList}>
                {notice.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </Notice>
        )}
        <fieldset disabled={busy} className={fields}>
          <section className={pane}>
            {step === 1 && (
              <ReportStepBasics
                input={input}
                onChange={setInput}
                errors={errors}
                material={currentMaterial}
                pageMaterialId={material.id}
                onMaterialChange={(next) => {
                  setCurrentMaterial(next);
                  setInput({ ...input, materialId: next.id });
                }}
                crops={crops}
                favoriteCropIds={favoriteCropIds}
                materialCropIds={materialCropIds}
                onMessage={showError}
              />
            )}
            {step === 2 && (
              <ReportStepResult
                input={input}
                onChange={setInput}
                errors={errors}
                effects={effects}
                materialEffectNames={input.materialId === material.id ? materialEffectNames : []}
              />
            )}
            {step === 3 && (
              <ReportStepConditions input={input} onChange={setInput} errors={errors} />
            )}
            {step === 4 && (
              <ReportComparisonFields
                input={input}
                onChange={setInput}
                errors={errors}
                manualUnits={manualUnits}
                onManualUnit={(id) => setManualUnits((previous) => new Set([...previous, id]))}
              />
            )}
            {step === TOTAL && (
              <ReportArticleEditor
                input={input}
                onChange={setInput}
                errors={errors}
                preview={preview}
                missingLabels={missingLabels(validateUsageReportSubmission(input))}
                materialName={currentMaterial.name}
                cropName={cropName}
                documentUrls={documentUrls}
                uploading={uploading}
                onUpload={(file, section, document) => void upload(file, section, document)}
              />
            )}
          </section>
        </fieldset>
        <div className={foot}>
          <div className={footInner}>
            <button
              type="button"
              className={footButton}
              disabled={busy || step === 1}
              onClick={() => navigate(step - 1)}
            >
              戻る
            </button>
            <span className={stepCount}>
              ステップ <b className={stepCountNumber}>{step}</b> / {TOTAL}
            </span>
            <span className={spacer} />
            {step >= 3 && step < TOTAL && readyToPost && (
              <button
                type="button"
                className={pillButtonRecipe({ tone: "soft", size: "md", strong: true })}
                onClick={() => navigate(TOTAL)}
              >
                ここまでで投稿
              </button>
            )}
            <button
              type="submit"
              className={pillButtonRecipe({ tone: "primary", size: "md", strong: true })}
              disabled={busy}
            >
              {busy ? "保存しています…" : step === TOTAL ? "公開に進む" : "次へ"}
            </button>
          </div>
        </div>
        <ReportPublishedView
          open={published}
          onOpenChange={setPublished}
          input={input}
          materialName={currentMaterial.name}
          manufacturerName={currentMaterial.manufacturerName}
          cropName={cropName}
        />
      </form>
      <ConfirmDialog
        open={leaving}
        onOpenChange={setLeaving}
        title="入力途中の内容を下書きに保存しますか？"
        description="保存すると、マイページの「下書き」から続きを入力できます。"
        confirmLabel="下書きを保存して閉じる"
        pendingLabel="保存しています…"
        cancelLabel="入力に戻る"
        tone="primary"
        alternative={{
          label: "保存せずに閉じる",
          onSelect: () => router.push(`/materials/${input.materialId}`),
        }}
        onConfirm={() => persist(false, true)}
      />
      <ReportToaster />
    </div>
  );
}
