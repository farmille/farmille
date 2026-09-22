create table public.material_page_registrations (
  version_id uuid not null references public.material_page_versions(id) on delete cascade,
  kind text not null check (kind in ('pesticide', 'fertilizer', 'soil_amendment')),
  company_name text not null check (length(company_name) <= 500),
  effects text not null default '' check (length(effects) <= 20000),
  primary key (version_id, kind)
);

create table public.material_page_related_companies (
  version_id uuid not null references public.material_page_versions(id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  company_name text not null check (length(company_name) <= 500),
  primary key (version_id, sort_order)
);

do $$ declare t text; begin
  foreach t in array array['material_page_registrations', 'material_page_related_companies'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant select, insert on public.%I to service_role', t);
    execute format('create policy %I on public.%I for select using(app.can_read_material_page_version(version_id))', t || '_read', t);
  end loop;
end $$;

alter table public.material_page_versions add column content_contract smallint not null default 1 check (content_contract in (1,2));

insert into public.material_page_related_companies(version_id, sort_order, company_name)
  select v.id, 0, m.manufacturer_name from public.material_page_versions v
  join public.materials m on m.id = v.material_id;

alter table public.material_page_links alter column group_name drop not null;
alter table public.material_page_links drop constraint material_page_links_group_name_check;
alter table public.material_page_links add constraint material_page_links_group_name_check
  check (group_name in ('overview','safety','technical','public_trial','other_trial'));
alter table public.material_page_links
  add column trial_crops text check (length(trial_crops) <= 500),
  add column trial_summary text check (length(trial_summary) <= 20000),
  add column trial_institution text check (length(trial_institution) <= 500),
  add column trial_year integer check (trial_year between 1 and 9999),
  add column trial_page_count integer check (trial_page_count > 0),
  add constraint material_page_links_trial_group_check check (
    coalesce(group_name in ('public_trial','other_trial'), false)
    or (trial_crops is null and trial_summary is null and trial_institution is null
      and trial_year is null and trial_page_count is null)
  );

create function app.assert_material_page_submission(p_version_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.material_page_versions where id=p_version_id and nullif(btrim(description),'') is null)
    or exists(select 1 from public.material_page_links where version_id=p_version_id and (
      group_name is null or nullif(btrim(title),'') is null or url !~ '^https?://[^[:space:]/?#]+'
      or (group_name in ('public_trial','other_trial') and
        (nullif(btrim(trial_summary),'') is null or nullif(btrim(trial_institution),'') is null))))
    or exists(select 1 from public.material_page_links where version_id=p_version_id group by btrim(url) having count(*)>1)
    or exists(select 1 from public.material_page_certifications where version_id=p_version_id and nullif(btrim(title),'') is null)
    or exists(select 1 from public.material_page_registrations where version_id=p_version_id and nullif(btrim(company_name),'') is null)
    or exists(select 1 from public.material_page_related_companies where version_id=p_version_id and nullif(btrim(company_name),'') is null)
    or exists(select 1 from public.material_page_related_companies where version_id=p_version_id group by btrim(company_name) having count(*)>1)
  then raise exception '製品説明・資料の分類と試験情報・登録事業者・関係会社を確認してください' using errcode='23514'; end if;
end;
$$;
revoke all on function app.assert_material_page_submission(uuid) from public,anon,authenticated;

create or replace function public.save_material_page_version(
  p_material_id uuid,p_content jsonb,p_submit boolean,p_expected_version uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_version_id uuid; uploaded jsonb; entry jsonb; k text; v_contract smallint;
begin
  if not app.is_seller() then raise exception 'メーカーログインが必要です' using errcode='42501'; end if;
  if jsonb_typeof(p_content) is distinct from 'object' then
    raise exception '原稿の形式が不正です' using errcode='23514'; end if;
  perform id from public.materials where id=p_material_id for update;
  if p_content ?& array['registrations','relatedCompanies'] then
    v_contract := 2;
  elsif p_content ?| array['registrations','relatedCompanies'] then
    raise exception '原稿の項目が不足しています' using errcode='23514';
  else
    if exists(select 1 from public.material_page_versions where material_id=p_material_id and content_contract=2) then
      raise exception '入力を控えてから再読み込みしてください' using errcode='40001'; end if;
    if jsonb_typeof(p_content->'links') is distinct from 'array' then
      raise exception '資料の形式が不正です' using errcode='23514'; end if;
    if exists(select 1 from jsonb_array_elements(p_content->'links') a(x) where
      jsonb_typeof(x->'group') is distinct from 'string' or x->>'group' not in ('overview','safety','technical')
      or (x ? 'trial' and x->'trial'<>'null'::jsonb)) then
      raise exception '再読み込みして資料の分類を確認してください' using errcode='40001'; end if;
    p_content := p_content || jsonb_build_object(
      'links',(select coalesce(jsonb_agg(x || '{"trial":null}'::jsonb order by n),'[]'::jsonb) from jsonb_array_elements(p_content->'links') with ordinality a(x,n)),
      'registrations','[]'::jsonb,
      'relatedCompanies',(select jsonb_build_array(manufacturer_name) from public.materials where id=p_material_id));
    v_contract := 1;
  end if;
  foreach k in array array['links','images','usages','timings','certifications','registrations','relatedCompanies'] loop
    if jsonb_typeof(p_content->k) is distinct from 'array' then
      raise exception '原稿の項目形式が不正です' using errcode='23514';
    end if;
  end loop;
  foreach k in array array['description','mainComponents','mechanism'] loop
    if jsonb_typeof(p_content->k) is distinct from 'string' or length(p_content->>k)>20000 then
      raise exception '原稿の文章形式が不正です' using errcode='23514';
    end if;
  end loop;
  for entry in select value from jsonb_array_elements(p_content->'links') loop
    if jsonb_typeof(entry) is distinct from 'object' or not (entry ?& array['group','title','url','trial'])
      or jsonb_typeof(entry->'title') is distinct from 'string' or jsonb_typeof(entry->'url') is distinct from 'string'
      or (entry->'group'<>'null'::jsonb and (jsonb_typeof(entry->'group') is distinct from 'string'
        or entry->>'group' not in ('overview','safety','technical','public_trial','other_trial')))
    then raise exception '資料の形式が不正です' using errcode='23514'; end if;
    if entry->>'group' in ('public_trial','other_trial') then
      if jsonb_typeof(entry->'trial') is distinct from 'object' or not ((entry->'trial') ?& array['crops','summary','institution','year','pageCount']) then
        raise exception '試験情報の形式が不正です' using errcode='23514'; end if;
      foreach k in array array['crops','summary','institution'] loop
        if jsonb_typeof(entry->'trial'->k) is distinct from 'string' then
          raise exception '試験情報の文章形式が不正です' using errcode='23514'; end if;
      end loop;
      foreach k in array array['year','pageCount'] loop
        if entry->'trial'->k<>'null'::jsonb and
          (jsonb_typeof(entry->'trial'->k) is distinct from 'number' or (entry->'trial'->>k) !~ '^[0-9]+$') then
          raise exception '試験の年・ページ数は整数で入力してください' using errcode='23514'; end if;
      end loop;
    elsif entry->'trial'<>'null'::jsonb then
      raise exception '試験結果以外の資料に試験情報は設定できません' using errcode='23514';
    end if;
  end loop;
  for entry in select value from jsonb_array_elements(p_content->'registrations') loop
    if jsonb_typeof(entry) is distinct from 'object' or jsonb_typeof(entry->'kind') is distinct from 'string'
      or entry->>'kind' not in ('pesticide','fertilizer','soil_amendment')
      or jsonb_typeof(entry->'companyName') is distinct from 'string' or jsonb_typeof(entry->'effects') is distinct from 'string'
    then raise exception '登録情報の形式が不正です' using errcode='23514'; end if;
  end loop;
  foreach k in array array['relatedCompanies','certifications'] loop
    if exists(select 1 from jsonb_array_elements(p_content->k) a(value) where jsonb_typeof(value) is distinct from 'string') then
      raise exception '会社・認証の形式が不正です' using errcode='23514'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(p_content->'images') a(x) where
    jsonb_typeof(x) is distinct from 'object' or jsonb_typeof(x->'path') is distinct from 'string'
    or jsonb_typeof(x->'alt') is distinct from 'string' or length(x->>'alt')>20000) then
    raise exception '画像の形式が不正です' using errcode='23514'; end if;
  if exists(select 1 from jsonb_array_elements(p_content->'usages') a(x) where
    jsonb_typeof(x) is distinct from 'object' or jsonb_typeof(x->'method') is distinct from 'string'
    or jsonb_typeof(x->'detail') is distinct from 'string' or length(x->>'detail')>20000) then
    raise exception '施用方法の形式が不正です' using errcode='23514'; end if;
  if exists(select 1 from jsonb_array_elements(p_content->'timings') a(x) where
    jsonb_typeof(x) is distinct from 'number' or x::text !~ '^[0-7]$') then
    raise exception '施用時期の形式が不正です' using errcode='23514'; end if;
  if exists(select 1 from jsonb_array_elements(p_content->'images') a(x)
    where x->>'path' like 'legacy:%' and not exists(select 1 from public.material_images i
      where i.id::text=substring(x->>'path' from 8) and i.material_id=p_material_id)) then
    raise exception '別の資材の画像は利用できません' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(x order by n),'[]'::jsonb) into uploaded
    from jsonb_array_elements(p_content->'images') with ordinality a(x,n) where x->>'path' not like 'legacy:%';
  v_version_id := app.save_material_page_version(p_material_id,p_expected_version,jsonb_set(p_content,'{images}',uploaded),p_submit);
  if (select count(*) from jsonb_array_elements(p_content->'images') a(x)) <>
     (select count(distinct x->>'path') from jsonb_array_elements(p_content->'images') a(x)) then
    raise exception '同じ画像を重複して指定できません' using errcode='23514';
  end if;
  update public.material_page_images set sort_order=sort_order+1000000 where material_page_images.version_id=v_version_id;
  update public.material_page_images i set sort_order=a.n-1 from jsonb_array_elements(p_content->'images') with ordinality a(x,n)
    where i.version_id=v_version_id and i.storage_path=a.x->>'path';
  insert into public.material_page_existing_images(version_id,image_id,alt,sort_order)
    select v_version_id,i.id,x->>'alt',n-1 from jsonb_array_elements(p_content->'images') with ordinality a(x,n)
    join public.material_images i on i.id::text=substring(x->>'path' from 8) and i.material_id=p_material_id
    where x->>'path' like 'legacy:%';
  update public.material_page_links l set trial_crops=a.x->'trial'->>'crops',trial_summary=a.x->'trial'->>'summary',
    trial_institution=a.x->'trial'->>'institution',trial_year=(a.x->'trial'->>'year')::integer,
    trial_page_count=(a.x->'trial'->>'pageCount')::integer
    from jsonb_array_elements(p_content->'links') with ordinality a(x,n) where l.version_id=v_version_id and l.sort_order=a.n-1;
  insert into public.material_page_registrations(version_id,kind,company_name,effects)
    select v_version_id,x->>'kind',x->>'companyName',x->>'effects' from jsonb_array_elements(p_content->'registrations') a(x);
  insert into public.material_page_related_companies(version_id,sort_order,company_name)
    select v_version_id,n-1,x from jsonb_array_elements_text(p_content->'relatedCompanies') with ordinality a(x,n);
  update public.material_page_versions set content_contract=v_contract where id=v_version_id;
  if p_submit then perform app.assert_material_page_submission(v_version_id); end if;
  return v_version_id;
end;
$$;
revoke all on function public.save_material_page_version(uuid,jsonb,boolean,uuid) from public,anon;
grant execute on function public.save_material_page_version(uuid,jsonb,boolean,uuid) to authenticated;

create or replace function public.review_material_page_version(p_version_id uuid,p_actor_id uuid,p_publish boolean,p_note text)
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
    perform app.assert_material_page_submission(p_version_id);
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
