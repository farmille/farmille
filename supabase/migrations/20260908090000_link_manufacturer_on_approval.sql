-- メーカーの同一性と、資材ごとの操作権限（claim）を分けて管理する。
create table public.manufacturers (
  name text primary key check (length(btrim(name)) > 0),
  created_at timestamptz not null default now()
);
alter table public.manufacturers enable row level security;
revoke all on public.manufacturers from anon, authenticated;
grant all on public.manufacturers to service_role;

insert into public.manufacturers(name)
select distinct manufacturer_name from public.materials;

alter table public.materials add constraint materials_manufacturer_name_fkey
  foreign key (manufacturer_name) references public.manufacturers(name) on update cascade;
alter table public.seller_accounts add column manufacturer_name text unique
  references public.manufacturers(name) on update cascade;

-- 運営が後から資材を登録した場合も、既存メーカーのアカウントにclaimを付与する。
create function app.assign_material_manufacturer()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.manufacturers(name) values (new.manufacturer_name)
    on conflict (name) do nothing;
  if (tg_op = 'INSERT' and new.seller_id is null)
    or (tg_op = 'UPDATE' and new.manufacturer_name is distinct from old.manufacturer_name) then
    select id into new.seller_id from public.seller_accounts
      where manufacturer_name = new.manufacturer_name and status = 'approved';
  end if;
  return new;
end;
$$;
create trigger materials_assign_manufacturer before insert or update of manufacturer_name
  on public.materials for each row execute function app.assign_material_manufacturer();

-- Auth発行後、申請状態・メーカー紐づけ・既存資材の権限を一括で確定する。
create function public.approve_seller_with_manufacturer(
  p_seller_id uuid, p_auth_user_id uuid, p_manufacturer_name text, p_create_manufacturer boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_seller public.seller_accounts;
begin
  select * into v_seller from public.seller_accounts where id = p_seller_id for update;
  if not found then raise exception '申請が見つかりません' using errcode = 'P0002'; end if;
  if v_seller.status <> 'applied' or v_seller.auth_user_id is not null then
    raise exception '申請は審査済みです' using errcode = '23505';
  end if;
  if p_manufacturer_name is null or length(btrim(p_manufacturer_name)) = 0 then
    raise exception 'メーカーを指定してください' using errcode = '22023';
  end if;
  if p_create_manufacturer then
    insert into public.manufacturers(name) values (p_manufacturer_name);
  end if;
  perform name from public.manufacturers where name = p_manufacturer_name for update;
  if not found then raise exception 'メーカーが見つかりません' using errcode = 'P0002'; end if;
  if exists(select 1 from public.materials where manufacturer_name = p_manufacturer_name
    and seller_id is not null and seller_id <> p_seller_id) then
    raise exception '別アカウントに紐づく資材があります' using errcode = '23505';
  end if;
  update public.seller_accounts set status = 'approved', approved_at = now(),
    auth_user_id = p_auth_user_id, manufacturer_name = p_manufacturer_name where id = p_seller_id;
  update public.materials set seller_id = p_seller_id
    where manufacturer_name = p_manufacturer_name and seller_id is null;
end;
$$;
revoke all on function public.approve_seller_with_manufacturer(uuid, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.approve_seller_with_manufacturer(uuid, uuid, text, boolean) to service_role;
