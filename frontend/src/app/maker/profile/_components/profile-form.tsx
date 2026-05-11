"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PREFECTURES } from "@/lib/data/prefectures";

export type MakerProfileInitial = {
  company_name: string;
  prefecture: string | null;
  city: string | null;
  note: string | null;
};

export function ProfileForm({ initial }: { initial: MakerProfileInitial }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    const companyName = (formData.get("company_name") as string | null)?.trim();
    const prefecture = ((formData.get("prefecture") as string | null) ?? "").trim();
    const city = ((formData.get("city") as string | null) ?? "").trim();
    const note = ((formData.get("note") as string | null) ?? "").trim();

    const next: Record<string, string> = {};
    if (!companyName) next.company_name = "企業名を入力してください";
    else if (companyName.length > 100)
      next.company_name = "企業名は100文字以内で入力してください";
    if (prefecture && prefecture.length > 20)
      next.prefecture = "都道府県は20文字以内で入力してください";
    if (city && city.length > 50)
      next.city = "市町村は50文字以内で入力してください";
    if (note && note.length > 1000)
      next.note = "事業概要は1000文字以内で入力してください";

    if (Object.keys(next).length > 0) {
      setFieldErrors(next);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/maker/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          prefecture: prefecture || null,
          city: city || null,
          note: note || null,
        }),
      });

      if (res.status === 401) {
        router.push("/login?expired=1");
        return;
      }
      if (res.status === 404) {
        router.replace("/onboarding/maker");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body?.error
            ? `保存に失敗しました (${body.error})`
            : "保存に失敗しました。時間をおいて再度お試しください",
        );
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5" data-testid="profile-form">
      <div className="space-y-2">
        <Label htmlFor="company_name">
          企業名 <span className="text-error">*</span>
        </Label>
        <Input
          id="company_name"
          name="company_name"
          type="text"
          maxLength={100}
          required
          autoComplete="organization"
          defaultValue={initial.company_name}
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.company_name)}
        />
        {fieldErrors.company_name && (
          <p className="text-sm text-error">{fieldErrors.company_name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefecture">都道府県</Label>
        <select
          id="prefecture"
          name="prefecture"
          className="flex h-11 w-full rounded-sm border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={initial.prefecture ?? ""}
          disabled={isPending}
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
        <Label htmlFor="city">市町村</Label>
        <Input
          id="city"
          name="city"
          type="text"
          maxLength={50}
          autoComplete="address-level2"
          defaultValue={initial.city ?? ""}
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.city)}
        />
        {fieldErrors.city && (
          <p className="text-sm text-error">{fieldErrors.city}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">事業概要</Label>
        <Textarea
          id="note"
          name="note"
          maxLength={1000}
          rows={6}
          defaultValue={initial.note ?? ""}
          disabled={isPending}
        />
        {fieldErrors.note && (
          <p className="text-sm text-error">{fieldErrors.note}</p>
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

      {success && (
        <div
          role="status"
          className="rounded-sm border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
        >
          保存しました
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          loading={isPending}
          loadingText="保存中..."
          className="w-full"
        >
          保存する
        </Button>
      </div>
    </form>
  );
}
