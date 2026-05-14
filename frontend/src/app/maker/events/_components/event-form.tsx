"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type EventStatus = "draft" | "published" | "cancelled";

export type EventFormInitial = {
  id?: string;
  title: string;
  body: string;
  venue: string | null;
  online_url: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  status: EventStatus;
};

type Props = {
  mode: "create" | "edit";
  initial: EventFormInitial;
};

function toDatetimeLocal(iso: string): string {
  // YYYY-MM-DDTHH:mm 形式へ。new Date() の getTimezoneOffset で local 帯に補正。
  if (!iso) return "";
  const d = new Date(iso);
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
  const local = new Date(d.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocal(local: string): string {
  // datetime-local input は local 帯の YYYY-MM-DDTHH:mm。new Date() は local 解釈。
  if (!local) return "";
  return new Date(local).toISOString();
}

export function EventForm({ mode, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [venue, setVenue] = useState(initial.venue ?? "");
  const [onlineUrl, setOnlineUrl] = useState(initial.online_url ?? "");
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initial.starts_at));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initial.ends_at));
  const [capacity, setCapacity] = useState<string>(
    initial.capacity !== null ? String(initial.capacity) : "",
  );
  const [status, setStatus] = useState<EventStatus>(initial.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !body.trim()) {
      setError("タイトルと本文は必須です。");
      return;
    }
    if (!venue.trim() && !onlineUrl.trim()) {
      setError("会場またはオンラインURLのどちらかを入力してください。");
      return;
    }
    if (!startsAt || !endsAt) {
      setError("開始日時と終了日時は必須です。");
      return;
    }
    const startsIso = fromDatetimeLocal(startsAt);
    const endsIso = fromDatetimeLocal(endsAt);
    if (new Date(endsIso) <= new Date(startsIso)) {
      setError("終了日時は開始日時より後である必要があります。");
      return;
    }

    const payload: Record<string, unknown> = {
      title,
      body,
      venue: venue.trim() ? venue : null,
      online_url: onlineUrl.trim() ? onlineUrl : null,
      starts_at: startsIso,
      ends_at: endsIso,
      capacity: capacity.trim() ? Number(capacity) : null,
      status,
    };

    startTransition(async () => {
      const url =
        mode === "create"
          ? "/api/maker/events"
          : `/api/maker/events/${initial.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (mode === "create") {
          const data = (await res.json().catch(() => ({}))) as { id?: string };
          if (data.id) {
            router.push(`/maker/events/${data.id}/edit`);
            return;
          }
        }
        router.push("/maker/events");
        router.refresh();
        return;
      }

      const errBody = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
      };
      if (errBody.code === "event_not_owner") {
        setError("この講演会は編集できません。");
      } else if (errBody.code === "event_not_found") {
        setError("講演会が見つかりません。");
      } else if (errBody.code === "validation_failed") {
        setError("入力内容を確認してください。");
      } else {
        setError("保存に失敗しました。時間をおいて再度お試しください。");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          タイトル
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="text-sm font-medium text-foreground">
          本文
        </label>
        <textarea
          id="body"
          required
          maxLength={20000}
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="venue"
            className="text-sm font-medium text-foreground"
          >
            会場
          </label>
          <input
            id="venue"
            type="text"
            maxLength={200}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="例: 東京都港区..."
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="online_url"
            className="text-sm font-medium text-foreground"
          >
            オンライン URL
          </label>
          <input
            id="online_url"
            type="url"
            maxLength={500}
            pattern="https?://.+"
            value={onlineUrl}
            onChange={(e) => setOnlineUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        会場・オンライン URL のどちらか一方は必須です。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="starts_at"
            className="text-sm font-medium text-foreground"
          >
            開始日時
          </label>
          <input
            id="starts_at"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="ends_at"
            className="text-sm font-medium text-foreground"
          >
            終了日時
          </label>
          <input
            id="ends_at"
            type="datetime-local"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="capacity"
            className="text-sm font-medium text-foreground"
          >
            定員 (任意)
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="空欄で定員なし"
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="text-sm font-medium text-foreground"
          >
            状態
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus)}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
            <option value="cancelled">中止</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending} loadingText="保存中…">
          {mode === "create" ? "作成する" : "更新する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/maker/events")}
          disabled={isPending}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
