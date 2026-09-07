-- 切替後のデータも削除せず、旧スキーマを復旧する。
begin;
set local lock_timeout = '5s';
select pg_advisory_xact_lock(20260908, 1);
alter schema public rename to rollback_v2_20260908;
revoke all on schema rollback_v2_20260908 from public, anon, authenticated, service_role;
alter schema app rename to rollback_v2_app_20260908;
alter schema legacy_v1_20260908 rename to public;
grant usage on schema public to public, postgres, anon, authenticated, service_role;
alter table supabase_migrations.schema_migrations set schema rollback_v2_20260908;
alter table public.schema_migrations set schema supabase_migrations;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public'
as $$ begin
  insert into public.users (id, role, name)
  values (new.id, 'unassigned', coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

do $$ declare policy record; begin
  for policy in select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'farmille_storage_%'
  loop
    execute format('drop policy %I on storage.objects', policy.policyname);
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
