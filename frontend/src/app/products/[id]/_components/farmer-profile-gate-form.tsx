"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PREFECTURES } from "@/lib/data/prefectures";
import {
  CropPicker,
  type CategoryL1,
  type CategoryL2,
  type Crop,
} from "@/app/onboarding/farmer/_components/crop-picker";

type Props = {
  crops: Crop[];
  categoriesL1: CategoryL1[];
  categoriesL2: CategoryL2[];
  onComplete: () => void;
};

export function FarmerProfileGateForm({
  crops,
  categoriesL1,
  categoriesL2,
  onComplete,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setFieldErrors({});

    const prefecture = (formData.get("prefecture") as string | null) ?? "";
    const city = ((formData.get("city") as string | null) ?? "").trim();

    const next: Record<string, string> = {};
    if (!prefecture) next.prefecture = "都道府県を選択してください";
    if (!city) next.city = "市町村を入力してください";
    else if (city.length > 50) next.city = "市町村は50文字以内で入力してください";
    if (selectedCrops.length === 0)
      next.crop_ids = "作目を1件以上選択してください";

    if (Object.keys(next).length > 0) {
      setFieldErrors(next);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/onboarding/farmer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefecture,
          city,
          field_size: null,
          note: null,
          crop_ids: selectedCrops,
        }),
      });

      if (res.status === 401) {
        router.push("/login?expired=1");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body?.error
            ? `登録に失敗しました (${body.error})`
            : "登録に失敗しました。時間をおいて再度お試しください",
        );
        return;
      }

      onComplete();
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prefecture">
          都道府県 <span className="text-error">*</span>
        </Label>
        <select
          id="prefecture"
          name="prefecture"
          className="flex h-11 w-full rounded-sm border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          defaultValue=""
          aria-invalid={Boolean(fieldErrors.prefecture)}
        >
          <option value="">選択してください</option>
          {PREFECTURES.map((pref) => (
            <option key={pref} value={pref}>
              {pref}
            </option>
          ))}
        </select>
        {fieldErrors.prefecture && (
          <p className="text-sm text-error">{fieldErrors.prefecture}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">
          市町村 <span className="text-error">*</span>
        </Label>
        <Input
          id="city"
          name="city"
          type="text"
          maxLength={50}
          required
          autoComplete="address-level2"
          aria-invalid={Boolean(fieldErrors.city)}
        />
        {fieldErrors.city && (
          <p className="text-sm text-error">{fieldErrors.city}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          作目 <span className="text-error">*</span>
        </Label>
        <CropPicker
          crops={crops}
          categoriesL1={categoriesL1}
          categoriesL2={categoriesL2}
          selected={selectedCrops}
          onChange={setSelectedCrops}
        />
        {fieldErrors.crop_ids && (
          <p className="text-sm text-error">{fieldErrors.crop_ids}</p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-sm border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={isPending}
        loadingText="保存中…"
        className="w-full"
      >
        プロフィールを保存して次へ
      </Button>
    </form>
  );
}
