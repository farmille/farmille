import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth/roles";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getRole(): Promise<Role | null> {
  const user = await getUser();
  if (!user) return null;
  const role = (user.app_metadata?.role ?? null) as Role | null;
  return role;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
