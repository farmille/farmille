-- レビューの作目を1件に限定し、画面仕様とDB制約を一致させる。

-- 既存データに複数作目がある場合は、表示順が先頭の1件を正として残す。
with ranked_review_crops as (
  select
    id,
    row_number() over (
      partition by review_id
      order by sort_order, created_at, id
    ) as position
  from public.review_crops
)
delete from public.review_crops
where id in (
  select id
  from ranked_review_crops
  where position > 1
);

alter table public.review_crops
  drop constraint review_crops_review_crop_unique;

alter table public.review_crops
  add constraint review_crops_review_id_unique unique (review_id);

comment on table public.review_crops is
  'レビューの対象作目。1レビューにつき必ず1行だけを保持する。';

create or replace function app.assert_review_crop_ids(p_crop_ids uuid[])
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_crop_ids is null
    or cardinality(p_crop_ids) <> 1
    or p_crop_ids[1] is null
  then
    raise exception 'crop ids must contain exactly one non-null value'
      using errcode = '22023';
  end if;
end;
$$;

create or replace function public.update_review_with_crops(
  p_review_id uuid,
  p_material_id uuid,
  p_author_user_id uuid,
  p_rating smallint,
  p_body text,
  p_crop_ids uuid[],
  p_has_control_plot boolean,
  p_pesticide_ack boolean,
  p_purchase_channel text default null
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
  values (v_review_id, p_crop_ids[1], 0)
  on conflict (review_id) do update
  set
    crop_id = excluded.crop_id,
    sort_order = 0,
    updated_at = now();

  return v_review_id;
end;
$$;
