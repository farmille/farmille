-- 原稿は公開版から分離し、保存ごとの版と、版に属する複数項目を保持する。
create table public.material_page_versions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete restrict,
  seller_id uuid not null references public.seller_accounts(id) on delete restrict,
  grant_id uuid not null references public.material_editor_grants(id) on delete restrict,
  base_revision integer not null,
  status text not null check(status in ('draft','pending','published','returned','superseded','withdrawn')),
  description text not null default '',
  main_components text not null default '',
  mechanism text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete restrict,
  review_note text
);
create unique index material_page_one_working_version on public.material_page_versions(material_id)
  where status in ('draft','pending');
alter table public.materials add column published_page_version_id uuid
  references public.material_page_versions(id) on delete restrict;

create table public.material_page_links (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.material_page_versions(id) on delete cascade,
  group_name text not null check(group_name in ('overview','safety','technical')),
  title text not null check(length(btrim(title))>0),
  url text not null check(url ~ '^https?://'),
  sort_order integer not null check(sort_order>=0),
  unique(version_id,sort_order)
);
create table public.material_page_images (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.material_page_versions(id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  sort_order integer not null check(sort_order>=0),
  unique(version_id,sort_order)
);
create table public.material_page_usages (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.material_page_versions(id) on delete cascade,
  method text not null check(method in ('spray','drench','mix','soak','coat','other')),
  detail text not null default '',
  sort_order integer not null check(sort_order>=0),
  unique(version_id,sort_order)
);
create table public.material_page_timings (
  version_id uuid not null references public.material_page_versions(id) on delete cascade,
  timing integer not null check(timing between 0 and 7),
  primary key(version_id,timing)
);
create table public.material_page_certifications (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.material_page_versions(id) on delete cascade,
  title text not null check(length(btrim(title))>0),
  sort_order integer not null check(sort_order>=0),
  unique(version_id,sort_order)
);

create function app.can_read_material_page_version(p_version_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.material_page_versions v
    join public.materials m on m.id=v.material_id
    where v.id=p_version_id and (
      (m.published_page_version_id=v.id and m.publication_status='published')
      or app.is_admin()
      or (app.is_seller() and v.seller_id=app.seller_id()
        and exists(select 1 from public.material_editor_grants g where g.id=v.grant_id and g.revoked_at is null))
    ));
$$;
alter table public.material_page_versions enable row level security;
revoke all on public.material_page_versions from anon,authenticated;
grant select on public.material_page_versions to anon,authenticated;
grant select,insert,update on public.material_page_versions to service_role;
create policy material_page_versions_read on public.material_page_versions for select
  using(app.can_read_material_page_version(id));

do $$ declare t text; begin
  foreach t in array array['material_page_links','material_page_images','material_page_usages','material_page_timings','material_page_certifications'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant select on public.%I to anon,authenticated',t);
    execute format('grant select,insert on public.%I to service_role',t);
    execute format('create policy %I on public.%I for select using(app.can_read_material_page_version(version_id))',t||'_read',t);
  end loop;
end $$;

create function public.save_material_page_version(
  p_material_id uuid,p_expected_version uuid,p_content jsonb,p_submit boolean
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_id uuid; v_grant public.material_editor_grants; v_material public.materials;
  v_current public.material_page_versions;
begin
  if not app.is_seller() then raise exception 'メーカーログインが必要です' using errcode='42501'; end if;
  select * into v_material from public.materials where id=p_material_id for update;
  if not found then raise exception '資材が見つかりません' using errcode='P0002'; end if;
  select g.* into v_grant from public.material_editor_grants g
    join public.seller_accounts s on s.id=g.seller_id
    where g.material_id=p_material_id and g.seller_id=app.seller_id() and g.revoked_at is null and s.status='approved'
    for update of g;
  if not found then raise exception '書類確認済みの編集権が必要です' using errcode='42501'; end if;
  select * into v_current from public.material_page_versions where material_id=p_material_id
    and status in ('draft','pending') for update;
  if v_current.status='pending' then raise exception '表現確認中です。取り下げてから編集してください' using errcode='23505'; end if;
  if v_current.id is distinct from p_expected_version then
    raise exception '別の画面で原稿が更新されました。再読み込みしてください' using errcode='40001';
  end if;
  if p_submit and length(btrim(p_content->>'description'))=0 then
    raise exception '製品説明を入力してください' using errcode='23514';
  end if;
  update public.material_page_versions set status='superseded' where id=v_current.id;
  insert into public.material_page_versions(material_id,seller_id,grant_id,base_revision,status,description,main_components,mechanism)
    values(p_material_id,app.seller_id(),v_grant.id,coalesce(v_current.base_revision,v_material.content_revision),
      case when p_submit then 'pending' else 'draft' end,
      p_content->>'description',p_content->>'mainComponents',p_content->>'mechanism') returning id into v_id;
  insert into public.material_page_links(version_id,group_name,title,url,sort_order)
    select v_id,x->>'group',x->>'title',x->>'url',n-1 from jsonb_array_elements(p_content->'links') with ordinality a(x,n);
  insert into public.material_page_usages(version_id,method,detail,sort_order)
    select v_id,x->>'method',x->>'detail',n-1 from jsonb_array_elements(p_content->'usages') with ordinality a(x,n);
  insert into public.material_page_timings(version_id,timing)
    select v_id,x::integer from jsonb_array_elements_text(p_content->'timings') a(x);
  insert into public.material_page_certifications(version_id,title,sort_order)
    select v_id,x,n-1 from jsonb_array_elements_text(p_content->'certifications') with ordinality a(x,n);
  if exists(select 1 from jsonb_array_elements(p_content->'images') a(x)
    where x->>'path' not like app.seller_id()::text||'/'||p_material_id::text||'/%') then
    raise exception '別の資材の画像は利用できません' using errcode='42501';
  end if;
  insert into public.material_page_images(version_id,storage_path,alt,sort_order)
    select v_id,x->>'path',x->>'alt',n-1 from jsonb_array_elements(p_content->'images') with ordinality a(x,n);
  return v_id;
end;
$$;
revoke all on function public.save_material_page_version(uuid,uuid,jsonb,boolean) from public,anon;
grant execute on function public.save_material_page_version(uuid,uuid,jsonb,boolean) to authenticated;

create function public.withdraw_material_page_version(p_version_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.material_page_versions v set status='withdrawn'
    where v.id=p_version_id and v.status='pending' and app.is_seller() and v.seller_id=app.seller_id()
      and exists(select 1 from public.material_editor_grants g where g.id=v.grant_id and g.revoked_at is null);
  if not found then raise exception '取り下げできる原稿がありません' using errcode='42501'; end if;
end;
$$;
revoke all on function public.withdraw_material_page_version(uuid) from public,anon;
grant execute on function public.withdraw_material_page_version(uuid) to authenticated;

create function public.review_material_page_version(p_version_id uuid,p_actor_id uuid,p_publish boolean,p_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v public.material_page_versions; m public.materials;
begin
  select * into v from public.material_page_versions where id=p_version_id;
  if not found then raise exception '原稿が見つかりません' using errcode='P0002'; end if;
  select * into m from public.materials where id=v.material_id for update;
  select * into v from public.material_page_versions where id=p_version_id for update;
  if v.status<>'pending' then raise exception 'この版は表現確認中ではありません' using errcode='23505'; end if;
  if not exists(select 1 from public.material_editor_grants g join public.seller_accounts s on s.id=g.seller_id
    where g.id=v.grant_id and g.revoked_at is null and s.status='approved') then
    raise exception '編集権が無効です' using errcode='42501';
  end if;
  if p_publish then
    if v.base_revision<>m.content_revision then raise exception '公開版が変更されています' using errcode='40001'; end if;
    update public.materials set description=v.description,main_components=v.main_components,mechanism=v.mechanism,
      published_page_version_id=v.id,content_revision=content_revision+1,
      manufacturer_verified_at=now(),manufacturer_verified_by_seller_id=v.seller_id,
      manufacturer_verification_method='submitted_update' where id=v.material_id;
  elsif nullif(btrim(p_note),'') is null then
    raise exception '修正が必要な表現を記入してください' using errcode='23514';
  end if;
  update public.material_page_versions set status=case when p_publish then 'published' else 'returned' end,
    reviewed_at=now(),reviewed_by=p_actor_id,review_note=nullif(btrim(p_note),'') where id=v.id;
  return v.material_id;
end;
$$;
revoke all on function public.review_material_page_version(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.review_material_page_version(uuid,uuid,boolean,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('manufacturer-drafts','manufacturer-drafts',false,10485760,array['image/jpeg','image/png','image/webp']);
create policy manufacturer_draft_upload on storage.objects for insert to authenticated with check(
  bucket_id='manufacturer-drafts' and app.is_seller()
  and (storage.foldername(name))[1]=app.seller_id()::text
  and exists(select 1 from public.material_editor_grants g join public.seller_accounts s on s.id=g.seller_id
    where g.material_id::text=(storage.foldername(name))[2] and g.seller_id=app.seller_id()
    and g.revoked_at is null and s.status='approved')
);
create policy manufacturer_draft_read on storage.objects for select to authenticated using(
  bucket_id='manufacturer-drafts' and (app.is_admin() or (app.is_seller()
    and (storage.foldername(name))[1]=app.seller_id()::text
    and exists(select 1 from public.material_editor_grants g where g.material_id::text=(storage.foldername(name))[2]
      and g.seller_id=app.seller_id() and g.revoked_at is null)))
);
