"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportReason } from "@/types/admin";

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "スパム / 営業" },
  { value: "abuse", label: "嫌がらせ / 誹謗中傷" },
  { value: "impersonation", label: "なりすまし" },
  { value: "inappropriate", label: "不適切な内容 (規約違反など)" },
  { value: "other", label: "その他" },
];

export function ReportForm({
  targetUserId,
  backHref,
}: {
  targetUserId: string;
  backHref: string;
}) {
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user_id: targetUserId,
          reason,
          body: body.trim() || null,
        }),
      });
      if (!res.ok) {
        const respBody = await res.json().catch(() => ({}));
        setError(messageFor(respBody?.error));
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError("通報の送信に失敗しました (ネットワーク)");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-[var(--green-primary)] bg-[var(--green-subtle)] p-6 text-center space-y-3"
      >
        <CheckCircle2
          className="mx-auto h-8 w-8 text-[var(--green-primary)]"
          aria-hidden="true"
        />
        <p className="text-base font-medium text-[var(--green-dark)]">
          通報を受け付けました
        </p>
        <p className="text-sm text-muted-foreground">
          Farmille 運営が内容を確認します。確認には数日かかる場合があります。
        </p>
        <Link
          href={backHref}
          className="inline-block rounded border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          元のページに戻る
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      aria-busy={busy}
      className="space-y-4 rounded-md border border-border bg-card p-6"
    >
      <label className="block space-y-1">
        <span className="text-sm font-medium text-foreground">
          通報理由
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
          disabled={busy}
          required
          className="w-full rounded border border-border bg-background px-3 py-2 text-base focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
        >
          {REASON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-foreground">
          詳細 (任意、最大 2000 字)
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={5}
          disabled={busy}
          placeholder="どのレビュー / どの行為に対する通報か、運営の判断材料を簡潔に記載してください。"
          className="w-full rounded border border-border bg-background px-3 py-2 text-base focus:outline-none focus:border-[var(--green-primary)] focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
        />
        <span className="text-xs text-muted-foreground">
          {body.length} / 2000
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "送信中…" : "通報を送信"}
        </Button>
        <Link
          href={backHref}
          className="inline-flex items-center rounded border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}

function messageFor(code: unknown): string {
  if (typeof code !== "string") return "通報の送信に失敗しました";
  switch (code) {
    case "invalid_reason":
      return "通報理由が不正です";
    case "self_report_not_allowed":
      return "自分自身を通報することはできません";
    case "target_not_found":
      return "対象ユーザーが見つかりません (退会・削除済の可能性)";
    case "already_reported":
      return "このユーザーへの通報はすでに受付済です (運営確認待ち)";
    case "unauthorized":
      return "ログインが必要です";
    default:
      return "通報の送信に失敗しました";
  }
}
