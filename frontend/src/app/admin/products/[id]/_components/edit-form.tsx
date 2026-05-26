"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type {
  AdminMakerOption,
  AdminProductDetail,
  AdminProductRelationItem,
  AdminProductUpdatePayload,
  CertificationOption,
  ProductBenefitOption,
} from "@/types/admin";

// spec admin-aglist-alignment-v2.md §3.2 v1 必達 編集フォーム (Client Island)。
// 基本フィールド + is_public toggle + confidence read-only + v1 必達 3 種 relation。
// maker_id / product_type_id は v1 では read-only (backend AdminProductUpdatePayload は
// maker_id を受け付けない、商品の所属メーカー変更は audit 観点で v1.5+)。
// 画像 / 残 5 relation の編集は §1.2 で Follow-ups に push 済。

type CropOption = { id: string; name: string; category: string };

const COMMERCIAL_STATUS_OPTIONS = [
  { value: "", label: "未設定" },
  { value: "available", label: "available (販売中)" },
  { value: "discontinued", label: "discontinued (販売終了)" },
  { value: "pre-launch", label: "pre-launch (販売前)" },
];

const CONFIDENCE_OPTIONS = ["高", "中", "低", "要確認"];

export function ProductEditForm({
  product,
  makers,
  cropOptions,
  certifications,
  benefits,
}: {
  product: AdminProductDetail;
  makers: AdminMakerOption[];
  cropOptions: CropOption[];
  certifications: CertificationOption[];
  benefits: ProductBenefitOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── 基本フィールド state
  const [name, setName] = useState(product.name);
  const [productNameJp, setProductNameJp] = useState(
    product.product_name_jp ?? "",
  );
  const [commercialStatus, setCommercialStatus] = useState(
    product.commercial_status ?? "",
  );
  const [isPublic, setIsPublic] = useState(product.is_public);

  // ── 説明
  const [generalPurpose, setGeneralPurpose] = useState(
    product.general_purpose ?? "",
  );
  const [primaryCompound, setPrimaryCompound] = useState(
    product.primary_compound ?? "",
  );
  const [modeOfAction, setModeOfAction] = useState(product.mode_of_action ?? "");
  const [technologyAction, setTechnologyAction] = useState(
    product.technology_action ?? "",
  );
  const [diseasePestInfo, setDiseasePestInfo] = useState(
    product.disease_pest_info ?? "",
  );
  const [expectedEffectsOfficial, setExpectedEffectsOfficial] = useState(
    product.expected_effects_official ?? "",
  );
  const [expectedEffectsFarmille, setExpectedEffectsFarmille] = useState(
    product.expected_effects_farmille ?? "",
  );

  // ── 使用
  const [usageSummary, setUsageSummary] = useState(product.usage_summary ?? "");
  const [precautions, setPrecautions] = useState(product.precautions ?? "");
  const [storageShelfLife, setStorageShelfLife] = useState(
    product.storage_shelf_life ?? "",
  );
  const [notes, setNotes] = useState(product.notes ?? "");

  // ── 認証 (boolean 単独)
  const [fertilizerRegistered, setFertilizerRegistered] = useState(
    product.fertilizer_registered ?? false,
  );
  const [pesticideRegistered, setPesticideRegistered] = useState(
    product.pesticide_registered ?? false,
  );

  // ── ファイル URL
  const [labelUrl, setLabelUrl] = useState(product.label_url ?? "");
  const [sdsUrl, setSdsUrl] = useState(product.sds_url ?? "");

  // ── v1 必達 3 種 relation (id Set で管理)
  const [cropIds, setCropIds] = useState<Set<string>>(
    () => new Set(product.crops.map((x) => x.id)),
  );
  const [certificationIds, setCertificationIds] = useState<Set<string>>(
    () => new Set(product.certifications.map((x) => x.id)),
  );
  const [benefitIds, setBenefitIds] = useState<Set<string>>(
    () => new Set(product.benefits.map((x) => x.id)),
  );

  // benefits の category grouping
  const benefitsByCategory = useMemo(() => {
    const map = new Map<string, ProductBenefitOption[]>();
    for (const b of benefits) {
      const key = b.category ?? "その他";
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [benefits]);

  // crops の category grouping (L1 / L2 で flat、まとめは category 文字列で identity)
  const cropsByCategory = useMemo(() => {
    const map = new Map<string, CropOption[]>();
    for (const c of cropOptions) {
      const arr = map.get(c.category) ?? [];
      arr.push(c);
      map.set(c.category, arr);
    }
    return Array.from(map.entries());
  }, [cropOptions]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const payload: AdminProductUpdatePayload = {
      name: name.trim(),
      product_name_jp: productNameJp.trim() || null,
      product_type_id: product.product_type_id, // v1 編集不可
      commercial_status: commercialStatus || null,
      is_public: isPublic,
      general_purpose: generalPurpose.trim() || null,
      primary_compound: primaryCompound.trim() || null,
      mode_of_action: modeOfAction.trim() || null,
      technology_action: technologyAction.trim() || null,
      disease_pest_info: diseasePestInfo.trim() || null,
      expected_effects_official: expectedEffectsOfficial.trim() || null,
      expected_effects_farmille: expectedEffectsFarmille.trim() || null,
      usage_summary: usageSummary.trim() || null,
      precautions: precautions.trim() || null,
      storage_shelf_life: storageShelfLife.trim() || null,
      notes: notes.trim() || null,
      confidence: product.confidence, // read-only
      fertilizer_registered: fertilizerRegistered,
      pesticide_registered: pesticideRegistered,
      label_url: labelUrl.trim() || null,
      sds_url: sdsUrl.trim() || null,
      crop_ids: Array.from(cropIds),
      certification_ids: Array.from(certificationIds),
      benefit_ids: Array.from(benefitIds),
      images: null, // v1 編集 UI 無し、既存 product_images を不触
    };

    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          messageFromError(body?.error, "保存に失敗しました") +
            (res.status === 401 ? " (再ログインまたは MFA が必要)" : ""),
        );
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
      startTransition(() => router.refresh());
    } catch {
      setError("保存に失敗しました (ネットワーク)");
      setSubmitting(false);
    }
  }

  function toggleSet(
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const makerLabel =
    makers.find((m) => m.user_id === product.maker_id)?.company_name ??
    makers.find((m) => m.user_id === product.maker_id)?.name ??
    product.maker_name ??
    "—";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本 */}
      <Section title="基本">
        <Field label="name (必須)" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
            className={inputClass}
          />
        </Field>

        <Field label="和名 (product_name_jp)">
          <input
            type="text"
            value={productNameJp}
            onChange={(e) => setProductNameJp(e.target.value)}
            maxLength={200}
            className={inputClass}
          />
        </Field>

        <Field label="メーカー (read-only / v1 編集不可)">
          <div className="rounded border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
            {makerLabel}
          </div>
          <p className="text-xs text-muted-foreground">
            所属メーカー変更は v1.5+ で audit 付きで対応予定。
          </p>
        </Field>

        <Field label="製品種別 (read-only / v1 編集不可)">
          <div className="rounded border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
            {product.product_type_name ?? "—"}
          </div>
        </Field>

        <Field label="流通状態 (commercial_status)">
          <select
            value={commercialStatus}
            onChange={(e) => setCommercialStatus(e.target.value)}
            className={inputClass}
          >
            {COMMERCIAL_STATUS_OPTIONS.map((o) => (
              <option key={o.value || "_unset"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="公開フラグ (is_public)">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-border"
            />
            <span>公開する</span>
          </label>
          <p className="text-xs text-muted-foreground">
            DEFAULT 非公開。confidence と直交する別概念。
          </p>
        </Field>

        <Field label="confidence (read-only / 内部品質管理)">
          <select
            value={product.confidence ?? ""}
            disabled
            className={inputClass + " opacity-70"}
          >
            <option value="">—</option>
            {CONFIDENCE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            UI 上は read-only。SQL 直で書き換える運用 (v1 仕様 / Q-D)。
          </p>
        </Field>
      </Section>

      {/* 説明 */}
      <Section title="説明">
        <Field label="general_purpose (用途・効能の自由記述)" wide>
          <textarea
            value={generalPurpose}
            onChange={(e) => setGeneralPurpose(e.target.value)}
            rows={3}
            maxLength={2000}
            className={inputClass}
          />
        </Field>

        <Field label="primary_compound (主要成分)">
          <input
            type="text"
            value={primaryCompound}
            onChange={(e) => setPrimaryCompound(e.target.value)}
            maxLength={500}
            className={inputClass}
          />
        </Field>

        <Field label="mode_of_action (作用機序)" wide>
          <textarea
            value={modeOfAction}
            onChange={(e) => setModeOfAction(e.target.value)}
            rows={3}
            maxLength={2000}
            className={inputClass}
          />
        </Field>

        <Field label="technology_action (技術原理)" wide>
          <textarea
            value={technologyAction}
            onChange={(e) => setTechnologyAction(e.target.value)}
            rows={3}
            maxLength={2000}
            className={inputClass}
          />
        </Field>

        <Field label="disease_pest_info (対象病害虫情報)" wide>
          <textarea
            value={diseasePestInfo}
            onChange={(e) => setDiseasePestInfo(e.target.value)}
            rows={3}
            maxLength={2000}
            className={inputClass}
          />
        </Field>

        <Field label="expected_effects_official (メーカー公式効果)" wide>
          <textarea
            value={expectedEffectsOfficial}
            onChange={(e) => setExpectedEffectsOfficial(e.target.value)}
            rows={3}
            maxLength={4000}
            className={inputClass}
          />
        </Field>

        <Field label="expected_effects_farmille (Farmille 平易翻訳)" wide>
          <textarea
            value={expectedEffectsFarmille}
            onChange={(e) => setExpectedEffectsFarmille(e.target.value)}
            rows={3}
            maxLength={2000}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* 使用 */}
      <Section title="使用">
        <Field label="usage_summary (使い方サマリ)" wide>
          <textarea
            value={usageSummary}
            onChange={(e) => setUsageSummary(e.target.value)}
            rows={3}
            maxLength={4000}
            className={inputClass}
          />
        </Field>

        <Field label="precautions (注意事項)" wide>
          <textarea
            value={precautions}
            onChange={(e) => setPrecautions(e.target.value)}
            rows={3}
            maxLength={4000}
            className={inputClass}
          />
        </Field>

        <Field label="storage_shelf_life (保存条件・有効期間)">
          <input
            type="text"
            value={storageShelfLife}
            onChange={(e) => setStorageShelfLife(e.target.value)}
            maxLength={500}
            className={inputClass}
          />
        </Field>

        <Field label="notes (その他メモ)" wide>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={2000}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* 認証 */}
      <Section title="認証">
        <Field label="肥料登録">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fertilizerRegistered}
              onChange={(e) => setFertilizerRegistered(e.target.checked)}
              className="rounded border-border"
            />
            <span>fertilizer_registered = true</span>
          </label>
        </Field>

        <Field label="農薬登録">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pesticideRegistered}
              onChange={(e) => setPesticideRegistered(e.target.checked)}
              className="rounded border-border"
            />
            <span>pesticide_registered = true</span>
          </label>
        </Field>

        <Field label="認証マスタ (certifications)" wide>
          <RelationMultiSelect
            items={certifications.map((c) => ({ id: c.id, label: c.name }))}
            selected={certificationIds}
            onToggle={(id) => toggleSet(setCertificationIds, id)}
          />
        </Field>
      </Section>

      {/* 関連 (v1 必達 3 種のうち crops と benefits) */}
      <Section title="関連 (v1 必達)">
        <Field label="対象作物 (crops)" wide>
          <RelationGroupedMultiSelect
            groups={cropsByCategory.map(([cat, items]) => ({
              category: cat,
              items: items.map((c) => ({ id: c.id, label: c.name })),
            }))}
            selected={cropIds}
            onToggle={(id) => toggleSet(setCropIds, id)}
            emptyHint="approved crops が存在しません。"
          />
        </Field>

        <Field label="効果 (benefits, JBSA 25 項目)" wide>
          <RelationGroupedMultiSelect
            groups={benefitsByCategory.map(([cat, items]) => ({
              category: cat,
              items: items.map((b) => ({ id: b.id, label: b.name })),
            }))}
            selected={benefitIds}
            onToggle={(id) => toggleSet(setBenefitIds, id)}
          />
        </Field>
      </Section>

      {/* ファイル */}
      <Section title="ファイル URL (v1 は外部 URL 直入力のみ)">
        <Field label="label_url (商品ラベル)" wide>
          <input
            type="url"
            value={labelUrl}
            onChange={(e) => setLabelUrl(e.target.value)}
            maxLength={500}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>

        <Field label="sds_url (SDS)" wide>
          <input
            type="url"
            value={sdsUrl}
            onChange={(e) => setSdsUrl(e.target.value)}
            maxLength={500}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Storage 経由 upload UI は v1.5+ (spec §6 R4 / F-FU5)。
        </p>
      </Section>

      {/* 既存画像 read-only (編集 UI は v1.5+) */}
      <Section title="既存画像 (read-only)">
        {product.images.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            登録された画像はありません。
          </p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {product.images.map((img) => (
              <li
                key={img.id}
                className="space-y-1 rounded border border-border p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text ?? ""}
                  className="w-full aspect-square object-cover rounded"
                />
                <p className="text-[10px] text-muted-foreground truncate">
                  {img.image_type ?? "—"}
                  {img.is_primary ? " · primary" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          画像の追加 / 並べ替え UI は v1.5+ (spec §1.2 / §7 F-FU12)。
        </p>
      </Section>

      {/* Selected summary + Submit */}
      <SelectedSummary
        crops={selectedItems(cropOptions, cropIds, (c) => c.name)}
        certifications={selectedItems(
          certifications,
          certificationIds,
          (c) => c.name,
        )}
        benefits={selectedItems(benefits, benefitIds, (b) => b.name)}
      />

      <div className="flex items-center gap-3 sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-3">
        <Button
          type="submit"
          disabled={submitting || isPending}
          className="min-w-[120px]"
        >
          {submitting ? "保存中…" : isPending ? "再読み込み…" : "保存"}
        </Button>
        {success ? (
          <span className="text-sm text-emerald-600" role="status">
            保存しました
          </span>
        ) : null}
        {error ? (
          <span className="text-sm text-destructive" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-md border border-border bg-card p-5">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={"space-y-1 " + (wide ? "md:col-span-2" : "")}
    >
      <span className="block text-xs text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

type RelationLite = { id: string; label: string };

function RelationMultiSelect({
  items,
  selected,
  onToggle,
}: {
  items: RelationLite[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">該当マスタがありません。</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = selected.has(it.id);
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onToggle(it.id)}
            className={
              "rounded-full border px-3 py-1 text-xs transition-colors " +
              (active
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-foreground hover:bg-muted")
            }
            aria-pressed={active}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function RelationGroupedMultiSelect({
  groups,
  selected,
  onToggle,
  emptyHint = "該当マスタがありません。",
}: {
  groups: { category: string; items: RelationLite[] }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  emptyHint?: string;
}) {
  if (groups.length === 0 || groups.every((g) => g.items.length === 0)) {
    return <p className="text-xs text-muted-foreground">{emptyHint}</p>;
  }
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.category} className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {g.category}
          </p>
          <RelationMultiSelect
            items={g.items}
            selected={selected}
            onToggle={onToggle}
          />
        </div>
      ))}
    </div>
  );
}

function SelectedSummary({
  crops,
  certifications,
  benefits,
}: {
  crops: AdminProductRelationItem[];
  certifications: AdminProductRelationItem[];
  benefits: AdminProductRelationItem[];
}) {
  return (
    <section
      aria-label="選択中の関連"
      className="space-y-2 rounded-md border border-dashed border-border bg-muted/20 p-4 text-xs"
    >
      <p className="text-muted-foreground">
        選択中: crops {crops.length} 件 / certifications {certifications.length}{" "}
        件 / benefits {benefits.length} 件
      </p>
    </section>
  );
}

function selectedItems<T extends { id: string }>(
  source: T[],
  selected: Set<string>,
  getName: (item: T) => string,
): AdminProductRelationItem[] {
  return source
    .filter((s) => selected.has(s.id))
    .map((s) => ({ id: s.id, name: getName(s), category: null }));
}

function messageFromError(code: unknown, fallback: string): string {
  if (typeof code !== "string") return fallback;
  switch (code) {
    case "product_not_found":
      return "対象 product が見つかりません";
    case "not_admin":
      return "権限がありません";
    case "unauthorized":
      return "ログインが必要です";
    case "aal_insufficient":
      return "MFA が完了していません (/mfa/challenge へ)";
    default:
      return fallback;
  }
}
