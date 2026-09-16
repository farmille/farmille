-- 公開一覧と冒頭のみを返す。本文・施用条件・定量データはログイン後に取得する。
create function public.list_usage_report_previews()
returns setof public.usage_reports
language sql stable security definer
set search_path = ''
as $$
  select
    r.id, r.material_id, r.author_user_id, r.title, r.status, r.crop_id,
    r.purpose_tags, null::text, null::smallint, null::text, r.variety,
    null::date, null::text, '{}'::text[], null::text, null::text,
    left(r.observed_change, 200), null::text, left(r.summary, 120),
    r.pesticide_ack, r.is_provided_sample, null::text,
    r.published_at, r.created_at, r.updated_at
  from public.usage_reports r
  join public.materials m on m.id = r.material_id
  where r.status = 'published' and m.publication_status = 'published'
$$;
revoke all on function public.list_usage_report_previews() from public;
grant execute on function public.list_usage_report_previews() to anon, authenticated, service_role;

create function app.public_usage_report_cover_id(p_report_id uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select media.id
  from public.usage_report_media media
  join public.usage_reports r on r.id = media.usage_report_id
  join public.materials m on m.id = r.material_id
  where r.id = p_report_id and r.status = 'published'
    and m.publication_status = 'published' and media.media_type = 'photo'
  order by (media.placement = 'cover') desc nulls last, media.sort_order, media.id
  limit 1
$$;
revoke all on function app.public_usage_report_cover_id(uuid) from public;
grant execute on function app.public_usage_report_cover_id(uuid) to anon, authenticated, service_role;

alter policy usage_reports_select_published on public.usage_reports to authenticated;
create policy usage_report_media_select_public_cover on public.usage_report_media
  for select to anon
  using (id = app.public_usage_report_cover_id(usage_report_id));

comment on function public.list_usage_report_previews() is
  '公開済み実証詳細レポートの冒頭200文字・要約120文字と一覧用情報。本文・内部メモは返さない。';
