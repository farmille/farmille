"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type SegmentType =
  | "favorite_followers"
  | "event_past_attendees"
  | "specific_users";

export type MakerEventOption = {
  id: string;
  title: string;
  starts_at: string;
};

export type CampaignFormInitial = {
  id?: string;
  subject: string;
  body: string;
  segment_type: SegmentType;
  segment_filter: Record<string, unknown>;
};

type Props = {
  mode: "create" | "edit";
  initial: CampaignFormInitial;
  events: MakerEventOption[];
};

function buildSegmentFilter(
  type: SegmentType,
  eventId: string,
  userIdsText: string,
): { filter: Record<string, unknown>; error: string | null } {
  if (type === "favorite_followers") {
    return {
      filter: { segment_type: "favorite_followers" },
      error: null,
    };
  }
  if (type === "event_past_attendees") {
    if (!eventId) {
      return { filter: {}, error: "対象の講演会を選択してください。" };
    }
    return {
      filter: { segment_type: "event_past_attendees", event_id: eventId },
      error: null,
    };
  }
  // specific_users
  const ids = userIdsText
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (ids.length === 0) {
    return {
      filter: {},
      error: "ユーザー ID を 1 件以上入力してください。",
    };
  }
  if (ids.length > 1000) {
    return {
      filter: {},
      error: "ユーザー ID は 1000 件までです。",
    };
  }
  return {
    filter: { segment_type: "specific_users", user_ids: ids },
    error: null,
  };
}

export function CampaignForm({ mode, initial, events }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [segmentType, setSegmentType] = useState<SegmentType>(
    initial.segment_type,
  );

  const initialEventId = useMemo(() => {
    if (initial.segment_type !== "event_past_attendees") return "";
    const v = initial.segment_filter?.event_id;
    return typeof v === "string" ? v : "";
  }, [initial]);
  const [eventId, setEventId] = useState<string>(initialEventId);

  const initialUserIdsText = useMemo(() => {
    if (initial.segment_type !== "specific_users") return "";
    const v = initial.segment_filter?.user_ids;
    if (!Array.isArray(v)) return "";
    return v.filter((s): s is string => typeof s === "string").join("\n");
  }, [initial]);
  const [userIdsText, setUserIdsText] = useState<string>(initialUserIdsText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim() || !body.trim()) {
      setError("件名と本文は必須です。");
      return;
    }

    const { filter, error: filterError } = buildSegmentFilter(
      segmentType,
      eventId,
      userIdsText,
    );
    if (filterError) {
      setError(filterError);
      return;
    }

    const payload: Record<string, unknown> = {
      subject,
      body,
      segment_type: segmentType,
      segment_filter: filter,
    };

    startTransition(async () => {
      const url =
        mode === "create"
          ? "/api/maker/emails/campaigns"
          : `/api/maker/emails/campaigns/${initial.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (mode === "create") {
          const data = (await res.json().catch(() => ({}))) as {
            id?: string;
          };
          if (data.id) {
            router.push(`/maker/emails/${data.id}`);
            return;
          }
        }
        router.push(`/maker/emails/${initial.id ?? ""}`);
        router.refresh();
        return;
      }

      const errBody = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
      };
      if (errBody.code === "campaign_already_queued") {
        setError("送信予約済のキャンペーンは編集できません。");
      } else if (errBody.code === "invalid_segment_filter") {
        setError("配信先の指定内容を確認してください。");
      } else {
        setError("保存に失敗しました。時間をおいて再度お試しください。");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium text-foreground">
          件名
        </label>
        <input
          id="subject"
          type="text"
          required
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
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
          rows={12}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          配信先セグメント
        </legend>
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="segment_type"
              value="favorite_followers"
              checked={segmentType === "favorite_followers"}
              onChange={() => setSegmentType("favorite_followers")}
              className="mt-1"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                暗黙フォロワー
              </p>
              <p className="text-xs text-muted-foreground">
                自社製品をマイ資材に保存しているユーザー全員。
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="segment_type"
              value="event_past_attendees"
              checked={segmentType === "event_past_attendees"}
              onChange={() => setSegmentType("event_past_attendees")}
              className="mt-1"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                過去の講演会申込者
              </p>
              <p className="text-xs text-muted-foreground">
                自社主催の講演会へ申込済（キャンセル含まず）のユーザー。
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="segment_type"
              value="specific_users"
              checked={segmentType === "specific_users"}
              onChange={() => setSegmentType("specific_users")}
              className="mt-1"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                個別指定（ユーザー ID）
              </p>
              <p className="text-xs text-muted-foreground">
                最大 1000 件まで、改行またはカンマ区切り。
              </p>
            </div>
          </label>
        </div>
      </fieldset>

      {segmentType === "event_past_attendees" && (
        <div className="space-y-2">
          <label
            htmlFor="event_id"
            className="text-sm font-medium text-foreground"
          >
            対象の講演会（自社主催のみ）
          </label>
          <select
            id="event_id"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base text-foreground"
          >
            <option value="">選択してください</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}（{ev.starts_at.slice(0, 10)}）
              </option>
            ))}
          </select>
          {events.length === 0 && (
            <p className="text-xs text-muted-foreground">
              自社主催の講演会がまだありません。先に講演会を作成してください。
            </p>
          )}
        </div>
      )}

      {segmentType === "specific_users" && (
        <div className="space-y-2">
          <label
            htmlFor="user_ids"
            className="text-sm font-medium text-foreground"
          >
            ユーザー ID（UUID、改行またはカンマ区切り、最大 1000 件）
          </label>
          <textarea
            id="user_ids"
            rows={6}
            value={userIdsText}
            onChange={(e) => setUserIdsText(e.target.value)}
            placeholder={
              "例:\n00000000-0000-0000-0000-000000000001\n00000000-0000-0000-0000-000000000002"
            }
            className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm text-foreground"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending} loadingText="保存中…">
          {mode === "create" ? "下書き作成" : "更新する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/maker/emails")}
          disabled={isPending}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
