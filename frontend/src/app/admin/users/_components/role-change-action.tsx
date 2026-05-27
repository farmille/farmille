"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AdminAssignableRole,
  UserRole,
} from "@/types/admin";

// B6 admin users — role 変更 Client Island。
// 既存 backend POST /v1/admin/users/{id}/role は ASSIGNABLE_ROLES = admin / ja_staff / researcher
// のみ受け付ける (farmer / maker / unassigned への変更は不可)。
// 行ごとに role select + 「変更」ボタン + 成功 toast (inline banner) を出す。

const ASSIGNABLE_OPTIONS: { value: AdminAssignableRole; label: string }[] = [
  { value: "admin", label: "admin (運営)" },
  { value: "ja_staff", label: "ja_staff (JA 普及員)" },
  { value: "researcher", label: "researcher (研究者)" },
];

const SUCCESS_BANNER_MS = 2000;

export function RoleChangeAction({
  userId,
  displayName,
  currentRole,
}: {
  userId: string;
  displayName: string;
  currentRole: UserRole;
}) {
  const router = useRouter();
  const initial: AdminAssignableRole = isAssignable(currentRole)
    ? currentRole
    : "ja_staff";
  const [selected, setSelected] = useState<AdminAssignableRole>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = selected !== currentRole && !busy;

  async function submit() {
    if (!canSubmit) return;
    if (
      !window.confirm(
        `「${displayName}」のロールを ${currentRole} → ${selected} に変更します。よろしいですか?`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/role`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: selected }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFromError(body?.error, "ロール変更に失敗しました"));
        setBusy(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, SUCCESS_BANNER_MS);
    } catch {
      setError("ロール変更に失敗しました (ネットワーク)");
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 rounded border border-[var(--green-primary)] bg-[var(--green-subtle)] px-3 py-1.5 text-xs text-[var(--green-dark)]"
      >
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {currentRole} → {selected} に変更しました
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as AdminAssignableRole)}
        disabled={busy}
        className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
        aria-label={`${displayName} の新しいロール`}
      >
        {ASSIGNABLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={submit}
        disabled={!canSubmit}
      >
        {busy ? "変更中…" : "変更"}
      </Button>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function isAssignable(role: UserRole): role is AdminAssignableRole {
  return role === "admin" || role === "ja_staff" || role === "researcher";
}

function messageFromError(code: unknown, fallback: string): string {
  if (typeof code !== "string") return fallback;
  switch (code) {
    case "user_not_found":
      return "対象ユーザーが見つかりません";
    case "role_already_assigned":
      return "すでにそのロールです";
    case "invalid_target_role":
      return "そのロールには変更できません (farmer / maker / unassigned は対象外)";
    case "failed_to_update_auth_metadata":
      return "auth metadata の更新に失敗しました";
    case "failed_to_update_users_table":
      return "DB 更新に失敗しました (auth は rollback 済)";
    case "not_admin":
      return "権限がありません";
    case "unauthorized":
      return "ログインが必要です";
    default:
      return fallback;
  }
}
