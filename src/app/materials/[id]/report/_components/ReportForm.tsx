"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveUsageReportDraftAction,
  submitUsageReportAction,
  searchReportMaterialsAction,
} from "@/app/materials/[id]/report/new/actions";
import { ReviewCropPicker } from "@/app/materials/[id]/review/_components/ReviewCropPicker";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { UsageReportArticle } from "@/components/UsageReportArticle";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import {
  createBlankUsageReport,
  reportErrorStep,
  validateUsageReportSubmission,
  type UsageReportInput,
  type UsageReportFieldErrors,
} from "@/lib/usage-report";
import type { CropOption } from "@/server/queries/usage-report-form";
import type { PostingMaterial } from "@/server/queries/materials";
import { css } from "../../../../../../styled-system/css";
import { FieldLabel, FieldError } from "./FormUI";
import { ReportComparisonFields } from "./ReportComparisonFields";

const stack = css({ display: "grid", gap: "4" });
const row = css({ display: "flex", flexWrap: "wrap", gap: "2", alignItems: "center" });
const panel = css({
  p: "4",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
});
const steps = ["資材・作物", "結果", "栽培条件", "比較・使用結果", "写真・記事の確認"];
const resultExample =
  "定植後から2週間おきに、灌水と合わせて3回使いました。1回目の使用後は見た目で分かる変化はありませんでしたが、2回目の使用から数日後、午後の葉の萎れが使用前よりやや軽くなったように感じました。上の方の葉が立っていて、夕方まで樹勢を保つ株が増えたように見えます。3回目の後も同じ傾向でしたが、すべての株に明確な差があったわけではありません。\n収量が増えるような劇的な変化は確認できませんでしたが、暑い時期の萎れや樹勢低下を抑える補助としては手応えがありました。通常の灌水に足すだけなので手間はほとんど増えていません。薬害（葉焼け・変色）や生育の悪化は見られませんでした。次回は定植直後から使い、収量や裂果数も比べながらもう一度試したいと思います。";

