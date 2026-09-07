-- 非公開資材は履歴を保持し、管理権限を持つメーカーと運営だけが参照する。
drop policy materials_select_all on public.materials;
create policy materials_select_visible on public.materials
  for select to anon, authenticated
  using (
    publication_status = 'published'
    or app.is_admin()
    or (app.is_seller() and seller_id = app.seller_id())
  );

-- メーカー変更でclaimを付け替える際は、以前のメーカーによる確認を引き継がない。
create or replace function app.assign_material_manufacturer()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.manufacturers(name) values (new.manufacturer_name)
    on conflict (name) do nothing;
  if (tg_op = 'INSERT' and new.seller_id is null)
    or (tg_op = 'UPDATE' and new.manufacturer_name is distinct from old.manufacturer_name) then
    select id into new.seller_id from public.seller_accounts
      where manufacturer_name = new.manufacturer_name and status in ('approved', 'suspended');
    if tg_op = 'UPDATE' then
      new.manufacturer_verified_at := null;
      new.manufacturer_verified_by_seller_id := null;
      new.manufacturer_verification_method := null;
    end if;
  end if;
  return new;
end;
$$;
