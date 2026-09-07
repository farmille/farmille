-- =============================================================================
-- レビューの作目を多対多へ正規化する
-- 正: docs/rebuild/01-domain-model.md §3「投稿」
-- =============================================================================

create table public.review_crops (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  crop_id uuid not null references public.crops (id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_crops_review_crop_unique unique (review_id, crop_id)
);

comment on table public.review_crops is
  'レビューと作目の多対多関連。1レビューに1件以上を必須とし、表示順を保持する。';

create index review_crops_review_id_idx
  on public.review_crops (review_id, sort_order, id);
create index review_crops_crop_id_idx on public.review_crops (crop_id);

-- 既存レビューの単一作目を、順序0の関連行として欠損なく移す。
insert into public.review_crops (
  review_id,
  crop_id,
  sort_order,
  created_at,
  updated_at
)
select
  id,
  crop_id,
  0,
  created_at,
  updated_at
from public.reviews;

drop index public.reviews_crop_id_idx;
alter table public.reviews drop column crop_id;

-- 公開・非公開を問わず、レビューには作目が1件以上必要。
-- 親行と関連行を同一トランザクションで保存できるよう、検査はCOMMIT直前まで遅延する。
create or replace function app.assert_review_has_crops(p_review_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.reviews
    where id = p_review_id
  ) and not exists (
    select 1
    from public.review_crops
    where review_id = p_review_id
  ) then
    raise exception 'review % must have at least one crop', p_review_id
      using errcode = '23514';
  end if;
end;
$$;

create or replace function app.enforce_review_crops_present()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'reviews' then
    perform app.assert_review_has_crops(new.id);
    return null;
  end if;

  if tg_op <> 'INSERT' then
    perform app.assert_review_has_crops(old.review_id);
  end if;

  if tg_op <> 'DELETE'
    and (tg_op <> 'UPDATE' or new.review_id is distinct from old.review_id)
  then
    perform app.assert_review_has_crops(new.review_id);
  end if;

  return null;
end;
$$;

create constraint trigger reviews_require_crop
after insert or update on public.reviews
deferrable initially deferred
for each row execute function app.enforce_review_crops_present();

create constraint trigger review_crops_require_crop
after insert or update or delete on public.review_crops
deferrable initially deferred
for each row execute function app.enforce_review_crops_present();

create or replace function app.assert_review_crop_ids(p_crop_ids uuid[])
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_crop_ids is null
    or cardinality(p_crop_ids) = 0
    or exists (select 1 from unnest(p_crop_ids) as selected(crop_id) where crop_id is null)
    or cardinality(p_crop_ids) <> (
      select count(distinct selected.crop_id)
      from unnest(p_crop_ids) as selected(crop_id)
    )
  then
    raise exception 'crop ids must contain one or more unique, non-null values'
      using errcode = '22023';
  end if;
end;
$$;

-- 親レビューと作目関連を同一トランザクションで作る。
-- SECURITY INVOKERのため、reviews・review_crops双方のRLSが呼び出し元へ適用される。
create or replace function public.create_review_with_crops(
  p_material_id uuid,
  p_author_user_id uuid,
  p_rating smallint,
  p_body text,
  p_crop_ids uuid[],
  p_has_control_plot boolean,
  p_purchase_channel text,
  p_pesticide_ack boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_review_id uuid;
begin
  if auth.role() <> 'service_role'
    and auth.uid() is distinct from p_author_user_id
  then
    raise exception 'review author must match the authenticated user'
      using errcode = '42501';
  end if;

  perform app.assert_review_crop_ids(p_crop_ids);

  insert into public.reviews (
    material_id,
    author_user_id,
    rating,
    body,
    has_control_plot,
    purchase_channel,
    pesticide_ack,
    is_provided_sample,
    status
  ) values (
    p_material_id,
    p_author_user_id,
    p_rating,
    p_body,
    p_has_control_plot,
    p_purchase_channel,
    p_pesticide_ack,
    false,
    'published'
  )
  returning id into v_review_id;

  insert into public.review_crops (review_id, crop_id, sort_order)
  select v_review_id, selected.crop_id, (selected.ordinality - 1)::integer
  from unnest(p_crop_ids) with ordinality as selected(crop_id, ordinality);

  return v_review_id;
end;
$$;

-- レビュー本体と作目関連を原子的に更新する。既存の関連を先に消さず、
-- 希望行をupsertしてから不要行だけを削除する。
create or replace function public.update_review_with_crops(
  p_review_id uuid,
  p_material_id uuid,
  p_author_user_id uuid,
  p_rating smallint,
  p_body text,
  p_crop_ids uuid[],
  p_has_control_plot boolean,
  p_purchase_channel text,
  p_pesticide_ack boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_review_id uuid;
begin
  if auth.role() <> 'service_role'
    and auth.uid() is distinct from p_author_user_id
  then
    raise exception 'review author must match the authenticated user'
      using errcode = '42501';
  end if;

  perform app.assert_review_crop_ids(p_crop_ids);

  update public.reviews
  set
    rating = p_rating,
    body = p_body,
    has_control_plot = p_has_control_plot,
    purchase_channel = p_purchase_channel,
    pesticide_ack = p_pesticide_ack
  where id = p_review_id
    and material_id = p_material_id
    and author_user_id = p_author_user_id
    and status = 'published'
  returning id into v_review_id;

  if v_review_id is null then
    raise exception 'review is not editable'
      using errcode = '42501';
  end if;

  insert into public.review_crops (review_id, crop_id, sort_order)
  select v_review_id, selected.crop_id, (selected.ordinality - 1)::integer
  from unnest(p_crop_ids) with ordinality as selected(crop_id, ordinality)
  on conflict (review_id, crop_id) do update
  set
    sort_order = excluded.sort_order,
    updated_at = now();

  delete from public.review_crops
  where review_id = v_review_id
    and not (crop_id = any (p_crop_ids));

  return v_review_id;
end;
$$;

alter table public.review_crops enable row level security;

grant select on public.review_crops to anon, authenticated;
grant insert, update, delete on public.review_crops to authenticated;
grant select, insert, update, delete on public.review_crops to service_role;

create policy review_crops_select_visible on public.review_crops
  for select to anon, authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id));

create policy review_crops_insert_own on public.review_crops
  for insert to authenticated
  with check (
    app.is_admin_writer()
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.author_user_id = auth.uid() and r.status = 'published'
    )
  );

