"use client";

import { startTransition, useActionState, useCallback, useReducer, useRef } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { usePersistedInput } from "@/lib/hooks/use-form-persisted-input";
import { useReportMediaHistory } from "@/lib/hooks/use-report-media-history";
import { useRouter } from "next/navigation";

import {
  saveUsageReportDraftAction,
  submitUsageReportAction,
} from "@/app/materials/[id]/report/new/actions";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Checkbox, Notice, Textarea } from "@/components/form";
import { persistKey, removePersisted } from "@/components/form/persisted-input";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/Toaster";
import {
  effectivePdfReadingMarks,
  pdfReadingTrialDraft,
  type PdfReadingField,
  type PdfReadingResult,
} from "@/lib/pdf-reading";
import {
  createBlankUsageReport,
  REPORT_COMPARISON_HEADING,
  reportNeedsMaterialAcks,
  type UsageReportInput,
} from "@/lib/usage-report";
import { reportPlotLayout, withAutoPlotNames } from "@/lib/usage-report-plots";
import type { RegisteredAddress } from "@/server/accounts/registered-address";
import type { CropOption } from "@/server/queries/usage-report-form";

import { css, cx } from "../../../../../../styled-system/css";

import { pillButtonRecipe, reportFrame, ReportToaster, reportToasterId } from "./ReportFormParts";
import { ReportItemFileDialog } from "./ReportItemFileDialog";
import { ReportLegacyMedia } from "./ReportLegacyMedia";
import { ReportNumericItemDialog } from "./ReportNumericItemDialog";
import { ReportPageItems } from "./ReportPageItems";
import { ReportPagePlots } from "./ReportPagePlots";
import { ReportPagePreview } from "./ReportPagePreview";
import { ReportPageProperties, type ReportEffectOption } from "./ReportPageProperties";
import { ReportPdfReadingDialog } from "./ReportPdfReadingDialog";
import { ReportPdfReadingMark, ReportPdfReadingMarks } from "./ReportPdfReadingMark";
import {
  inputWithItems,
  itemsFromInput,
  itemsWithPlots,
  REPORT_BODY_MAX,
  ReportPageBackupSchema,
  reportImageRoom,
  reportLegacyMedia,
  reportLengthNote,
  reportOverLimit,
  reportPageChecks,
  reportPageTitle,
  reportPdfReadingReplaces,
  type ReportMaterialSummary,
  type ReportPageAcks,
  type ReportPageItem,
  type ReportPageNumericItem,
} from "./report-page-state";
import { docHeadingRecipe, requirementMark } from "./report-page-styles";
import { useReportLeaveWarning } from "@/lib/hooks/use-report-leave-warning";

type PdfReadingStatus = {
  remaining: PdfReadingResult["remaining"];
  marks: PdfReadingField[];
  checkRequired: boolean;
};

type ReportPageFormValues = {
  input: UsageReportInput;
  items: ReportPageItem[];
  acks: ReportPageAcks;
};

type ReportSaveState =
  | { status: "idle" | "saved" | "submitted" }
  | { status: "error"; message: string };

type ReportSaveCommand = { type: "save"; submit: boolean; close: boolean } | { type: "clear" };

const bar = css({
  position: "sticky",
  top: "0",
  zIndex: "formBar",
  bg: "surface.card",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

const barInner = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  maxW: "content.form",
  mx: "auto",
  px: "4",
  py: "1.5",
  textStyle: "note",
  color: "text.muted",
});

