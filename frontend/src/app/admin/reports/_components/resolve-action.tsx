"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// 2026-05-27 追加: admin/reports 行内の解決アクション。
// resolution: resolved / spam / dismissed + note。

const RESOLUTIONS: { value: "resolved" | "spam" | "dismissed"; label: string }[] = [
  { value: "resolved", label: "解決済 (対象に対処済)" },
  { value: "spam", label: "通報自体が spam" },
  { value: "dismissed", label: "却下 (誤通報)" },
];

export function ResolveAction({
  reportId,
  targetName,
  reason,
}: {
  reportId: string;
  targetName: string | null;
  reason: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState<"resolved" | "spam" | "dismissed">(
    "resolved",
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/reports/${encodeURIComponent(reportId)}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resolution,
            note: note.trim() || null,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error));
        setBusy(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.refresh(), 1200);
    } catch {
      setError("解決処理に失敗しました (ネットワーク)");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-1 text-xs text-[var(--green-dark)]"
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        処理しました
      </span>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-7 px-2 text-xs"
        aria-label={`${targetName ?? "対象ユーザー"} への ${reason} 通報を処理`}
      >
        処理する
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded border border-border bg-background p-2 min-w-[220px]">
      <select
        value={resolution}
        onChange={(e) =>
          setResolution(e.target.value as typeof resolution)
        }
        disabled={busy}
        className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
        aria-label="処理結果"
      >
        {RESOLUTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="メモ (任意、admin 確認用)"
        maxLength={2000}
        rows={2}
        disabled={busy}
        className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
      />
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={busy}
          className="h-7 px-2 text-xs"
        >
          {busy ? "送信中…" : "確定"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setNote("");
            setError(null);
          }}
          disabled={busy}
          className="h-7 px-2 text-xs"
        >
          キャンセル
        </Button>
      </div>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function messageFor(code: unknown): string {
  if (typeof code !== "string") return "処理に失敗しました";
  switch (code) {
    case "report_not_found":
      return "通報が見つかりません";
    case "already_resolved":
      return "すでに処理済です";
    case "invalid_resolution":
      return "処理結果が不正です";
    case "not_admin":
      return "権限がありません";
    case "unauthorized":
      return "再ログインが必要です";
    default:
      return "処理に失敗しました";
  }
}
