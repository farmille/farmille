-- 確認メモ・担当者・書類参照は公開本文へ含めない。
create view public.public_material_page_versions as
  select v.id,v.material_id,v.description,v.main_components,v.mechanism
  from public.material_page_versions v join public.materials m on m.published_page_version_id=v.id
  where m.publication_status='published';
revoke all on public.public_material_page_versions from public,anon,authenticated;
grant select on public.public_material_page_versions to anon,authenticated,service_role;
drop policy material_page_versions_read on public.material_page_versions;
create policy material_page_versions_read on public.material_page_versions for select using(
  app.is_admin_writer() or (app.is_seller() and seller_id=app.seller_id()
    and exists(select 1 from public.material_editor_grants g join public.seller_accounts s on s.id=g.seller_id
      where g.id=material_page_versions.grant_id and g.revoked_at is null and s.status='approved'))
);
