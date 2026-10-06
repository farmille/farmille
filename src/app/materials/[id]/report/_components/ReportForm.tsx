"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  saveUsageReportDraftAction,
  submitUsageReportAction,
} from "@/app/materials/[id]/report/new/actions";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import {
  createBlankUsageReport,
  reportErrorStep,
  validateUsageReportSubmission,
  type UsageReportFieldErrors,
  type UsageReportInput,
} from "@/lib/usage-report";
import type { CropOption } from "@/server/queries/usage-report-form";

import { ReportArticleEditor } from "./ReportArticleEditor";
import type { ReportSection } from "./ReportArticleParts";
import { ReportComparisonFields } from "./ReportComparisonFields";
import { ReportPublishedView } from "./ReportPublishedView";
import { ReportStepBasics, type ReportMaterialSummary } from "./ReportStepBasics";
import { ReportStepConditions } from "./ReportStepConditions";
import { ReportStepResult, type ReportEffectOption } from "./ReportStepResult";

const STEPS = ["資材・作物", "結果", "栽培条件", "比較・使用結果", "写真・記事の確認"];
const TOTAL = STEPS.length;

/** 未入力の項目キー → 見本の REQ() の項目名（プレビューの注意書きに使う） */
function missingLabels(errors: UsageReportFieldErrors) {
  const label = (key: string) => {
    if (key === "cropId") return "使用作物";
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

type Notice = { kind: "ok" | "error"; text: string } | null;

export function ReportForm({
  material,
  userId,
  crops,
  effects,
  materialEffectNames,
  favoriteCropIds,
  materialCropIds,
  draft,
  prefectureCode,
  city,
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
  prefectureCode: number | null;
  city: string;
  initialDocumentUrls?: { id: string; url: string }[];
}) {
  const router = useRouter();
  const [input, setInput] = useState(
    () => draft ?? { ...createBlankUsageReport(material.id), prefectureCode, city },
  );
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
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leaveSave = useRef<HTMLButtonElement>(null);
  const dirty = JSON.stringify(input) !== saved;
  const busy = pending || uploading;
  const cropName = crops.find((crop) => crop.id === input.cropId)?.name ?? "作物未選択";

  useEffect(() => {
    if (!dirty || submitted) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, submitted]);
  useEffect(() => {
    if (notice?.kind !== "ok") return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!leaving) return;
    leaveSave.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLeaving(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [leaving]);

  const showError = useCallback((text: string) => setNotice({ kind: "error", text }), []);
  function navigate(next: number) {
    if (next !== TOTAL) setPreview(false);
    setStep(Math.max(1, Math.min(TOTAL, next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function save(submit: boolean, close = false) {
    if (submit) {
      const missing = validateUsageReportSubmission(input);
      setErrors(missing);
      const first = Object.keys(missing)[0];
      if (first) {
        navigate(reportErrorStep(first));
        showError("入力が足りない箇所があります。赤字の項目を確認してください。");
        return;
      }
    }
    startTransition(async () => {
      try {
        const result = submit
          ? await submitUsageReportAction(input.materialId, input)
          : await saveUsageReportDraftAction(input.materialId, input);
        if (!result.ok) {
          showError(result.message);
          setErrors(result.fieldErrors);
          const first = Object.keys(result.fieldErrors)[0];
          if (first) navigate(reportErrorStep(first));
          return;
        }
        setNotice({ kind: "ok", text: result.message });
        const savedInput = { ...input, expectedUpdatedAt: result.updatedAt };
        setInput(savedInput);
        setSaved(JSON.stringify(savedInput));
        setErrors({});
        if (result.status === "pending") setSubmitted(true);
        if (close) {
          setLeaving(false);
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
    });
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
      <div className="fm-wiz">
        <div className="shell">
          <section className="pane on">
            <h2>レポートを受け付けました</h2>
            <p className="sub">運営が内容を確認して公開します。修正をお願いする場合があります。</p>
            <a className="mini" href={`/materials/${input.materialId}`}>
              資材ページに戻る
            </a>
          </section>
        </div>
      </div>
    );

  const readyToPost = input.cropId !== null && input.observedChange.trim().length > 0;
  return (
    <div className="fm-wiz">
      <form
        className="shell"
        onSubmit={(event) => {
          event.preventDefault();
          if (step < TOTAL) navigate(step + 1);
          else save(true);
        }}
      >
        <div className="head">
          <div className="head-top">
            <div className="ttl">
              実証詳細レポート <small>{currentMaterial.name}</small>
            </div>
            <button type="button" className="hb" disabled={busy} onClick={() => save(false)}>
              下書き保存
            </button>
            <button
              type="button"
              className="hb"
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
                className="hb"
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
              className="x"
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
          <nav className="steps" aria-label="入力ステップ">
            {STEPS.map((label, index) => {
              const n = index + 1;
              const state = n === step ? "step cur" : n < step ? "step done" : "step";
              return (
                <button
                  key={label}
                  type="button"
                  className={state}
                  aria-current={n === step ? "step" : undefined}
                  aria-label={`${n} ${label}`}
                  onClick={() => navigate(n)}
                >
                  <span className="n">{n < step ? "✓" : n}</span>
                  <span className="lb">{label}</span>
                  {n < TOTAL && <span className="ln" />}
                </button>
              );
            })}
          </nav>
        </div>
        {notice?.kind === "error" && (
          <div className="msg" role="alert">
            {notice.text}
          </div>
        )}
        <fieldset disabled={busy} style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>
          <section
            className={step === TOTAL && preview ? "pane on pv-on" : "pane on"}
            data-p={step}
          >
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
        <div className="foot">
          <div className="foot-in">
            <button
              type="button"
              className="btn"
              disabled={busy || step === 1}
              onClick={() => navigate(step - 1)}
            >
              戻る
            </button>
            <span className="st">
              ステップ <b className="tnum">{step}</b> / {TOTAL}
            </span>
            <span className="sp" />
            {step >= 3 && step < TOTAL && readyToPost && (
              <button type="button" className="btn g" onClick={() => navigate(TOTAL)}>
                ここまでで投稿
              </button>
            )}
            <button type="submit" className="btn p" disabled={busy}>
              {busy ? "保存しています…" : step === TOTAL ? "公開に進む" : "次へ"}
            </button>
          </div>
        </div>
        {notice?.kind === "ok" && (
          <div className="toast on" role="status">
            {notice.text}
          </div>
        )}
        {published && (
          <ReportPublishedView
            input={input}
            materialName={currentMaterial.name}
            manufacturerName={currentMaterial.manufacturerName}
            cropName={cropName}
            onBack={() => setPublished(false)}
          />
        )}
        {leaving && (
          <div className="modal show">
            <div
              className="modal-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-leave-title"
            >
              <div className="modal-t" id="report-leave-title">
                入力途中の内容を下書きに保存しますか？
              </div>
              <div className="modal-s">
                保存すると、マイページの「下書き」から続きを入力できます。
              </div>
              <div className="modal-a">
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => {
                    setLeaving(false);
                    router.push(`/materials/${input.materialId}`);
                  }}
                >
                  保存せずに閉じる
                </button>
                <span className="sp" />
                <button type="button" className="btn" onClick={() => setLeaving(false)}>
                  入力に戻る
                </button>
                <button
                  ref={leaveSave}
                  type="button"
                  className="btn p"
                  disabled={busy}
                  onClick={() => save(false, true)}
                >
                  下書きを保存して閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