const crumb = css({
  flex: "1",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const count = css({ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" });

const progress = css({ h: "0.5", bg: "border.default" });

const progressFill = css({
  display: "block",
  h: "full",
  w: "var(--progress)",
  bg: "primary.600",
  transitionProperty: "[width]",
  transitionDuration: "dialog",
});

const closeButton = css({
  display: "grid",
  placeItems: "center",
  w: "8",
  h: "8",
  border: "none",
  borderRadius: "pill",
  bg: "transparent",
  color: "text.muted",
  cursor: "pointer",
  _hover: { bg: "surface.panel", color: "text.default" },
});

const page = css({
  maxW: "content.form",
  mx: "auto",
  px: "4",
  pb: "36",
  bg: "surface.card",
  minH: "dvh",
});

const cover = css({ position: "relative", h: "20", mx: "-4", bg: "primary.100" });

const coverIcon = css({
  position: "absolute",
  left: "4",
  bottom: "-7",
  display: "grid",
  placeItems: "center",
  w: "14",
  h: "14",
  borderRadius: "card",
  bg: "surface.card",
  color: "text.brand",
  boxShadow: "shadow",
});

const titleStyle = css({ m: "0", mt: "11", fontSize: "3xl", lineHeight: "snug" });

const props = css({ mt: "4" });

const reading = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "3",
  rowGap: "1",
  mt: "4",
});

const readingButton = css({ gap: "1.5" });

const readingNote = css({ textStyle: "note", color: "text.muted" });

const divider = css({ mt: "4", h: "[1px]", bg: "border.default" });

const ackRow = css({ mt: "3" });

const ackMissing = css({ color: "accent.danger" });

const rules = css({
  m: "0",
  mt: "3",
  pl: "5",
  listStyleType: "disc",
  textStyle: "supporting",
  color: "text.default",
});

const send = css({ mt: "8" });

const missingBox = css({ mt: "3" });

const missingLink = css({
  mt: "1",
  border: "none",
  bg: "transparent",
  p: "0",
  fontWeight: "bold",
  color: "accent.danger",
  textDecoration: "underline",
  cursor: "pointer",
});

const doneWrap = css({
  maxW: "content.form",
  mx: "auto",
  pt: "10",
  px: "4.5",
  textAlign: "center",
});

function focusTarget(id: string) {
  const element = document.getElementById(id);
  if (element === null) return;
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  const control = element.matches("input, textarea, button")
    ? element
    : element.querySelector<HTMLElement>("input, textarea, button");
  control?.focus({ preventScroll: true });
}

export function ReportPageForm({
  material,
  userId,
  authorName,
  crops,
  effects,
  materialEffectNames,
  favoriteCropIds,
  materialCropIds,
  draft,
  documentUrls,
  registeredAddress,
  pdfReading,
}: {
  material: ReportMaterialSummary;
  userId: string;
  authorName: string;
  crops: CropOption[];
  effects: ReportEffectOption[];
  materialEffectNames: string[];
  favoriteCropIds: string[];
  materialCropIds: string[];
  draft: UsageReportInput | null;
  /** 下書きの関連資料（PDF）を開く署名付き URL。 */
  documentUrls: { id: string; url: string }[];
  registeredAddress: RegisteredAddress;
  /**
   * PDF読み取りの入口に出す残り回数・reCAPTCHA のサイトキーと、この下書きの最新の読み取りで入った欄。
   * checkRequired は、読み取りの値を元のPDFと照らし合わせた確認を提出に求めるか。
   */
  pdfReading: PdfReadingStatus & {
    siteKey: string | null;
  };
}) {
  const router = useRouter();
  const [initialValues] = useReducer(
    (value: ReportPageFormValues) => value,
    null,
    () => {
      // ページ版では数値のグラフを手で作らないので、新しいレポートは入れ方を選ぶ前の調査項目から始める
      const base = draft ?? { ...createBlankUsageReport(material.id), measurements: [] };
      const named = withAutoPlotNames(base, base, material.name);
      const input = {
        ...named,
        prefectureCode: named.prefectureCode ?? registeredAddress.prefectureCode,
      };
      // 空の調査項目のIDも初回に確定し、再描画でフォームの初期値を変えない。
      return { input, items: itemsFromInput(input), acks: { timing: false, privacy: false } };
    },
  );
  const form = useForm({
    defaultValues: initialValues,
  });
  const { input, items, acks } = useStore(form.store, (state) => state.values);
  const setInput = useCallback(
    (next: UsageReportInput | ((current: UsageReportInput) => UsageReportInput)) =>
      form.setFieldValue("input", next),
    [form],
  );
  const setItems = useCallback(
    (next: ReportPageItem[] | ((current: ReportPageItem[]) => ReportPageItem[])) =>
      form.setFieldValue("items", next),
    [form],
  );
  const setAcks = (next: (current: ReportPageAcks) => ReportPageAcks) =>
    form.setFieldValue("acks", next);
  const payload = inputWithItems(input, items);
  const [saved, setSaved] = useReducer(
    (_current: string, next: string) => next,
    payload,
    JSON.stringify,
  );
  const [currentMaterial, setCurrentMaterial] = useReducer(
    (_current: ReportMaterialSummary, next: ReportMaterialSummary) => next,
    material,
  );
  const [tried, setTried] = useReducer((_current: boolean, next: boolean) => next, false);
  const [failure, setFailure] = useReducer(
    (_current: string | null, next: string | null) => next,
    null,
  );
  const [preview, setPreview] = useReducer((_current: boolean, next: boolean) => next, false);
  const [leaving, setLeaving] = useReducer((_current: boolean, next: boolean) => next, false);
  const [fileItem, setFileItem] = useReducer(
    (
      _current: { item: ReportPageItem; isNew: boolean } | null,
      next: { item: ReportPageItem; isNew: boolean } | null,
    ) => next,
    null,
  );
  const [numericItem, setNumericItem] = useReducer(
    (_current: ReportPageNumericItem | null, next: ReportPageNumericItem | null) => next,
    null,
  );
  const [readingOpen, setReadingOpen] = useReducer(
    (_current: boolean, next: boolean) => next,
    false,
  );
  const [{ marks: readMarks, checkRequired, remaining }, recordReading] = useReducer(
    (current: PdfReadingStatus, result: PdfReadingResult): PdfReadingStatus => {
      const remaining = result.remaining ?? current.remaining;
      if (result.ok) return { remaining, marks: result.marks, checkRequired: true };
      const adopted = result.savedDraft?.saved === "read";
      return {
        remaining,
        marks: adopted ? [] : current.marks,
        checkRequired: current.checkRequired || result.pdfValuesCheckRequired || adopted,
      };
    },
    {
      marks: pdfReading.marks,
      checkRequired: pdfReading.checkRequired,
      remaining: pdfReading.remaining,
    },
  );
  // 連打で保存・提出が二重に送られないよう、送信中は ref で止める（state の disabled は次の描画まで効かない）
  const sending = useRef(false);
  // この画面の入力に入った画像。保存の前に外れた分は、保存のあとにサーバーが置き場から消す
  const shownMedia = useReportMediaHistory(payload.media);
  const dirty = JSON.stringify(payload) !== saved;
  const reportPath = `/materials/${material.id}/report/new`;

  const update = useCallback(
    (next: (current: UsageReportInput) => UsageReportInput) => setInput(next),
    [setInput],
  );
  // 区を変えたら、数値の調査項目のグラフの行も区にそろえる
  const changePlots = useCallback(
    (next: UsageReportInput) => {
      setInput(next);
      setItems((current) => itemsWithPlots(current, next.plots));
    },
    [setInput, setItems],
  );
  // 失敗は画面の下の欄に残し、スマホでも気づけるよう通知でも出す
  const showError = useCallback((message: string) => {
    setFailure(message);
    toast.error(message.split("\n")[0], { toasterId: reportToasterId });
  }, []);

  const checks = reportPageChecks(payload, acks, checkRequired);
  const marks = effectivePdfReadingMarks(readMarks, payload);
  const missing = checks.filter((check) => !check.ok);
  const missingKeys = new Set(tried ? missing.map((check) => check.key) : []);
  const cropName = crops.find((crop) => crop.id === input.cropId)?.name ?? null;
  const title = reportPageTitle(currentMaterial.name, cropName);
  const materialAcks = reportNeedsMaterialAcks(payload);
  const done = checks.length - missing.length;
  const layout = reportPlotLayout(input, currentMaterial.name);

  /** この画面の入力に入っていて、current から外れた画像。保存で渡すと、サーバーが置き場から消す。 */
  function droppedMedia(current: UsageReportInput): string[] {
    const kept = new Set(current.media.map((media) => media.url));
    return [...shownMedia.current].filter((url) => !kept.has(url));
  }

  /** 下書きの保存が済んだら、渡した画像はサーバーが消している。 */
  function forgetDropped(urls: string[]) {
    for (const url of urls) shownMedia.current.delete(url);
  }

  function saveFailure(message: string): ReportSaveState {
    toast.error(message.split("\n")[0], { toasterId: reportToasterId });
    return { status: "error", message };
  }

  async function performSave(submit: boolean, close: boolean): Promise<ReportSaveState> {
    try {
      const body = inputWithItems(input, items);
      const over = reportOverLimit(body, items);
      if (over.length > 0) {
        return saveFailure(`文字数の上限を超えている欄があります：${over.join("、")}`);
      }
      const dropped = droppedMedia(body);
      const result = submit
        ? await submitUsageReportAction(body.materialId, body, dropped)
        : await saveUsageReportDraftAction(body.materialId, body, dropped);
      if (result.ok || result.savedDraft !== undefined) forgetDropped(dropped);
      if (!result.ok) {
        if (result.savedDraft !== undefined) {
          const savedUpdatedAt = result.savedDraft.updatedAt;
          setInput((current) => ({ ...current, expectedUpdatedAt: savedUpdatedAt }));
          if (result.savedDraft.status === "complete")
            setSaved(JSON.stringify({ ...body, expectedUpdatedAt: savedUpdatedAt }));
        }
        const details = Object.values(result.fieldErrors).map((text) => text.replace(/^※\s*/, ""));
        return saveFailure([result.message, ...new Set(details)].join("\n"));
      }
      setFailure(null);
      setInput((current) => ({ ...current, expectedUpdatedAt: result.updatedAt }));
      setSaved(JSON.stringify({ ...body, expectedUpdatedAt: result.updatedAt }));
      if (result.status === "pending") {
        // 提出後の画面はサーバーの「提出済み」に揃える
        router.refresh();
      } else {
        const now = new Date();
        toast(
          `下書きを保存しました（${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}）`,
          {
            toasterId: reportToasterId,
          },
        );
      }
      if (close) router.push(`/materials/${body.materialId}`);
      else if (body.materialId !== material.id)
        router.replace(`/materials/${body.materialId}/report/new`);
      return { status: result.status === "pending" ? "submitted" : "saved" };
    } catch {
      // 通信の失敗などはブラウザの英語の文言になるので、そのまま出さない
      return saveFailure(
        "保存できませんでした。入力内容はそのまま残っています。通信状態を確認して再度お試しください。",
      );
    } finally {
      sending.current = false;
    }
  }

  const [saveState, dispatchSave, pending] = useActionState<ReportSaveState, ReportSaveCommand>(
    async (_previous, command) =>
      command.type === "clear" ? { status: "idle" } : performSave(command.submit, command.close),
    { status: "idle" },
  );
  const submitted = saveState.status === "submitted";
  const visibleFailure = failure ?? (saveState.status === "error" ? saveState.message : null);

  // 下書き保存の前に閉じても、同じタブで開き直せば保存前の入力に戻る
  // 資材ページから画面内の遷移で開くと、最初の描画ではまだ URL が遷移前なので、控えの置き場は URL を固定する
  usePersistedInput({
    name: "report",
    path: reportPath,
    schema: ReportPageBackupSchema,
    unsaved: dirty && !submitted ? { material: currentMaterial, input: payload } : null,
    restore: (backup) => {
      // 控えのあとに別の画面で下書きが更新されていたら、控えは戻さない（戻すと保存のたびに競合する）
      if (backup.input.expectedUpdatedAt !== input.expectedUpdatedAt) {
        setFailure(
          "別の画面で更新された下書きを開きました。この画面で保存していなかった入力は戻していません。",
        );
        return;
      }
      setCurrentMaterial(backup.material);
      setInput(backup.input);
      setItems(itemsFromInput(backup.input));
    },
  });

  useReportLeaveWarning(dirty && !submitted);

  function persist(submit: boolean, close = false) {
    if (sending.current) return;
    sending.current = true;
    setFailure(null);
    startTransition(() => dispatchSave({ type: "save", submit, close }));
  }

  // 読み取った値はサーバーの下書きに保存済みなので、画面の入力と保存済みの控えをまとめて置き換える
  function adoptRead(next: UsageReportInput) {
    const nextItems = itemsFromInput(next);
    setInput(next);
    setItems(nextItems);
    setSaved(JSON.stringify(inputWithItems(next, nextItems)));
  }

  function applyReading(result: PdfReadingResult) {
    recordReading(result);
    // 読み取りの間は編集できないので、外した画像は読み取りに渡したときのまま
    if (result.ok || result.savedDraft !== null)
      forgetDropped(droppedMedia(inputWithItems(input, items)));
    if (!result.ok) {
      // 失敗しても、サーバーの下書きを保存した分には揃える（揃えないと次の保存が競合する）
      const draft = result.savedDraft;
      if (draft?.saved === "input" || draft?.saved === "partial") {
        const stamp = { reportId: draft.reportId, expectedUpdatedAt: draft.updatedAt };
        setInput((current) => ({ ...current, ...stamp }));
        // 一部だけ保存したときは、入力を未保存のまま残す（保存し直してもらう）
        if (draft.saved === "input")
          setSaved(JSON.stringify({ ...inputWithItems(input, items), ...stamp }));
      }
      // 値は入ったが根拠の記録に失敗したので、印は出さない（文言はダイアログに出したまま）
      if (draft?.saved === "read") adoptRead(draft.input);
      return;
    }
    adoptRead(result.input);
    setFailure(null);
    startTransition(() => dispatchSave({ type: "clear" }));
    setReadingOpen(false);
    toast("PDF読み取りの内容を下書きに保存しました。元のPDFと照らし合わせて確かめてください。", {
      toasterId: reportToasterId,
    });
  }

  function submit() {
    setTried(true);
    if (missing.length > 0) return;
    persist(true);
  }

  if (submitted)
    return (
      <div className={reportFrame}>
        <p className={doneWrap} role="status">
          提出しています…
        </p>
      </div>
    );

  const heading = (key: string, level: 2 | 3 = 2) =>
    docHeadingRecipe({ level, missing: missingKeys.has(key) });
  const ackClass = (key: string) => cx(ackRow, missingKeys.has(key) ? ackMissing : undefined);

  return (
    <ReportPdfReadingMarks marks={marks}>
      <div className={reportFrame}>
        <div className={bar}>
          <div className={barInner}>
            <span className={crumb}>実証詳細レポート｜{currentMaterial.name}</span>
            <span className={count}>
              必須 {done} / {checks.length}
            </span>
            <button
              type="button"
              className={pillButtonRecipe({ strong: true })}
              disabled={pending}
              onClick={() => persist(false)}
            >
              {pending ? "保存中…" : "下書き保存"}
            </button>
            <button
              type="button"
              className={pillButtonRecipe({ tone: "primary", strong: true })}
              onClick={() => setPreview(true)}
            >
              プレビュー
            </button>
            <button
              type="button"
              className={closeButton}
              aria-label="レポートを閉じる"
              disabled={pending}
              onClick={() =>
                dirty ? setLeaving(true) : router.push(`/materials/${input.materialId}`)
              }
            >
              <Icon name="close" />
            </button>
          </div>
          <div className={progress}>
            <i
              className={progressFill}
              style={{ "--progress": `${(done / checks.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 保存や提出は押した時点の入力を送るので、その間に変えた入力が黙って失われないよう、終わるまで編集を止める */}
        <div className={page} inert={pending}>
          <div className={cover} aria-hidden="true">
            <span className={coverIcon}>
              <Icon name="eco" size="xl" />
            </span>
          </div>
          <h1 className={titleStyle}>{title}</h1>
          <div className={reading}>
            <button
              type="button"
              className={cx(pillButtonRecipe({ tone: "soft", strong: true }), readingButton)}
              disabled={pending || remaining === null}
              onClick={() => setReadingOpen(true)}
            >
              <Icon name="picture_as_pdf" size="sm" />
              {remaining === null
                ? "PDF読み取り（いまは使えません）"
                : `PDF読み取り（今月あと${Math.max(remaining, 0)}回）`}
            </button>
            <span className={readingNote}>
              {remaining === null
                ? "残り回数を取得できませんでした。手入力で続けられます。再読み込みすると再確認します。"
                : "試験成績書のPDFから区・グラフ・栽培条件を入れます"}
            </span>
          </div>

          <div className={props}>
            <ReportPageProperties
              input={input}
              onChange={update}
              missing={missingKeys}
              material={currentMaterial}
              pageMaterialId={material.id}
              onMaterialChange={(next) => {
                setCurrentMaterial(next);
                setInput((current) =>
                  withAutoPlotNames(
                    current,
                    { ...current, materialId: next.id },
                    currentMaterial.name,
                    next.name,
                  ),
                );
              }}
              crops={crops}
              favoriteCropIds={favoriteCropIds}
              materialCropIds={materialCropIds}
              effects={effects}
              materialEffectNames={materialEffectNames}
              authorName={authorName}
              onMessage={showError}
            />
          </div>
          <div className={divider} />

          <Textarea
            id="report-observed-change"
            label="結果・感想"
            requirement="required"
            error={missingKeys.has("observedChange") ? "結果・感想を記入してください" : undefined}
            placeholder={
              "いつ頃から・どこに・どんな変化があったか。良くなかった点も\n例）2回目の使用から数日後、午後の葉の萎れが使用前よりやや軽くなった。収量が増えるような変化は確認できなかったが、暑い時期の萎れを抑える補助としては手応えがあった。薬害（葉焼け・変色）は見られなかった。"
            }
            maxLength={REPORT_BODY_MAX}
            description={reportLengthNote(input.observedChange, REPORT_BODY_MAX)}
            value={input.observedChange}
            onChange={(event) =>
              update((current) => ({ ...current, observedChange: event.target.value }))
            }
          />
          <ReportPdfReadingMark fields={[{ key: "observedChange" }]} />

          <Textarea
            id="report-environment"
            label="栽培環境"
            requirement="required"
            error={
              missingKeys.has("cultivationEnvironment") ? "栽培環境を記入してください" : undefined
            }
            placeholder={
              "露地か施設か、養液の使用など\n例）パイプハウスで土耕栽培。無加温で、灌水チューブで週2回かん水している。"
            }
            maxLength={REPORT_BODY_MAX}
            description={reportLengthNote(input.cultivationEnvironment, REPORT_BODY_MAX)}
            value={input.cultivationEnvironment}
            onChange={(event) =>
              update((current) => ({ ...current, cultivationEnvironment: event.target.value }))
            }
          />
          <ReportPdfReadingMark fields={[{ key: "cultivationEnvironment" }]} />

          <Textarea
            id="report-timing-note"
            label="処理日と生育状況"
            requirement="required"
            error={missingKeys.has("timingNote") ? "処理日と生育状況を記入してください" : undefined}
            placeholder={
              "資材を使った日（〇月〇日）は必ず。定植日・生育状況も\n例）3月6日に定植。開花してすぐの6月5日に施用。7日おきに3回。"
            }
            maxLength={REPORT_BODY_MAX}
            description={reportLengthNote(input.timingNote, REPORT_BODY_MAX)}
            value={input.timingNote}
            onChange={(event) =>
              update((current) => ({ ...current, timingNote: event.target.value }))
            }
          />
          <ReportPdfReadingMark fields={[{ key: "timingNote" }]} />
          <div id="report-timing-ack" className={ackClass("timingAck")}>
            <Checkbox
              checked={acks.timing}
              onCheckedChange={(timing) => setAcks((current) => ({ ...current, timing }))}
            >
              資材を使った日（処理日）を記入した
            </Checkbox>
          </div>

          <h2 className={heading("comparison")}>
            {REPORT_COMPARISON_HEADING}
            <span className={requirementMark}>必須</span>
          </h2>
          <h3 className={heading("plots", 3)} id="report-plots">
            比べた区
          </h3>
          <ReportPagePlots
            input={input}
            postedName={currentMaterial.name}
            onChange={changePlots}
            missing={missingKeys.has("plots")}
          />

          <h3 className={heading("measurements", 3)} id="report-items">
            調査項目ごとの結果
          </h3>
          <ReportPageItems
            items={items}
            plots={input.plots}
            layout={layout}
            onEditNumeric={setNumericItem}
            onChange={setItems}
            missing={missingKeys.has("measurements")}
            onOpenFile={(item, isNew) => setFileItem({ item, isNew })}
          />

          <ReportLegacyMedia
            media={reportLegacyMedia(input)}
            onRemove={(id) =>
              update((current) => ({
                ...current,
                media: current.media.filter((media) => media.id !== id),
              }))
            }
          />

          <h2 className={heading("acks")}>
            確認<span className={requirementMark}>必須</span>
          </h2>
          <div id="report-method-ack" className={ackClass("methodDetailsAck")}>
            <Checkbox
              checked={input.methodDetailsAck}
              onCheckedChange={(methodDetailsAck) =>
                update((current) => ({ ...current, methodDetailsAck }))
              }
            >
              資材を使った区の説明に、施用方法・希釈倍率・使用量・回数などを記入した（または「資料を参照」と書いた）
            </Checkbox>
          </div>
          {materialAcks && (
            <>
              <div id="report-privacy-ack" className={ackClass("privacyAck")}>
                <Checkbox
                  checked={acks.privacy}
                  onCheckedChange={(privacy) => setAcks((current) => ({ ...current, privacy }))}
                >
                  差し込んだグラフ・表に、氏名や連絡先などが写っていないか確認した
                </Checkbox>
              </div>
              <div id="report-documents-ack" className={ackClass("documentsAck")}>
                <Checkbox
                  checked={input.documentsAck}
                  onCheckedChange={(documentsAck) =>
                    update((current) => ({ ...current, documentsAck }))
                  }
                >
                  差し込んだ資料は、秘密保持契約に反しないことを確認した
                </Checkbox>
              </div>
            </>
          )}
          {checkRequired && (
            <div id="report-pdf-ack" className={ackClass("pdfValuesChecked")}>
              <Checkbox
                checked={input.pdfValuesChecked}
                onCheckedChange={(pdfValuesChecked) =>
                  update((current) => ({ ...current, pdfValuesChecked }))
                }
              >
                PDF読み取りで入った値を、元のPDFと照らし合わせて確かめた
              </Checkbox>
            </div>
          )}
          <ul className={rules}>
            <li>記事の内容は、実際に使用して観察した事実と感じた変化にもとづいています。</li>
            <li>
              農薬として登録されていない資材について、病害虫や雑草への効果を断定する表現は使っていません。
            </li>
            <li>記事・画像・PDFに、他者の権利や秘密保持契約に反するものは含まれていません。</li>
            <li>
              投稿はFarmille運営が内容を確認したうえで公開されます。確認の結果、修正をお願いすることがあります。
            </li>
          </ul>
          <div id="report-guideline-ack" className={ackClass("guidelineAck")}>
            <Checkbox
              checked={input.guidelineAck}
              onCheckedChange={(guidelineAck) =>
                update((current) => ({ ...current, guidelineAck }))
              }
            >
              投稿ガイドラインを確認し、上の内容に同意して公開します
            </Checkbox>
          </div>

          <div className={send}>
            <Button variant="primary" size="md" disabled={pending} onClick={submit}>
              {pending ? "送信しています…" : "投稿する"}
            </Button>
            {tried && missing.length > 0 && (
              <Notice tone="error" className={missingBox}>
                未記入の項目があります：
                {[...new Set(missing.map((check) => check.label))].join("、")}
                <br />
                <button
                  type="button"
                  className={missingLink}
                  onClick={() => {
                    const first = missing[0];
                    if (first !== undefined) focusTarget(first.target);
                  }}
                >
                  最初の未記入の項目へ
                </button>
              </Notice>
            )}
            {visibleFailure !== null && (
              <Notice tone="error" className={missingBox}>
                <span className={css({ whiteSpace: "pre-line" })}>{visibleFailure}</span>
              </Notice>
            )}
          </div>
        </div>

        {fileItem !== null && (
          <ReportItemFileDialog
            key={fileItem.item.id}
            item={fileItem.item}
            isNew={fileItem.isNew}
            userId={userId}
            reportId={input.reportId}
            imageLimit={reportImageRoom(input, items, fileItem.item.id)}
            onClose={() => setFileItem(null)}
            onDelete={(id) => {
              setItems((current) => {
                const rest = current.filter((item) => item.id !== id);
                return rest.length > 0 ? rest : itemsFromInput({ ...input, measurements: [] });
              });
              setFileItem(null);
            }}
            onCommit={(next) => {
              setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
              setFileItem(null);
            }}
          />
        )}
        {numericItem !== null && (
          <ReportNumericItemDialog
            key={numericItem.id}
            item={numericItem}
            plots={input.plots}
            layout={layout}
            onClose={() => setNumericItem(null)}
            onCommit={(next) => {
              setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
              setNumericItem(null);
            }}
          />
        )}
        <ReportPagePreview
          open={preview}
          onOpenChange={setPreview}
          input={input}
          items={items}
          title={title}
          materialName={currentMaterial.name}
          manufacturerName={currentMaterial.manufacturerName}
          cropName={cropName}
          authorName={authorName}
          documentUrls={documentUrls}
          missing={[...new Set(missing.map((check) => check.label))]}
        />
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
            onSelect: () => {
              // 遷移までの再描画でも、破棄した控えを作り直さない
              setSaved(JSON.stringify(payload));
              removePersisted(persistKey("report", reportPath));
              router.push(`/materials/${input.materialId}`);
            },
          }}
          pending={pending}
          action={() => persist(false, true)}
        />
        {readingOpen && remaining !== null && pdfReading.siteKey !== null && (
          <ReportPdfReadingDialog
            onClose={() => setReadingOpen(false)}
            defaultTrial={pdfReadingTrialDraft(
              cropName,
              input.varietyUnknown ? [] : input.varieties.map(({ name }) => name),
            )}
            materialId={input.materialId}
            userId={userId}
            siteKey={pdfReading.siteKey}
            remaining={remaining}
            input={payload}
            droppedMediaUrls={() => droppedMedia(payload)}
            replaces={reportPdfReadingReplaces(payload, items, currentMaterial.name)}
            onRead={applyReading}
          />
        )}
        <ReportToaster />
      </div>
    </ReportPdfReadingMarks>
  );
}
