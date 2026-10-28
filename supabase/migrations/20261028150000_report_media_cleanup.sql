-- 回収を確保した画像は新しい参照を拒み、Storage APIで削除できるまで記録を残す。
create table public.report_media_cleanup (
  object_id uuid primary key references storage.objects(id) on delete cascade,
  path text not null unique,
  claimed_at timestamptz not null default now()
);
alter table public.report_media_cleanup enable row level security;
revoke all on public.report_media_cleanup from public, anon, authenticated;

create index usage_report_media_storage_path_idx on public.usage_report_media
  ((substring(url from '^https?://[^/?#]+/storage/v1/object/public/report-media/([^?#]+)$')));

create function app.guard_report_media_cleanup() returns trigger
language plpgsql security definer set search_path = '' as $$
declare object_path text;
begin
  object_path := substring(new.url from '^https?://[^/?#]+/storage/v1/object/public/report-media/([^?#]+)$');
  if object_path is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('report_media:' || object_path, 0));
  if exists(select 1 from public.report_media_cleanup q where q.path = object_path)
    or not exists(select 1 from storage.objects o where o.bucket_id = 'report-media' and o.name = object_path) then
    raise exception 'invalid_report_input' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function app.guard_report_media_cleanup() from public, anon, authenticated;
create trigger guard_report_media_cleanup before insert or update of url on public.usage_report_media
for each row execute function app.guard_report_media_cleanup();

create function public.claim_expired_report_media(p_limit integer default 100)
returns table(path text) language plpgsql security definer set search_path = '' as $$
declare candidate record;
begin
  if p_limit < 1 or p_limit > 1000 or p_limit is null then
    raise exception 'invalid_body' using errcode = '22023';
  end if;
  for candidate in
    select o.id, o.name from storage.objects o
    where o.bucket_id = 'report-media'
      and greatest(o.created_at, o.updated_at) < now() - interval '24 hours'
      and not exists(select 1 from public.usage_report_media m
        where substring(m.url from '^https?://[^/?#]+/storage/v1/object/public/report-media/([^?#]+)$') = o.name)
    order by o.created_at, o.id limit p_limit
  loop
    -- 保存中の画像は待たずに次回へ回す。ロック取得後に新しい参照を読み直す。
    if not pg_try_advisory_xact_lock(hashtextextended('report_media:' || candidate.name, 0)) then continue; end if;
    if exists(select 1 from public.usage_report_media m
      where substring(m.url from '^https?://[^/?#]+/storage/v1/object/public/report-media/([^?#]+)$') = candidate.name) then continue; end if;
    insert into public.report_media_cleanup(object_id, path) values(candidate.id, candidate.name)
      on conflict(object_id) do nothing;
    path := candidate.name;
    return next;
  end loop;
end;
$$;
revoke all on function public.claim_expired_report_media(integer) from public, anon, authenticated;
grant execute on function public.claim_expired_report_media(integer) to service_role;
