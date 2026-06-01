"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSignUpRole } from "@/lib/auth/roles";
import { landingPathForRole } from "@/lib/auth/landing";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signUp(formData: FormData): Promise<ActionResult> {
  const role = formData.get("role");
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  if (!isSignUpRole(role)) {
    return { ok: false, error: "属性を選択してください" };
  }
  if (typeof name !== "string" || name.trim().length === 0 || name.length > 50) {
    return { ok: false, error: "氏名を入力してください（50文字以内）" };
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return { ok: false, error: "正しいメールアドレスを入力してください" };
  }
  if (typeof password !== "string" || password.length < 6) {
    return { ok: false, error: "パスワードは6文字以上で入力してください" };
  }

  // 2026-05-27: backend `/v1/auth/signup` で role を確定済セット (旧 intended_role
  // 経由は cross-browser email 確認で session 分断 → role 未昇格の落ち穂が出てた)。
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return { ok: false, error: "サーバ設定エラー (API_URL 未設定)" };
  }

  const signupRes = await fetch(`${apiUrl}/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: name.trim(), role }),
  });
  const signupBody = (await signupRes.json().catch(() => ({}))) as {
    error?: string;
    email_confirmation_required?: boolean;
  };
  if (!signupRes.ok) {
    if (signupBody?.error === "email_already_registered") {
      return { ok: false, error: "このメールアドレスは既に登録されています" };
    }
    if (signupBody?.error === "invalid_role") {
      return { ok: false, error: "属性が不正です" };
    }
    return {
      ok: false,
      error: "登録に失敗しました。時間をおいて再度お試しください",
    };
  }

  // 2026-05-27: backend が email 確認必須を返したら auto-signin はスキップ。
  // 確認メール内のリンクを踏んで /auth/callback 経由でログイン → /onboarding/{role}。
  if (signupBody?.email_confirmation_required) {
    return { ok: true };
  }

  // dev (確認スキップ): そのまま自動ログイン → /onboarding/{role} へ。
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    return { ok: true };
  }

  redirect(`/onboarding/${role}`);
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { ok: false, error: "メールアドレスとパスワードを入力してください" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("email not confirmed")) {
      return {
        ok: false,
        error:
          "メール確認が完了していません。登録メールのリンクをクリックしてください",
      };
    }
    if (message.includes("invalid login credentials")) {
      return {
        ok: false,
        error: "メールアドレスまたはパスワードが間違っています",
      };
    }
    return {
      ok: false,
      error: "ログインに失敗しました。時間をおいて再度お試しください",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;

  // ADR-0012 §2.3: admin は MFA 完了まで /admin に着地させない
  if (role === "admin") {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verifiedTotp = factors?.totp.find((f) => f.status === "verified");
    const target = verifiedTotp
      ? `/mfa/challenge?next=${encodeURIComponent("/admin")}`
      : `/mfa/setup?next=${encodeURIComponent("/admin")}`;
    redirect(target);
  }

  redirect(landingPathForRole(role));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<ActionResult> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.includes("@")) {
    return { ok: false, error: "正しいメールアドレスを入力してください" };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/password-update`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function updatePassword(
  formData: FormData,
): Promise<ActionResult> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 6) {
    return { ok: false, error: "パスワードは6文字以上で入力してください" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "セッションが切れました。再度メール内リンクを開いてください" };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