create policy review_crops_update_own on public.review_crops
  for update to authenticated
  using (
    app.is_admin_writer()
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.author_user_id = auth.uid() and r.status = 'published'
    )
  )
  with check (
    app.is_admin_writer()
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.author_user_id = auth.uid() and r.status = 'published'
    )
  );

create policy review_crops_delete_own on public.review_crops
  for delete to authenticated
  using (
    app.is_admin_writer()
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.author_user_id = auth.uid()
    )
  );

revoke all on function app.assert_review_has_crops(uuid) from public;
revoke all on function app.enforce_review_crops_present() from public;
revoke all on function app.assert_review_crop_ids(uuid[]) from public;

revoke all on function public.create_review_with_crops(
  uuid, uuid, smallint, text, uuid[], boolean, text, boolean
) from public;
grant execute on function public.create_review_with_crops(
  uuid, uuid, smallint, text, uuid[], boolean, text, boolean
) to authenticated, service_role;

revoke all on function public.update_review_with_crops(
  uuid, uuid, uuid, smallint, text, uuid[], boolean, text, boolean
) from public;
grant execute on function public.update_review_with_crops(
  uuid, uuid, uuid, smallint, text, uuid[], boolean, text, boolean
) to authenticated, service_role;

select app.sync_updated_at_triggers();
