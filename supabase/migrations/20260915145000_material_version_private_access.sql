create function app.can_read_private_material_version(p_version_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select app.is_admin_writer() or exists(select 1 from public.material_page_versions v
    join public.material_editor_grants g on g.id=v.grant_id
    join public.seller_accounts s on s.id=g.seller_id
    where v.id=p_version_id and app.is_seller() and v.seller_id=app.seller_id()
      and g.revoked_at is null and s.status='approved');
$$;
drop policy material_page_versions_read on public.material_page_versions;
create policy material_page_versions_read on public.material_page_versions for select
  using(app.can_read_private_material_version(id));
