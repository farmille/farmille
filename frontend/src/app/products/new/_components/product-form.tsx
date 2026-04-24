"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  CropPicker,
  type CategoryL1,
  type CategoryL2,
  type Crop,
} from "@/app/onboarding/farmer/_components/crop-picker";
import { TagMultiSelect, type TagItem } from "./tag-multi-select";
import { ProductImageUpload } from "./product-image-upload";

type ProductType = { id: string; name: string };
type Benefit = {
  id: string;
  name: string;
  category: string;
  sort_order: number;
};
type Certification = { id: string; name: string };

type Props = {
  productTypes: ProductType[];
  benefits: Benefit[];
  certifications: Certification[];
  crops: Crop[];
  categoriesL1: CategoryL1[];
  categoriesL2: CategoryL2[];
};

const COMMERCIAL_STATUS_OPTIONS = [
  { value: "販売中", label: "販売中" },
  { value: "準備中", label: "準備中" },
  { value: "販売終了", label: "販売終了" },
];

type ErrorCode =
  | "invalid_body"
  | "unauthorized"
  | "forbidden"
  | "image_upload_failed"
  | "unknown";

function errorMessage(code: ErrorCode): string {
  switch (code) {
    case "invalid_body":
      return "入力内容を確認してください";
    case "unauthorized":
      return "ログインが必要です";
    case "forbidden":
      return "この操作を行う権限がありません";
    case "image_upload_failed":
      return "画像のアップロードに失敗しました。時間をおいて再度お試しください";
    default:
      return "登録に失敗しました。時間をおいて再度お試しください";
  }
}

export function ProductForm({
  productTypes,
  benefits,
  certifications,
  crops,
  categoriesL1,
  categoriesL2,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [generalPurpose, setGeneralPurpose] = useState("");
  const [primaryCompound, setPrimaryCompound] = useState("");
  const [modeOfAction, setModeOfAction] = useState("");
  const [commercialStatus, setCommercialStatus] = useState("");
  const [labelUrl, setLabelUrl] = useState("");
  const [sdsUrl, setSdsUrl] = useState("");
  const [benefitIds, setBenefitIds] = useState<string[]>([]);
  const [cropIds, setCropIds] = useState<string[]>([]);
  const [certificationIds, setCertificationIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const benefitItems: TagItem[] = benefits.map((b) => ({
    id: b.id,
    name: b.name,
    group: b.category,
  }));
  const certItems: TagItem[] = certifications.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  async function uploadImages(
    supabase: ReturnType<typeof createClient>,
    userId: string,
  ): Promise<string[]> {
    const nonce = crypto.randomUUID();
    const urls: string[] = [];
    for (const [idx, file] of files.entries()) {
      const path = `${userId}/pending/${nonce}_${idx}_${file.name}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErrorCode(null);
    setFieldErrors({});

    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) errs.name = "製品名を入力してください";
    else if (trimmedName.length > 100)
      errs.name = "製品名は 100 文字以内で入力してください";
    if (!productTypeId) errs.product_type_id = "タイプを選択してください";
    if (generalPurpose.length > 500)
      errs.general_purpose = "一般用途は 500 文字以内で入力してください";
    if (primaryCompound.length > 200)
      errs.primary_compound = "主成分は 200 文字以内で入力してください";
    if (modeOfAction.length > 500)
      errs.mode_of_action = "作用機序は 500 文字以内で入力してください";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    let imageUrls: string[] = [];
    try {
      if (files.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setErrorCode("unauthorized");
          setSubmitting(false);
          return;
        }
        try {
          imageUrls = await uploadImages(supabase, user.id);
        } catch {
          setErrorCode("image_upload_failed");
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          product_type_id: productTypeId,
          general_purpose: generalPurpose || null,
          primary_compound: primaryCompound || null,
          mode_of_action: modeOfAction || null,
          commercial_status: commercialStatus || null,
          label_url: labelUrl || null,
          sds_url: sdsUrl || null,
          benefit_ids: benefitIds,
          crop_ids: cropIds,
          certification_ids: certificationIds,
          image_urls: imageUrls,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (res.status === 401) setErrorCode("unauthorized");
        else if (res.status === 403) setErrorCode("forbidden");
        else if (res.status === 400 || res.status === 422)
          setErrorCode("invalid_body");
        else setErrorCode((data.error as ErrorCode) ?? "unknown");
        setSubmitting(false);
        return;
      }

      router.push("/maker/products");
      router.refresh();
    } catch {
      setErrorCode("unknown");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorCode && (
        <p className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {errorMessage(errorCode)}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          製品名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          disabled={submitting}
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name && (
          <p className="text-sm text-destructive">{fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_type_id">
          タイプ <span className="text-destructive">*</span>
        </Label>
        <select
          id="product_type_id"
          value={productTypeId}
          onChange={(e) => setProductTypeId(e.target.value)}
          disabled={submitting}
          className={cn(
            "flex h-11 w-full rounded-sm border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <option value="">選択してください</option>
          {productTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {fieldErrors.product_type_id && (
          <p className="text-sm text-destructive">
            {fieldErrors.product_type_id}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="general_purpose">一般用途</Label>
        <Textarea
          id="general_purpose"
          value={generalPurpose}
          onChange={(e) => setGeneralPurpose(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={submitting}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary_compound">主成分</Label>
          <Input
            id="primary_compound"
            value={primaryCompound}
            onChange={(e) => setPrimaryCompound(e.target.value)}
            maxLength={200}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="commercial_status">販売状況</Label>
          <select
            id="commercial_status"
            value={commercialStatus}
            onChange={(e) => setCommercialStatus(e.target.value)}
            disabled={submitting}
            className={cn(
              "flex h-11 w-full rounded-sm border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <option value="">未選択</option>
            {COMMERCIAL_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode_of_action">作用機序</Label>
        <Textarea
          id="mode_of_action"
          value={modeOfAction}
          onChange={(e) => setModeOfAction(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={submitting}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="label_url">ラベル URL</Label>
          <Input
            id="label_url"
            type="url"
            value={labelUrl}
            onChange={(e) => setLabelUrl(e.target.value)}
            maxLength={500}
            disabled={submitting}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sds_url">SDS URL</Label>
          <Input
            id="sds_url"
            type="url"
            value={sdsUrl}
            onChange={(e) => setSdsUrl(e.target.value)}
            maxLength={500}
            disabled={submitting}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>効果タグ(任意、最大 25 件)</Label>
        <TagMultiSelect
          items={benefitItems}
          selected={benefitIds}
          onChange={setBenefitIds}
          placeholder="効果タグを選択"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label>対象作目(任意、最大 50 件)</Label>
        <CropPicker
          crops={crops}
          categoriesL1={categoriesL1}
          categoriesL2={categoriesL2}
          selected={cropIds}
          onChange={setCropIds}
        />
      </div>

      <div className="space-y-2">
        <Label>認証(任意、最大 10 件)</Label>
        <TagMultiSelect
          items={certItems}
          selected={certificationIds}
          onChange={setCertificationIds}
          placeholder="認証を選択"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label>画像(任意、最大 5 枚)</Label>
        <ProductImageUpload
          files={files}
          onChange={setFiles}
          disabled={submitting}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "登録中…" : "資材を登録"}
        </Button>
      </div>
    </form>
  );
}
