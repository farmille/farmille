alter function public.save_material_page_version(uuid,uuid,jsonb,boolean) set schema app;
create function public.save_material_page_version(
  p_material_id uuid,p_content jsonb,p_submit boolean,p_expected_version uuid default null
) returns uuid language sql security invoker set search_path='' as $$
  select app.save_material_page_version(p_material_id,p_expected_version,p_content,p_submit);
$$;
revoke all on function public.save_material_page_version(uuid,jsonb,boolean,uuid) from public,anon;
grant execute on function public.save_material_page_version(uuid,jsonb,boolean,uuid) to authenticated;

create function public.revoke_material_editor_grant(p_material_id uuid,p_actor_id uuid)
returns void language sql security invoker set search_path='' as $$
  select public.set_material_editor_grant(p_material_id,null,'',p_actor_id);
$$;
revoke all on function public.revoke_material_editor_grant(uuid,uuid) from public,anon,authenticated;
grant execute on function public.revoke_material_editor_grant(uuid,uuid) to service_role;

create or replace function app.can_read_material_page_version(p_version_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.material_page_versions v
    join public.materials m on m.id=v.material_id
    where v.id=p_version_id and (
      (m.published_page_version_id=v.id and m.publication_status='published')
      or app.is_admin()
      or (app.is_seller() and v.seller_id=app.seller_id()
        and exists(select 1 from public.material_editor_grants g
          join public.seller_accounts s on s.id=g.seller_id
          where g.id=v.grant_id and g.revoked_at is null and s.status='approved'))
    ));
$$;

-- 権限移行時に残っている原稿は、新しい担当者の作業を塞がない。
create function app.withdraw_revoked_editor_versions()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.revoked_at is null and new.revoked_at is not null then
    update public.material_page_versions set status='withdrawn'
      where grant_id=new.id and status in ('draft','pending');
  end if;
  return new;
end;
$$;
create trigger withdraw_revoked_editor_versions after update of revoked_at on public.material_editor_grants
  for each row execute function app.withdraw_revoked_editor_versions();

create function app.validate_material_page_image()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.storage_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp)$'
    or not exists(select 1 from storage.objects where bucket_id='manufacturer-drafts' and name=new.storage_path) then
    raise exception 'アップロード済みの製品画像を選択してください' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger validate_material_page_image before insert on public.material_page_images
  for each row execute function app.validate_material_page_image();

drop policy manufacturer_draft_read on storage.objects;
create policy manufacturer_draft_read on storage.objects for select to authenticated using(
  bucket_id='manufacturer-drafts' and (app.is_admin() or (app.is_seller()
    and (storage.foldername(name))[1]=app.seller_id()::text
    and exists(select 1 from public.material_editor_grants g join public.seller_accounts s on s.id=g.seller_id
      where g.material_id::text=(storage.foldername(name))[2] and g.seller_id=app.seller_id()
      and g.revoked_at is null and s.status='approved')))
);
