"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSignUpRole } from "@/lib/auth/roles";

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

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name.trim(), intended_role: role },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
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

  redirect(role && role !== "unassigned" ? "/home" : "/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
