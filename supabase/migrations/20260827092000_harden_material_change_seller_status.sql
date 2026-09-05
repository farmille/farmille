-- JWT が更新される前に出品者が凍結された場合も、DB上の承認状態を最終防御にする。

create or replace function app.require_approved_seller_for_material_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.seller_accounts
    where id = new.seller_id and status = 'approved'
  ) then
    raise exception '承認済み出品者ではありません' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger material_change_requests_require_approved_seller
  before insert on public.material_change_requests
  for each row execute function app.require_approved_seller_for_material_change();

create or replace function public.confirm_material_information(p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller_id uuid := app.seller_id();
begin
  if not app.is_seller() then
    raise exception '出品者ログインが必要です' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.seller_accounts
    where id = v_seller_id and status = 'approved'
  ) then
    raise exception '承認済み出品者ではありません' using errcode = '42501';
  end if;

  update public.materials
  set manufacturer_verified_at = now(),
      manufacturer_verified_by_seller_id = v_seller_id,
      manufacturer_verification_method = 'confirmed_existing'
  where id = p_material_id
    and seller_id = v_seller_id;

  if not found then
    raise exception '自社資材が見つかりません' using errcode = 'P0002';
  end if;
end;
$$;
