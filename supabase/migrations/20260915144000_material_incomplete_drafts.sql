alter table public.material_page_links drop constraint material_page_links_title_check;
alter table public.material_page_links drop constraint material_page_links_url_check;
alter table public.material_page_links add constraint material_page_links_title_length check(length(title)<=500);
alter table public.material_page_links add constraint material_page_links_url_length check(length(url)<=4000);
alter table public.material_page_certifications drop constraint material_page_certifications_title_check;
alter table public.material_page_certifications add constraint material_page_certifications_title_length check(length(title)<=500);
create or replace function public.save_material_page_version(
  p_material_id uuid,p_content jsonb,p_submit boolean,p_expected_version uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_version_id uuid; uploaded jsonb;
begin
  if p_submit and (
    nullif(btrim(p_content->>'description'),'') is null
    or exists(select 1 from jsonb_array_elements(p_content->'links') a(x)
      where nullif(btrim(x->>'title'),'') is null or coalesce(x->>'url','') !~ '^https?://[^[:space:]/?#]+')
    or exists(select 1 from jsonb_array_elements_text(p_content->'certifications') a(x) where nullif(btrim(x),'') is null)
  ) then raise exception '製品説明・資料のタイトルとURL・登録認証を確認してください' using errcode='23514'; end if;
  if exists(select 1 from jsonb_array_elements(p_content->'images') a(x)
    where x->>'path' like 'legacy:%' and not exists(select 1 from public.material_images i
      where i.id::text=substring(x->>'path' from 8) and i.material_id=p_material_id)) then
    raise exception '別の資材の画像は利用できません' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(x order by n),'[]'::jsonb) into uploaded
    from jsonb_array_elements(p_content->'images') with ordinality a(x,n) where x->>'path' not like 'legacy:%';
  v_version_id := app.save_material_page_version(p_material_id,p_expected_version,jsonb_set(p_content,'{images}',uploaded),p_submit);
  -- 同じ画像を2回使わず、既存画像と追加画像の並び順を共通で保存する。
  if (select count(*) from jsonb_array_elements(p_content->'images') a(x)) <>
     (select count(distinct x->>'path') from jsonb_array_elements(p_content->'images') a(x)) then
    raise exception '同じ画像を重複して指定できません' using errcode='23514';
  end if;
  update public.material_page_images set sort_order=sort_order+1000000 where material_page_images.version_id=v_version_id;
  update public.material_page_images i set sort_order=a.n-1 from jsonb_array_elements(p_content->'images') with ordinality a(x,n)
    where i.version_id=version_id and i.storage_path=a.x->>'path';
  insert into public.material_page_existing_images(version_id,image_id,alt,sort_order)
    select v_version_id,i.id,x->>'alt',n-1 from jsonb_array_elements(p_content->'images') with ordinality a(x,n)
    join public.material_images i on i.id::text=substring(x->>'path' from 8) and i.material_id=p_material_id
    where x->>'path' like 'legacy:%';
  return v_version_id;
end;
$$;
revoke all on function public.save_material_page_version(uuid,jsonb,boolean,uuid) from public,anon;
grant execute on function public.save_material_page_version(uuid,jsonb,boolean,uuid) to authenticated;
