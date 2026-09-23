-- 退役した入力は受け取っても保存せず、既存の値は編集時にも保持する。

create or replace function public.create_review_with_crops(
  p_material_id uuid,
  p_author_user_id uuid,
  p_rating smallint,
  p_body text,
  p_crop_ids uuid[],
  p_has_control_plot boolean default null,
  p_pesticide_ack boolean default false,
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
    null,
    null,
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

create or replace function public.update_review_with_crops(
  p_review_id uuid,
  p_material_id uuid,
  p_author_user_id uuid,
  p_rating smallint,
  p_body text,
  p_crop_ids uuid[],
  p_has_control_plot boolean default null,
  p_pesticide_ack boolean default false,
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
