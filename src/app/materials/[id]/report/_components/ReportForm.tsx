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
import type { RegisteredAddress } from "@/server/accounts/registered-address";
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

/** 提出時に出す、足りない項目ごとの案内（「都道府県を選んでください」など）。ステップ順に並べる */
function missingMessages(errors: UsageReportFieldErrors) {
  const message = (key: string) => {
    if (key === "cropId") return "使用作物を選んでください";
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

type Notice = { kind: "ok" | "error"; text: string; items?: string[] } | null;

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
  /** 本人の登録住所。都道府県の初期値と「市区町村も表示する」を選んだときの初期値に使う */
  registeredAddress: RegisteredAddress;
  initialDocumentUrls?: { id: string; url: string }[];
}) {
  const router = useRouter();
  // 登録住所で埋めるのは、レポート側の値が空のときだけ（下書きの保存内容は上書きしない）。
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
  function showMissing(text: string, missing: UsageReportFieldErrors) {
    setErrors(missing);
    const first = Object.keys(missing).toSorted(
      (a, b) => reportErrorStep(a) - reportErrorStep(b),
    )[0];
    if (first) navigate(reportErrorStep(first));
    setNotice({ kind: "error", text, items: missingMessages(missing) });
  }
  function navigate(next: number) {
    if (next !== TOTAL) setPreview(false);
    setStep(Math.max(1, Math.min(TOTAL, next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function save(submit: boolean, close = false) {
    if (submit) {
      const missing = validateUsageReportSubmission(input);
      setErrors(missing);
      if (Object.keys(missing).length > 0) {
        showMissing("入力が足りない項目があります。", missing);
        return;
      }
    }
    startTransition(async () => {
      try {
        const result = submit
          ? await submitUsageReportAction(input.materialId, input)
          : await saveUsageReportDraftAction(input.materialId, input);
        if (!result.ok) {
          if (result.savedUpdatedAt !== undefined) {
            const savedInput = { ...input, expectedUpdatedAt: result.savedUpdatedAt };
            setInput(savedInput);
            setSaved(JSON.stringify(savedInput));
          }
          if (Object.keys(result.fieldErrors).length > 0)
            showMissing(result.message, result.fieldErrors);
          else {
            setErrors({});
            showError(result.message);
          }
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
  // ✓ は「通り過ぎた」だけでなく、そのステップの必須項目がそろっているときだけ付ける。
  const incompleteSteps = new Set(
    Object.keys(validateUsageReportSubmission(input)).map(reportErrorStep),
  );
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
              const done = n < step && !incompleteSteps.has(n);
              const state = n === step ? "step cur" : done ? "step done" : "step";
              return (
                <button
                  key={label}
                  type="button"
                  className={state}
                  aria-current={n === step ? "step" : undefined}
                  aria-label={`${n} ${label}`}
                  onClick={() => navigate(n)}
                >
                  <span className="n">{done ? "✓" : n}</span>
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
            {notice.items && notice.items.length > 0 && (
              <ul style={{ margin: "4px 0 0", paddingLeft: "1.2em" }}>
                {notice.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
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
              <ReportStepConditions
                input={input}
                onChange={setInput}
                errors={errors}
                registeredCity={registeredAddress.city}
              />
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