export function ReportForm({
  material,
  userId,
  crops,
  effects,
  favoriteCropIds,
  materialCropIds,
  draft,
  prefectureCode,
  city,
  initialDocumentUrls = [],
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
  effects: { id: string; name: string }[];
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
  const [materialName, setMaterialName] = useState(material.name);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<UsageReportFieldErrors>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<PostingMaterial[]>([]);
  const closeDialog = useRef<HTMLDialogElement>(null);
  const dirty = JSON.stringify(input) !== saved;
  const busy = pending || uploading;
  useEffect(() => {
    if (!dirty || submitted) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, submitted]);
  function navigate(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function save(submit: boolean, close = false) {
    if (submit) {
      const missing = validateUsageReportSubmission(input);
      setErrors(missing);
      const first = Object.keys(missing)[0];
      if (first) {
        navigate(reportErrorStep(first));
        setMessage("未入力の項目を確認してください。");
        return;
      }
    }
    startTransition(async () => {
      try {
        const result = submit
          ? await submitUsageReportAction(input.materialId, input)
          : await saveUsageReportDraftAction(input.materialId, input);
        setMessage(result.message);
        if (!result.ok) {
          setErrors(result.fieldErrors);
          const first = Object.keys(result.fieldErrors)[0];
          if (first) navigate(reportErrorStep(first));
          return;
        }
        const savedInput = { ...input, expectedUpdatedAt: result.updatedAt };
        setInput(savedInput);
        setSaved(JSON.stringify(savedInput));
        setErrors({});
        if (result.status === "pending") setSubmitted(true);
        if (close) {
          closeDialog.current?.close();
          router.push(`/materials/${input.materialId}`);
        } else if (input.materialId !== material.id) {
          router.replace(`/materials/${input.materialId}/report/new`);
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "保存できませんでした。通信状態を確認して再度お試しください。",
        );
      }
    });
  }
  async function upload(
    file: File | undefined,
    section: UsageReportInput["media"][number]["section"],
    document: boolean,
  ) {
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
      setMessage(
        document
          ? "20MB以下のPDFを選んでください。"
          : "50MB以下のJPEG・PNG・WebP画像を選んでください。",
      );
      return;
    }
    if (document ? input.documents.length >= 10 : input.media.length >= 30) {
      setMessage(document ? "資料は10件まで添付できます。" : "写真は30枚まで添付できます。");
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
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ファイルを保存できませんでした。");
    } finally {
      setUploading(false);
    }
  }
  if (submitted)
    return (
      <section className={panel}>
        <h2>レポートを受け付けました</h2>
        <p>運営が内容を確認して公開します。修正をお願いする場合があります。</p>
        <a href={`/materials/${input.materialId}`}>資材ページに戻る</a>
      </section>
    );
  return (
    <form
      className={stack}
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 5) navigate(step + 1);
        else save(true);
      }}
    >
      <header className={stack}>
        <h1 className={css({ fontSize: "xl", fontWeight: "700" })}>実証詳細レポート</h1>
        <p>{materialName}</p>
        <div className={row}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => save(false)}
          >
            下書き保存
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              const missing = validateUsageReportSubmission(input);
              setMessage(
                Object.keys(missing).length
                  ? "未入力の項目があります。プレビューはこのまま確認できます。"
                  : "",
              );
              navigate(5);
            }}
          >
            プレビュー
          </Button>
          <button
            type="button"
            aria-label="レポートを閉じる"
            disabled={busy}
            onClick={() =>
              dirty
                ? closeDialog.current?.showModal()
                : router.push(`/materials/${input.materialId}`)
            }
          >
            ×
          </button>
        </div>
      </header>
      <nav aria-label="入力ステップ" className={row}>
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-current={step === index + 1 ? "step" : undefined}
            onClick={() => navigate(index + 1)}
            className={css({
              fontSize: "sm",
              p: "2",
              borderRadius: "button",
              _currentStep: { bg: "primary.200" },
            })}
          >
            {index + 1} {label}
          </button>
        ))}
      </nav>
      {message && (
        <p role="status" className={panel}>
          {message}
        </p>
      )}
      <fieldset disabled={busy} className={stack}>
        {step === 1 && (
          <>
            <FieldLabel required>対象資材</FieldLabel>
            <div className={panel}>
              {materialName}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                変更
              </Button>
            </div>
            {searchOpen && (
              <div className={stack}>
                <label>
                  資材を検索
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const result = await searchReportMaterialsAction(search);
                        if (result.ok) setMaterials(result.data);
                        else setMessage("資材を検索できませんでした。");
                      } catch {
                        setMessage("資材を検索できませんでした。通信状態を確認してください。");
                      }
                    })
                  }
                >
                  検索
                </Button>
                {materials.map((item) => (
                  <Button
                    type="button"
                    variant="ghost"
                    key={item.id}
                    onClick={() => {
                      setInput({ ...input, materialId: item.id });
                      setMaterialName(item.name);
                      setSearchOpen(false);
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            )}
            <FieldLabel required>使用作物</FieldLabel>
            <ReviewCropPicker
              crops={crops}
              selectedCropIds={input.cropId ? [input.cropId] : []}
              onAdd={(cropId) => setInput({ ...input, cropId })}
              onRemove={() => setInput({ ...input, cropId: null })}
              error={errors.cropId}
            />
            {[
              { title: "よく使う作物", ids: favoriteCropIds },
              {
                title: "この資材の作物",
                ids: input.materialId === material.id ? materialCropIds : [],
              },
            ]
              .filter((group) => group.ids.length)
              .map((group) => (
                <div key={group.title}>
                  <p>{group.title}</p>
                  <div className={row}>
                    {crops
                      .filter((crop) => group.ids.includes(crop.id))
                      .map((crop) => (
                        <Button
                          key={crop.id}
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setInput({ ...input, cropId: crop.id })}
                        >
                          {crop.name}
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            <FieldLabel htmlFor="report-variety">品種</FieldLabel>
            <Input
              id="report-variety"
              disabled={input.varietyUnknown}
              value={input.variety}
              onChange={(event) => setInput({ ...input, variety: event.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={input.varietyUnknown}
                onChange={(event) => setInput({ ...input, varietyUnknown: event.target.checked })}
              />{" "}
              品種が不明、または品種がない
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <FieldLabel required htmlFor="report-result">
              結果・感想
            </FieldLabel>
            <Textarea
              id="report-result"
              rows={10}
              value={input.observedChange}
              placeholder={resultExample}
              onChange={(event) => setInput({ ...input, observedChange: event.target.value })}
            />
            <FieldError message={errors.observedChange} />
            <p>使ってみて分かったこと、変化の有無、次回どうするかを記入してください。</p>
            <FieldLabel required>使用目的</FieldLabel>
            <p>期待した効果を選んでください（複数選択可）。</p>
            <div className={row}>
              {effects.map((effect) => (
                <Button
                  key={effect.id}
                  type="button"
                  size="sm"
                  variant={input.purposeTags.includes(effect.name) ? "primary" : "ghost"}
                  aria-pressed={input.purposeTags.includes(effect.name)}
                  onClick={() =>
                    setInput({
                      ...input,
                      purposeTags: input.purposeTags.includes(effect.name)
                        ? input.purposeTags.filter((name) => name !== effect.name)
                        : [...input.purposeTags, effect.name],
                    })
                  }
                >
                  {effect.name}
                </Button>
              ))}
            </div>
            <FieldError message={errors.purposeTags} />
          </>
        )}
        {step === 3 && (
          <>
            <FieldLabel htmlFor="report-prefecture">都道府県</FieldLabel>
            <Select
              id="report-prefecture"
              value={input.prefectureCode ?? ""}
              onChange={(event) =>
                setInput({
                  ...input,
                  prefectureCode: event.target.value ? Number(event.target.value) : null,
                })
              }
            >
              <option value="">未設定</option>
              {PREFECTURES.map((prefecture) => (
                <option key={prefecture.code} value={prefecture.code}>
                  {prefecture.name}
                </option>
              ))}
            </Select>
            <FieldLabel htmlFor="report-city">市区町村</FieldLabel>
            <Input
              id="report-city"
              value={input.city}
              onChange={(event) => setInput({ ...input, city: event.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={input.showCity}
                onChange={(event) => setInput({ ...input, showCity: event.target.checked })}
              />{" "}
              市区町村まで表示する
            </label>
            <FieldLabel required htmlFor="report-environment">
              栽培環境
            </FieldLabel>
            <Textarea
              id="report-environment"
              value={input.cultivationEnvironment}
              placeholder="例：露地栽培。黒マルチを敷き、雨よけはしていません。"
              onChange={(event) =>
                setInput({ ...input, cultivationEnvironment: event.target.value })
              }
            />
            <p>
              例：パイプハウスで土耕栽培。無加温で、灌水チューブで週2回かん水しています。／ガラス温室で養液栽培。暖房機で最低夜温12℃を保っています。
            </p>
            <FieldError message={errors.cultivationEnvironment} />
            <FieldLabel required>施用時期</FieldLabel>
            <div className={row}>
              {APPLICATION_TIMINGS.map((timing, index) => (
                <Button
                  key={timing}
                  type="button"
                  size="sm"
                  variant={input.timingStages.includes(index) ? "primary" : "ghost"}
                  aria-pressed={input.timingStages.includes(index)}
                  onClick={() =>
                    setInput({
                      ...input,
                      timingStages: input.timingStages.includes(index)
                        ? input.timingStages.filter((stage) => stage !== index)
                        : [...input.timingStages, index].sort((a, b) => a - b),
                    })
                  }
                >
                  {timing}
                </Button>
              ))}
            </div>
            <FieldError message={errors.timingStages} />
            <label>
              処理日・定植日・生育状況（必須）
              <Textarea
                value={input.timingNote}
                placeholder="3月6日に定植。開花してすぐの6月5日に施用。7日おきに3回。"
                onChange={(event) => setInput({ ...input, timingNote: event.target.value })}
              />
            </label>
            <p>処理日（資材を使った日）は必ず記入してください。</p>
            <FieldError message={errors.timingNote} />
            {input.timingNote &&
              !/\d{1,2}(?:月\s*\d{1,2}日|[/-]\d{1,2})/.test(input.timingNote) && (
                <p role="status">
                  処理日が見当たりません。資材を使った日を記入したか確認してください。
                </p>
              )}
          </>
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
        {step === 5 && (
          <>
            <h2>
              {materialName} 実証詳細レポート｜
              {crops.find((crop) => crop.id === input.cropId)?.name ?? "作物未選択"}
            </h2>
            <p>見出しと本文はここで編集できます。写真は各節に挿入してください。</p>
            <UsageReportArticle
              input={input}
              documentUrls={documentUrls}
              onChange={setInput}
              renderSectionTools={(section) => (
                <label>
                  ＋ 写真を挿入
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      void upload(event.target.files?.[0], section, false);
                      event.target.value = "";
                    }}
                  />
                </label>
              )}
            />
            <FieldLabel>関連資料（PDF）</FieldLabel>
            <input
              aria-label="関連資料を添付"
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                void upload(event.target.files?.[0], "documents", true);
                event.target.value = "";
              }}
            />
            {input.documents.map((document) => (
              <div key={document.id} className={row}>
                <span>{document.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setInput({
                      ...input,
                      documents: input.documents.filter((item) => item.id !== document.id),
                    })
                  }
                >
                  資料を削除
                </button>
              </div>
            ))}
            {input.documents.length > 0 && (
              <label>
                <input
                  type="checkbox"
                  checked={input.documentsAck}
                  onChange={(event) => setInput({ ...input, documentsAck: event.target.checked })}
                />{" "}
                秘密保持契約などに反する資料を含みません（必須）
                <FieldError message={errors.documentsAck} />
              </label>
            )}
            <section className={panel}>
              <h3>公開前の確認</h3>
              <ul>
                <li>観察した事実にもとづいて記入してください。</li>
                <li>未登録資材の病害虫・雑草への効果を断定しないでください。</li>
                <li>他者の権利・秘密保持に反する内容を含めないでください。</li>
                <li>運営が確認して公開します。修正をお願いする場合があります。</li>
              </ul>
            </section>
            <label>
              <input
                type="checkbox"
                checked={input.guidelineAck}
                onChange={(event) => setInput({ ...input, guidelineAck: event.target.checked })}
              />{" "}
              <a href="/legal/posting" target="_blank" rel="noreferrer">
                投稿ガイドライン
              </a>
              を確認し、上の内容に同意して公開します（必須）
            </label>
            <FieldError message={errors.guidelineAck} />
          </>
        )}
      </fieldset>
      <footer className={row}>
        {step > 1 && (
          <Button type="button" variant="ghost" disabled={busy} onClick={() => navigate(step - 1)}>
            戻る
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "保存しています…" : step === 5 ? "公開に進む" : "次へ"}
        </Button>
      </footer>
      <dialog
        ref={closeDialog}
        className={css({
          m: "auto",
          maxW: "full",
          p: "5",
          borderRadius: "card",
          bg: "surface.card",
        })}
      >
        <div className={stack}>
          <p>入力途中の内容を下書きに保存しますか？</p>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              closeDialog.current?.close();
              router.push(`/materials/${input.materialId}`);
            }}
          >
            保存せずに閉じる
          </Button>
          <Button type="button" variant="ghost" onClick={() => closeDialog.current?.close()}>
            入力に戻る
          </Button>
          <Button type="button" disabled={busy} onClick={() => save(false, true)}>
            下書きを保存して閉じる
          </Button>
        </div>
      </dialog>
    </form>
  );
}
