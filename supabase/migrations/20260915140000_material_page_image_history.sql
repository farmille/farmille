alter table public.material_images add column is_current boolean not null default true;
create table public.material_page_existing_images (
  version_id uuid not null references public.material_page_versions(id) on delete restrict,
  image_id uuid not null references public.material_images(id) on delete restrict,
  alt text not null default '',
  sort_order integer not null check(sort_order>=0),
  primary key(version_id,image_id),
  unique(version_id,sort_order)
);
alter table public.material_page_existing_images enable row level security;
revoke all on public.material_page_existing_images from anon,authenticated;
grant select on public.material_page_existing_images to anon,authenticated;
grant select,insert on public.material_page_existing_images to service_role;
create policy material_page_existing_images_read on public.material_page_existing_images for select
  using(app.can_read_material_page_version(version_id));

create or replace function public.save_material_page_version(
  p_material_id uuid,p_content jsonb,p_submit boolean,p_expected_version uuid default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare version_id uuid; uploaded jsonb;
begin
  if exists(select 1 from jsonb_array_elements(p_content->'images') a(x)
    where x->>'path' like 'legacy:%' and not exists(select 1 from public.material_images i
      where i.id::text=substring(x->>'path' from 8) and i.material_id=p_material_id)) then
    raise exception '別の資材の画像は利用できません' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(x order by n),'[]'::jsonb) into uploaded
    from jsonb_array_elements(p_content->'images') with ordinality a(x,n) where x->>'path' not like 'legacy:%';
  version_id := app.save_material_page_version(p_material_id,p_expected_version,jsonb_set(p_content,'{images}',uploaded),p_submit);
  -- 同じ画像を2回使わず、既存画像と追加画像の並び順を共通で保存する。
  if (select count(*) from jsonb_array_elements(p_content->'images') a(x)) <>
     (select count(distinct x->>'path') from jsonb_array_elements(p_content->'images') a(x)) then
    raise exception '同じ画像を重複して指定できません' using errcode='23514';
  end if;
  set constraints all deferred;
  update public.material_page_images set sort_order=sort_order+1000000 where material_page_images.version_id=version_id;
  update public.material_page_images i set sort_order=a.n-1 from jsonb_array_elements(p_content->'images') with ordinality a(x,n)
    where i.version_id=version_id and i.storage_path=a.x->>'path';
  insert into public.material_page_existing_images(version_id,image_id,alt,sort_order)
    select version_id,i.id,x->>'alt',n-1 from jsonb_array_elements(p_content->'images') with ordinality a(x,n)
    join public.material_images i on i.id::text=substring(x->>'path' from 8) and i.material_id=p_material_id
    where x->>'path' like 'legacy:%';
  return version_id;
end;
$$;
revoke all on function public.save_material_page_version(uuid,jsonb,boolean,uuid) from public,anon;
grant execute on function public.save_material_page_version(uuid,jsonb,boolean,uuid) to authenticated;

create function app.publish_material_page_images()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.published_page_version_id is distinct from old.published_page_version_id and new.published_page_version_id is not null then
    update public.material_images set is_current=false where material_id=new.id;
    update public.material_images i set is_current=true,sort_order=e.sort_order
      from public.material_page_existing_images e where e.version_id=new.published_page_version_id and e.image_id=i.id;
    insert into public.material_images(material_id,url,image_type,sort_order)
      select new.id,'/api/material-images/'||i.id::text,'package',i.sort_order
      from public.material_page_images i where i.version_id=new.published_page_version_id;
  end if;
  return new;
end;
$$;
create trigger publish_material_page_images after update of published_page_version_id on public.materials
  for each row execute function app.publish_material_page_images();
