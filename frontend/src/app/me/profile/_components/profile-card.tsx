import Image from "next/image";
import Link from "next/link";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Phase 19: プロフィール表示カード (spec §6.1)。
// display_name 未設定なら users.name (氏名) にフォールバック。
// avatar_url 未設定なら lucide-react UserCircle で placeholder 表示。

export type MeProfile = {
  user_id: string;
  name: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  prefecture: string;
  city: string;
  field_size: number | null;
  note: string | null;
};

export function ProfileCard({ profile }: { profile: MeProfile }) {
  const headline = profile.display_name?.trim() || profile.name;

  return (
    <div className="rounded-md border border-border bg-card p-6 space-y-6">
      <div className="flex items-start gap-4">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover bg-muted flex-shrink-0"
          />
        ) : (
          <div
            aria-hidden
            className="h-24 w-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
          >
            <UserCircle
              className="h-16 w-16 text-muted-foreground"
              aria-hidden
            />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight truncate">
            {headline}
          </h2>
          {profile.display_name && profile.display_name !== profile.name && (
            <p className="text-sm text-muted-foreground">
              氏名: {profile.name}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {profile.prefecture} {profile.city}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/me/profile/edit">プロフィールを編集</Link>
        </Button>
      </div>

      {profile.bio && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            自己紹介
          </h3>
          <p className="whitespace-pre-wrap text-base">{profile.bio}</p>
        </section>
      )}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {profile.field_size != null && (
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">圃場規模</dt>
            <dd className="text-base">{profile.field_size} アール</dd>
          </div>
        )}
        {profile.note && (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">備考</dt>
            <dd className="whitespace-pre-wrap text-base">{profile.note}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
