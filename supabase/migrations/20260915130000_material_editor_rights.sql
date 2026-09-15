-- 編集権の根拠を資材単位で保持する。会社名の一致は候補であり権限ではない。
create table public.material_editor_grants (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete restrict,
  seller_id uuid not null references public.seller_accounts(id) on delete restrict,
  document_reference text not null check (length(btrim(document_reference)) > 0),
  granted_by uuid not null references auth.users(id) on delete restrict,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  check ((revoked_at is null) = (revoked_by is null))
);
create unique index material_editor_grants_active on public.material_editor_grants(material_id)
  where revoked_at is null;
alter table public.material_editor_grants enable row level security;
revoke all on public.material_editor_grants from anon, authenticated;
grant select on public.material_editor_grants to authenticated;
grant select, insert, update on public.material_editor_grants to service_role;
create policy material_editor_grants_read on public.material_editor_grants for select to authenticated
  using (app.is_admin() or (app.is_seller() and seller_id = app.seller_id()));

-- 既存の紐づけは監査用に残すが、書類確認済みの権限には変換しない。
create table public.material_editor_legacy_links (
  material_id uuid primary key references public.materials(id) on delete restrict,
  seller_id uuid not null references public.seller_accounts(id) on delete restrict,
  suspended_at timestamptz not null default now()
);
alter table public.material_editor_legacy_links enable row level security;
revoke all on public.material_editor_legacy_links from anon, authenticated;
grant select on public.material_editor_legacy_links to service_role;
insert into public.material_editor_legacy_links(material_id,seller_id)
  select id,seller_id from public.materials where seller_id is not null;
update public.materials set seller_id = null where seller_id is not null;
update public.material_change_requests set status='cancelled',
  reason=concat_ws(E'\n',reason,'編集権の書類確認のため取り下げ') where status='pending';

create or replace function app.assign_material_manufacturer()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.manufacturers(name) values(new.manufacturer_name) on conflict(name) do nothing;
  if tg_op = 'UPDATE' and new.manufacturer_name is distinct from old.manufacturer_name then
    if old.seller_id is not null then
      raise exception 'メーカー変更前に編集権を解除してください' using errcode = '23514';
    end if;
    new.manufacturer_verified_at := null;
    new.manufacturer_verified_by_seller_id := null;
    new.manufacturer_verification_method := null;
  end if;
  return new;
end;
$$;

create or replace function public.approve_seller_with_manufacturer(
  p_seller_id uuid,p_auth_user_id uuid,p_manufacturer_name text,p_create_manufacturer boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare v_seller public.seller_accounts;
begin
  select * into v_seller from public.seller_accounts where id=p_seller_id for update;
  if not found then raise exception '申請が見つかりません' using errcode='P0002'; end if;
  if v_seller.status <> 'applied' or v_seller.auth_user_id is not null then
    raise exception 'アカウントは発行済みです' using errcode='23505';
  end if;
  if p_create_manufacturer then
    insert into public.manufacturers(name) values(p_manufacturer_name);
  end if;
  perform name from public.manufacturers where name=p_manufacturer_name for update;
  if not found then raise exception 'メーカーが見つかりません' using errcode='P0002'; end if;
  update public.seller_accounts set status='approved',approved_at=now(),auth_user_id=p_auth_user_id,
    manufacturer_name=p_manufacturer_name where id=p_seller_id;
end;
$$;

create function public.set_material_editor_grant(
  p_material_id uuid,p_seller_id uuid,p_document_reference text,p_actor_id uuid
) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform id from public.materials where id=p_material_id for update;
  if not found then raise exception '資材が見つかりません' using errcode='P0002'; end if;
  if p_seller_id is not null then
    if nullif(btrim(p_document_reference),'') is null then
      raise exception '返送書類の保管参照を入力してください' using errcode='23514';
    end if;
    perform id from public.seller_accounts where id=p_seller_id and status='approved' for update;
    if not found then raise exception 'メーカーアカウントを確認してください' using errcode='42501'; end if;
  end if;
  update public.material_editor_grants set revoked_at=now(),revoked_by=p_actor_id
    where material_id=p_material_id and revoked_at is null;
  if p_seller_id is not null then
    insert into public.material_editor_grants(material_id,seller_id,document_reference,granted_by)
      values(p_material_id,p_seller_id,btrim(p_document_reference),p_actor_id);
  end if;
  update public.materials set seller_id=p_seller_id where id=p_material_id;
end;
$$;
revoke all on function public.set_material_editor_grant(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.set_material_editor_grant(uuid,uuid,text,uuid) to service_role;

-- 旧画面やRPCが残っていても書類未確認の資材へ変更を送れないようにする。
create or replace function app.require_approved_seller_for_material_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.seller_accounts where id=new.seller_id and status='approved')
    or not exists(select 1 from public.material_editor_grants
      where material_id=new.material_id and seller_id=new.seller_id and revoked_at is null) then
    raise exception 'この資材の編集権は書類確認が必要です' using errcode='42501';
  end if;
  return new;
end;
$$;

create function app.require_documented_material_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.seller_id is not null and not exists(
    select 1 from public.material_editor_grants
    where material_id=new.id and seller_id=new.seller_id and revoked_at is null
  ) then raise exception '書類確認済みの編集権が必要です' using errcode='42501'; end if;
  return new;
end;
$$;
create trigger materials_documented_owner before insert or update of seller_id on public.materials
  for each row execute function app.require_documented_material_owner();
