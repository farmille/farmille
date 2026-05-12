"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PREFECTURES } from "@/lib/data/prefectures";
import type { MeProfile } from "../../_components/profile-card";
import { AvatarUpload } from "./avatar-upload";

// Phase 19 プロフィール編集フォーム (spec §6.2)。
// - フィールド: display_name / bio / avatar_url / prefecture / city / field_size / note
// - prefecture / city は必須、それ以外は任意
// - submit は /api/me/profile (PUT) → backend /v1/me/profile

const FIELD_LIMITS = {
  display_name: 50,
  bio: 500,
  city: 50,
  note: 1000,
} as const;

type Props = {
  profile: MeProfile;
};

export function ProfileForm({ profile }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // avatar_url は state で持つ。null = 「現在の avatar を削除する意思」
  // undefined = 「変更なし (= 既存値を維持)」
  const [pendingAvatar, setPendingAvatar] = useState<string | null | undefined>(
    undefined,
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setFieldErrors({});

    const display_name =
      ((formData.get("display_name") as string | null) ?? "").trim() || null;
    const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;
    const prefecture = (formData.get("prefecture") as string | null) ?? "";
    const city = ((formData.get("city") as string | null) ?? "").trim();
    const fieldSizeRaw = (formData.get("field_size") as string | null) ?? "";
    const note =
      ((formData.get("note") as string | null) ?? "").trim() || null;

    const next: Record<string, string> = {};
    if (!prefecture) next.prefecture = "都道府県を選択してください";
    if (!city) next.city = "市町村を入力してください";
    else if (city.length > FIELD_LIMITS.city)
      next.city = `市町村は ${FIELD_LIMITS.city} 文字以内で入力してください`;
    if (display_name && display_name.length > FIELD_LIMITS.display_name)
      next.display_name = `表示名は ${FIELD_LIMITS.display_name} 文字以内で入力してください`;
    if (bio && bio.length > FIELD_LIMITS.bio)
      next.bio = `自己紹介は ${FIELD_LIMITS.bio} 文字以内で入力してください`;
    if (note && note.length > FIELD_LIMITS.note)
      next.note = `備考は ${FIELD_LIMITS.note} 文字以内で入力してください`;

    let field_size: number | null = null;
    if (fieldSizeRaw !== "") {
      const parsed = Number.parseFloat(fieldSizeRaw);
      if (Number.isNaN(parsed) || parsed < 0) {
        next.field_size = "圃場規模は 0 以上の数値で入力してください";
      } else {
        field_size = parsed;
      }
    }

    if (Object.keys(next).length > 0) {
      setFieldErrors(next);
      return;
    }

    // avatar_url の解決:
    //   pendingAvatar === undefined → 既存値維持
    //   pendingAvatar === null      → 削除 (= NULL を送る)
    //   pendingAvatar === string    → 新しい URL を送る
    const avatar_url =
      pendingAvatar === undefined ? profile.avatar_url : pendingAvatar;

    startTransition(async () => {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name,
          bio,
          avatar_url,
          prefecture,
          city,
          field_size,
          note,
        }),
      });

      if (res.status === 401) {
        router.push("/login?expired=1");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const code = body?.error;
        if (code === "invalid_avatar_path") {
          setError(
            "アバター画像のパスが不正です。画像を選び直してください。",
          );
        } else if (code === "profile_not_found") {
          setError(
            "プロフィールがまだ作成されていません。オンボーディングを完了してください。",
          );
        } else {
          setError(
            code
              ? `保存に失敗しました (${code})`
              : "保存に失敗しました。時間をおいて再度お試しください",
          );
        }
        return;
      }

      router.push("/me/profile");
      router.refresh();
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>アバター</Label>
        <AvatarUpload
          userId={profile.user_id}
          currentAvatarUrl={profile.avatar_url}
          value={pendingAvatar === undefined ? null : pendingAvatar}
          onChange={(v) => setPendingAvatar(v)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">表示名 (任意)</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          maxLength={FIELD_LIMITS.display_name}
          defaultValue={profile.display_name ?? ""}
          aria-invalid={Boolean(fieldErrors.display_name)}
        />
        {fieldErrors.display_name && (
          <p className="text-sm text-error">{fieldErrors.display_name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          未入力の場合は氏名 (「{profile.name}」) が表示されます。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">自己紹介 (任意)</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={FIELD_LIMITS.bio}
          defaultValue={profile.bio ?? ""}
          aria-invalid={Boolean(fieldErrors.bio)}
        />
        {fieldErrors.bio && (
          <p className="text-sm text-error">{fieldErrors.bio}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefecture">
          都道府県 <span className="text-error">*</span>
        </Label>
        <select
          id="prefecture"
          name="prefecture"
          defaultValue={profile.prefecture}
          className="flex h-11 w-full rounded-sm border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
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
          maxLength={FIELD_LIMITS.city}
          required
          autoComplete="address-level2"
          defaultValue={profile.city}
          aria-invalid={Boolean(fieldErrors.city)}
        />
        {fieldErrors.city && (
          <p className="text-sm text-error">{fieldErrors.city}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="field_size">圃場規模 (アール、任意)</Label>
        <Input
          id="field_size"
          name="field_size"
          type="number"
          min={0}
          step="0.01"
          defaultValue={profile.field_size ?? ""}
          aria-invalid={Boolean(fieldErrors.field_size)}
        />
        {fieldErrors.field_size && (
          <p className="text-sm text-error">{fieldErrors.field_size}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">備考 (任意)</Label>
        <Textarea
          id="note"
          name="note"
          rows={4}
          maxLength={FIELD_LIMITS.note}
          defaultValue={profile.note ?? ""}
          aria-invalid={Boolean(fieldErrors.note)}
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

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          loading={isPending}
          loadingText="保存中…"
        >
          保存する
        </Button>
        <Button
          asChild
          type="button"
          variant="outline"
          disabled={isPending}
        >
          <a href="/me/profile">キャンセル</a>
        </Button>
      </div>
    </form>
  );
}
