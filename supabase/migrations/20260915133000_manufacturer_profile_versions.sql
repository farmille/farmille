create table public.manufacturer_profile_versions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_accounts(id) on delete restrict,
  status text not null check(status in ('draft','pending','published','returned','superseded','withdrawn')),
  profile_text text not null,
  logo_url text not null check(logo_url='' or logo_url ~ '^https?://'),
  website_url text not null check(website_url='' or website_url ~ '^https?://'),
  base_profile_text text,
  base_logo_url text,
  base_website_url text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete restrict,
  review_note text
);
create unique index manufacturer_profile_one_working on public.manufacturer_profile_versions(seller_id)
  where status in ('draft','pending');
alter table public.manufacturer_profile_versions enable row level security;
revoke all on public.manufacturer_profile_versions from anon,authenticated;
grant select on public.manufacturer_profile_versions to authenticated;
grant select,insert,update on public.manufacturer_profile_versions to service_role;
create policy manufacturer_profile_version_read on public.manufacturer_profile_versions for select to authenticated using(
  app.is_admin_writer() or (app.is_seller() and seller_id=app.seller_id()
    and exists(select 1 from public.seller_accounts s where s.id=seller_id and s.status='approved'))
);

create function public.save_manufacturer_profile_version(
  p_profile_text text,p_logo_url text,p_website_url text,p_submit boolean,p_expected_version uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.seller_accounts; current_version public.manufacturer_profile_versions; version_id uuid;
begin
  if not app.is_seller() then raise exception 'メーカーログインが必要です' using errcode='42501'; end if;
  select * into s from public.seller_accounts where id=app.seller_id() and status='approved' for update;
  if not found then raise exception 'メーカーアカウントを確認してください' using errcode='42501'; end if;
  select * into current_version from public.manufacturer_profile_versions where seller_id=s.id and status in ('draft','pending') for update;
  if current_version.status='pending' then raise exception '表現確認中です' using errcode='23505'; end if;
  if current_version.id is distinct from p_expected_version then raise exception '別の画面で更新されています' using errcode='40001'; end if;
  update public.manufacturer_profile_versions set status='superseded' where id=current_version.id;
  insert into public.manufacturer_profile_versions(seller_id,status,profile_text,logo_url,website_url,base_profile_text,base_logo_url,base_website_url)
    values(s.id,case when p_submit then 'pending' else 'draft' end,p_profile_text,p_logo_url,p_website_url,
      case when current_version.id is null then s.profile_text else current_version.base_profile_text end,
      case when current_version.id is null then s.logo_url else current_version.base_logo_url end,
      case when current_version.id is null then s.website_url else current_version.base_website_url end)
    returning id into version_id;
  return version_id;
end;
$$;
revoke all on function public.save_manufacturer_profile_version(text,text,text,boolean,uuid) from public,anon;
grant execute on function public.save_manufacturer_profile_version(text,text,text,boolean,uuid) to authenticated;

create function public.withdraw_manufacturer_profile_version(p_version_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform id from public.seller_accounts where id=app.seller_id() and status='approved' for update;
  if not found or not app.is_seller() then raise exception 'メーカーログインが必要です' using errcode='42501'; end if;
  update public.manufacturer_profile_versions set status='withdrawn' where id=p_version_id and seller_id=app.seller_id() and status='pending';
  if not found then raise exception '取り下げられる原稿がありません' using errcode='42501'; end if;
end;
$$;
revoke all on function public.withdraw_manufacturer_profile_version(uuid) from public,anon;
grant execute on function public.withdraw_manufacturer_profile_version(uuid) to authenticated;

create function public.review_manufacturer_profile_version(p_version_id uuid,p_actor_id uuid,p_publish boolean,p_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare original public.manufacturer_profile_versions; version public.manufacturer_profile_versions; s public.seller_accounts;
begin
  select * into original from public.manufacturer_profile_versions where id=p_version_id;
  if not found then raise exception '原稿が見つかりません' using errcode='P0002'; end if;
  select * into s from public.seller_accounts where id=original.seller_id for update;
  if s.status<>'approved' then raise exception 'メーカーアカウントを確認してください' using errcode='42501'; end if;
  select * into version from public.manufacturer_profile_versions where id=p_version_id for update;
  if version.status<>'pending' then raise exception '表現確認中ではありません' using errcode='23505'; end if;
  if p_publish then
    if s.profile_text is distinct from version.base_profile_text or s.logo_url is distinct from version.base_logo_url or s.website_url is distinct from version.base_website_url then
      raise exception '公開プロフィールが更新されています' using errcode='40001';
    end if;
    update public.seller_accounts set profile_text=nullif(version.profile_text,''),logo_url=nullif(version.logo_url,''),website_url=nullif(version.website_url,'') where id=s.id;
  elsif nullif(btrim(p_note),'') is null then raise exception '修正が必要な箇所を記入してください' using errcode='23514';
  end if;
  update public.manufacturer_profile_versions set status=case when p_publish then 'published' else 'returned' end,reviewed_at=now(),reviewed_by=p_actor_id,review_note=nullif(btrim(p_note),'') where id=p_version_id;
  return s.id;
end;
$$;
revoke all on function public.review_manufacturer_profile_version(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.review_manufacturer_profile_version(uuid,uuid,boolean,text) to service_role;

create table public.material_page_audits (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete restrict,
  version_id uuid references public.material_page_versions(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  outcome text not null check(outcome in ('checked','correction_requested','hidden')),
  note text not null check(length(btrim(note))>0),
  created_at timestamptz not null default now()
);
alter table public.material_page_audits enable row level security;
revoke all on public.material_page_audits from anon,authenticated;
grant select on public.material_page_audits to authenticated;
grant select,insert on public.material_page_audits to service_role;
create policy material_page_audits_read on public.material_page_audits for select to authenticated using(
  app.is_admin_writer() or exists(select 1 from public.material_editor_grants g join public.seller_accounts s on s.id=g.seller_id
    where g.material_id=material_id and g.seller_id=app.seller_id() and g.revoked_at is null and s.status='approved')
);
