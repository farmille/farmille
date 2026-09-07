-- Supabase生成型でも購入場所の省略可能性を表現できるよう、既定値付きの末尾引数にする。

drop function public.create_review_with_crops(
  uuid, uuid, smallint, text, uuid[], boolean, text, boolean
);

create function public.create_review_with_crops(
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

drop function public.update_review_with_crops(
  uuid, uuid, uuid, smallint, text, uuid[], boolean, text, boolean
);

create function public.update_review_with_crops(
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

revoke all on function public.create_review_with_crops(
  uuid, uuid, smallint, text, uuid[], boolean, boolean, text
) from public;
grant execute on function public.create_review_with_crops(
  uuid, uuid, smallint, text, uuid[], boolean, boolean, text
) to authenticated, service_role;

revoke all on function public.update_review_with_crops(
  uuid, uuid, uuid, smallint, text, uuid[], boolean, boolean, text
) from public;
grant execute on function public.update_review_with_crops(
  uuid, uuid, uuid, smallint, text, uuid[], boolean, boolean, text
) to authenticated, service_role;
