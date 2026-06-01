-- =============================================================
-- DRAFT (not yet a real migration) — keep public.users.role in sync
-- with auth.users.raw_app_meta_data.role to prevent admin guard
-- drift (see task #5, discovered 2026-05-26 during admin 2FA UAT).
--
-- BACKGROUND
-- ----------
-- The auth flow reads role from JWT app_metadata
-- (frontend/src/lib/auth/server.ts:23 and frontend/src/lib/auth/actions.ts:86,
--  backend/app/auth/jwt.py:79). app_metadata is mutated by
-- backend/app/routers/admin.py:295 when an admin promotes a user via
-- POST /v1/admin/users/{id}/role, AND backend/app/routers/auth.py:45
-- on the post-signup role completion. So the normal product flow
-- keeps them in sync.
--
-- The drift happens when public.users.role is edited via direct SQL
-- (Supabase Studio or `supabase db query`) without going through the
-- BFF. The user appears as 'admin' in the public table, but their JWT
-- still carries the original 'farmer'/'unassigned' value — every
-- admin guard then silently fails for that user.
--
-- This trigger closes the loophole: any UPDATE of public.users.role
-- automatically calls auth.admin.update_user_by_id-equivalent SQL to
-- patch raw_app_meta_data.role to match.
--
-- WHEN TO PROMOTE TO REAL MIGRATION
-- ---------------------------------
-- Move this to `supabase/migrations/<ts>_sync_app_metadata_role_trigger.sql`
-- when ready to apply. Do NOT auto-promote — let Ryoga decide if the
-- behaviour is desirable on prod (it changes a side-effect of writing
-- to public.users, which could surprise other tooling).
--
-- TESTING CHECKLIST (when promoted)
-- ---------------------------------
-- [ ] UPDATE public.users SET role='admin' WHERE id='<test>' →
--       SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id='<test>'
--       must equal 'admin' (without the user logging in again).
-- [ ] Existing /v1/admin/users/{id}/role POST endpoint still works
--       (idempotent — backend mutates app_metadata first, trigger then no-ops).
-- [ ] Demoting role='unassigned' propagates to app_metadata too.
-- [ ] supabase_auth_admin role has permission to UPDATE auth.users.
--       If not, the function must use SECURITY DEFINER with a privileged owner.
-- =============================================================

CREATE OR REPLACE FUNCTION public.sync_app_metadata_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- No-op when role didn't change (UPDATE of other columns)
  IF TG_OP = 'UPDATE' AND OLD.role IS NOT DISTINCT FROM NEW.role THEN
    RETURN NEW;
  END IF;

  UPDATE auth.users
     SET raw_app_meta_data = jsonb_set(
       COALESCE(raw_app_meta_data, '{}'::jsonb),
       '{role}',
       to_jsonb(NEW.role::text),
       true
     )
   WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_app_metadata_role ON public.users;

CREATE TRIGGER trg_sync_app_metadata_role
AFTER INSERT OR UPDATE OF role ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_app_metadata_role();

-- Backfill: bring all existing rows into sync once.
-- Idempotent: re-running is safe (jsonb_set with same value is a no-op).
UPDATE auth.users au
   SET raw_app_meta_data = jsonb_set(
     COALESCE(au.raw_app_meta_data, '{}'::jsonb),
     '{role}',
     to_jsonb(pu.role::text),
     true
   )
  FROM public.users pu
 WHERE au.id = pu.id
   AND (au.raw_app_meta_data->>'role') IS DISTINCT FROM pu.role;
