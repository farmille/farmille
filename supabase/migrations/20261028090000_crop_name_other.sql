-- 使用対象作目の「その他」（作物マスタにない作目の自由記入）。
-- 所属（profile_affiliations）と同じく名前を各行に直接持ち、作物マスタ（crops）には加えない。
-- 1行には作物マスタのIDか名前のどちらか一方だけを持つ。資材情報の作物（material_crops）と検索は対象外。

-- 感想口コミ：1口コミにつき1行のまま、作物IDか名前のどちらかを持つ。
alter table public.review_crops
  alter column crop_id drop not null,
  add column crop_name_other text,
  add constraint review_crops_crop_name_other_length
    check (char_length(btrim(crop_name_other)) between 1 and 100),
  add constraint review_crops_crop_or_name
    check (num_nonnulls(crop_id, crop_name_other) = 1);

comment on column public.review_crops.crop_name_other is
  '作物マスタにない作目の自由記入。crop_id とどちらか一方だけを持つ。';

-- プロフィール：作物IDの行と名前の行を混ぜて複数持つ。主キーを行ごとのIDに替え、作物IDの重複だけを禁止する。
alter table public.profile_crops drop constraint profile_crops_pkey;

alter table public.profile_crops
  add column id uuid not null default gen_random_uuid() primary key,
  alter column crop_id drop not null,
  add column crop_name_other text,
  add constraint profile_crops_user_crop_unique unique (user_id, crop_id),
  add constraint profile_crops_crop_name_other_length
    check (char_length(btrim(crop_name_other)) between 1 and 100),
  add constraint profile_crops_crop_or_name
    check (num_nonnulls(crop_id, crop_name_other) = 1);

comment on column public.profile_crops.crop_name_other is
  '作物マスタにない作目の自由記入。crop_id とどちらか一方だけを持つ。';

-- 実証詳細レポート：下書きでは両方空でよく、提出時はどちらか一方が要る。
alter table public.usage_reports
  add column crop_name_other text,
  add constraint usage_reports_crop_name_other_length
    check (char_length(btrim(crop_name_other)) between 1 and 100),
  add constraint usage_reports_crop_or_name
    check (crop_id is null or crop_name_other is null),
  drop constraint usage_reports_submission_basics,
  add constraint usage_reports_submission_basics
    check (status = 'draft' or ((crop_id is not null or crop_name_other is not null) and pesticide_ack));

comment on column public.usage_reports.crop_name_other is
  '作物マスタにない作目の自由記入。crop_id と同時には持たない。';

-- 口コミの作目は、作物IDを1つか、名前を1つのどちらか。
create function app.assert_review_crop(p_crop_ids uuid[], p_crop_name_other text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_crop_ids is null
    or array_position(p_crop_ids, null) is not null
    or (cardinality(p_crop_ids) = 1) = (nullif(btrim(p_crop_name_other), '') is not null)
    or cardinality(p_crop_ids) > 1
  then
    raise exception 'review must have exactly one crop id or crop name'
      using errcode = '22023';
  end if;
end;
$$;

-- SECURITY INVOKER の口コミRPCから呼ぶので、旧 assert_review_crop_ids と同じく実行を許す。
revoke all on function app.assert_review_crop(uuid[], text) from public;
grant execute on function app.assert_review_crop(uuid[], text) to authenticated, service_role;

-- 名前の引数は最後に足し、省略時は今までどおり作物IDだけで保存する。
drop function public.create_review_with_crops(uuid, uuid, smallint, text, uuid[], boolean, boolean, text);
drop function public.update_review_with_crops(uuid, uuid, uuid, smallint, text, uuid[], boolean, boolean, text);
drop function app.assert_review_crop_ids(uuid[]);

create function public.create_review_with_crops(
  p_material_id uuid,
  p_author_user_id uuid,
  p_rating smallint,
  p_body text,
  p_crop_ids uuid[],
  p_has_control_plot boolean default null,
  p_pesticide_ack boolean default false,
  p_purchase_channel text default null,
  p_crop_name_other text default null
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

  perform app.assert_review_crop(p_crop_ids, p_crop_name_other);

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

  insert into public.review_crops (review_id, crop_id, crop_name_other, sort_order)
  values (v_review_id, p_crop_ids[1], nullif(btrim(p_crop_name_other), ''), 0);

  return v_review_id;
end;
$$;

create function public.update_review_with_crops(
  p_review_id uuid,
  p_material_id uuid,
  p_author_user_id uuid,
  p_rating smallint,
  p_body text,
  p_crop_ids uuid[],
  p_has_control_plot boolean default null,
  p_pesticide_ack boolean default false,
  p_purchase_channel text default null,
  p_crop_name_other text default null
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

  perform app.assert_review_crop(p_crop_ids, p_crop_name_other);

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

  insert into public.review_crops (review_id, crop_id, crop_name_other, sort_order)
  values (v_review_id, p_crop_ids[1], nullif(btrim(p_crop_name_other), ''), 0)
  on conflict (review_id) do update
  set
    crop_id = excluded.crop_id,
    crop_name_other = excluded.crop_name_other,
    sort_order = 0,
    updated_at = now();

  return v_review_id;
end;
$$;

revoke all on function public.create_review_with_crops(
  uuid, uuid, smallint, text, uuid[], boolean, boolean, text, text
) from public;
grant execute on function public.create_review_with_crops(
  uuid, uuid, smallint, text, uuid[], boolean, boolean, text, text
) to authenticated, service_role;
revoke all on function public.update_review_with_crops(
  uuid, uuid, uuid, smallint, text, uuid[], boolean, boolean, text, text
) from public;
grant execute on function public.update_review_with_crops(
  uuid, uuid, uuid, smallint, text, uuid[], boolean, boolean, text, text
) to authenticated, service_role;

-- プロフィール：作物IDの後ろに名前を並べて保存する。名前は前後の空白を除き、空は受け付けない。
-- 名前の引数を省略（null）した呼び出しは、保存済みの名前の行をそのまま残す。
drop function public.save_profile_details(text, text, text[], uuid[], text[]);

create function public.save_profile_details(
  p_handle text, p_bio text, p_affiliations text[], p_crop_ids uuid[], p_links text[],
  p_crop_names_other text[] default null
) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not app.can_use_general_features() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(btrim(p_handle)) not between 1 and 30 or char_length(p_bio) > 2000
    or cardinality(p_affiliations) > 20 or cardinality(p_crop_ids) > 50 or cardinality(p_links) > 10
    or cardinality(p_crop_names_other) > 50
  then raise exception 'invalid profile' using errcode = '22023'; end if;
  update public.profiles set handle = btrim(p_handle) where user_id = uid;
  if not found then raise exception 'profile not found'; end if;
  insert into public.profile_details(user_id, bio) values (uid, p_bio)
    on conflict (user_id) do update set bio = excluded.bio;
  delete from public.profile_affiliations where user_id = uid;
  insert into public.profile_affiliations(user_id, name, sort_order)
    select uid, btrim(value), min(ord)::int from unnest(p_affiliations) with ordinality t(value, ord) group by btrim(value);
  delete from public.profile_crops
    where user_id = uid and (p_crop_names_other is not null or crop_id is not null);
  insert into public.profile_crops(user_id, crop_id, sort_order)
    select uid, value, min(ord)::int from unnest(p_crop_ids) with ordinality t(value, ord) group by value;
  insert into public.profile_crops(user_id, crop_name_other, sort_order)
    select uid, btrim(value), cardinality(p_crop_ids) + ord::int
    from unnest(coalesce(p_crop_names_other, '{}')) with ordinality t(value, ord);
  delete from public.profile_links where user_id = uid;
  insert into public.profile_links(user_id, url, sort_order)
    select uid, btrim(value), min(ord)::int from unnest(p_links) with ordinality t(value, ord) group by btrim(value);
end;
$$;

revoke all on function public.save_profile_details(text, text, text[], uuid[], text[], text[]) from public, anon;
grant execute on function public.save_profile_details(text, text, text[], uuid[], text[], text[]) to authenticated;

-- 実証詳細レポート：提出時の作目の必須を「作物IDか名前」に替える。それ以外は 20261025120000 と同じ。
create or replace function app.assert_usage_report_submission(r public.usage_reports)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if r.form_version <> 2 then return; end if;
  if (r.crop_id is null and r.crop_name_other is null) or r.observed_change !~ '\S' or cardinality(r.purpose_tags)=0
    or r.cultivation_environment !~ '\S' or r.timing_note !~ '\S'
    or not r.method_details_ack or not r.pesticide_ack
    or exists(select 1 from unnest(r.purpose_tags) t where not exists(select 1 from public.effects e where e.name=t))
    or not exists(select 1 from public.usage_report_timings t where t.report_id=r.id)
    or (select count(*) from public.usage_report_plots p where p.report_id=r.id)<2
    or exists(select 1 from public.usage_report_plots p where p.report_id=r.id and
      (p.name !~ '\S' or (p.description !~ '\S' and r.common_plot_description !~ '\S')))
    or not exists(select 1 from public.usage_report_measurements m where m.report_id=r.id)
    or exists(select 1 from public.usage_report_measurements m where m.report_id=r.id and
      (m.name !~ '\S' or (m.kind='text' and m.body !~ '\S') or
       (m.kind='image' and not exists(select 1 from public.usage_report_media media where media.measurement_id=m.id)) or
       (m.kind='numeric' and (not exists(select 1 from public.usage_report_graphs g where g.measurement_id=m.id)
        or exists(select 1 from public.usage_report_graphs g where g.measurement_id=m.id and
          not exists(select 1 from public.usage_report_graph_rows v where v.graph_id=g.id and app.report_value_is_numeric(v.value_text)))))))
    or exists(select 1 from public.usage_report_graph_rows v join public.usage_report_graphs g on g.id=v.graph_id join public.usage_report_measurements m on m.id=g.measurement_id where m.report_id=r.id and m.kind='numeric' and v.plot_id is null and v.label !~ '\S')
    or (not r.documents_ack and exists(select 1 from public.usage_report_documents d where d.report_id=r.id))
  then raise exception 'report_incomplete' using errcode='23514'; end if;
end $$;

-- list_usage_report_previews は usage_reports の列を位置で返すので、列を足したら作り直す。末尾に crop_name_other を足す。
create or replace function public.list_usage_report_previews()
returns setof public.usage_reports
language sql stable security definer set search_path = '' as $$
  select r.id,r.material_id,r.author_user_id,r.title,r.status,r.crop_id,
    r.purpose_tags,null::text,null::smallint,null::text,
    case when r.form_version=2 then (
      select string_agg(v.name,'・' order by v.sort_order)
      from public.usage_report_varieties v where v.report_id=r.id
    ) else r.variety end,
    null::date,null::text,'{}'::text[],null::text,null::text,
    left(r.observed_change,200),null::text,left(r.summary,120),
    r.pesticide_ack,r.is_provided_sample,null::text,r.published_at,r.created_at,r.updated_at,
    r.form_version,false,false,''::text,''::text,false,false,''::text,false,
    r.crop_name_other
  from public.usage_reports r join public.materials m on m.id=r.material_id
  where r.status='published' and m.publication_status='published'
$$;

-- 入力の最上位に cropNameOther を足す。前後の空白を除き、空は名前なしとして扱う。
-- cropNameOther を持たない入力（このmigration前のアプリ）は名前なしとして受け付ける。それ以外は 20261025130000 と同じ。
create or replace function public.save_usage_report(p_input jsonb,p_submit boolean)
returns table(report_id uuid,status text,updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid(); rid uuid; existing public.usage_reports; saved public.usage_reports;
  plot record; step record; measurement record; graph record; value_row record; item record;
  target text; allowed_targets text[]; object_path text; media_measurement uuid; plot_treatment jsonb;
begin
  if uid is null or not coalesce(app.can_use_general_features(),false) then raise exception 'forbidden' using errcode='42501'; end if;
  if p_input is null or p_submit is null or octet_length(p_input::text)>1048576 then raise exception 'invalid_report_input' using errcode='23514'; end if;
  if jsonb_typeof(p_input)='object' and not p_input ? 'cropNameOther' then p_input:=p_input||'{"cropNameOther":null}'; end if;
  perform app.check_report_object(p_input,'{"reportId":"string","expectedUpdatedAt":"string|null","materialId":"string","cropId":"string|null","cropNameOther":"string|null","varietyUnknown":"boolean","varieties":"array","comparedMaterials":"array","commonPlotDescription":"string","observedChange":"string","purposeTags":"array","prefectureCode":"number|null","city":"string","showCity":"boolean","cultivationEnvironment":"string","timingStages":"array","timingNote":"string","plots":"array","measurements":"array","media":"array","documents":"array","headings":"array","methodDetailsAck":"boolean","documentsAck":"boolean","guidelineAck":"boolean","pdfValuesChecked":"boolean"}');
  rid:=(p_input->>'reportId')::uuid;
  -- 同じ下書きの初回保存同士も直列化し、再送で既存内容を上書きしない。
  perform pg_advisory_xact_lock(hashtextextended(rid::text,0));
  select * into existing from public.usage_reports r where r.id=rid for update;
  if found then
    if existing.author_user_id<>uid or existing.status<>'draft' then raise exception 'forbidden' using errcode='42501'; end if;
    if existing.updated_at is distinct from (p_input->>'expectedUpdatedAt')::timestamptz then raise exception 'report_conflict' using errcode='40001'; end if;
  elsif p_input->>'expectedUpdatedAt' is not null then raise exception 'report_conflict' using errcode='40001'; end if;
  if not exists(select 1 from public.materials m where m.id=(p_input->>'materialId')::uuid and m.publication_status='published') then raise exception 'material_unavailable' using errcode='23514'; end if;
  if exists(select 1 from jsonb_array_elements(p_input->'purposeTags') t where jsonb_typeof(t)<>'string'
     or not exists(select 1 from public.effects e where e.name=t#>>'{}'))
    or exists(select 1 from jsonb_array_elements(p_input->'timingStages') t where jsonb_typeof(t)<>'number' or t::text !~ '^[0-7]$')
    or jsonb_array_length(p_input->'plots')>40 or jsonb_array_length(p_input->'varieties')>40
    or jsonb_array_length(p_input->'comparedMaterials')>40 or jsonb_array_length(p_input->'measurements')>30
    or jsonb_array_length(p_input->'purposeTags')>30 or jsonb_array_length(p_input->'timingStages')>8
    or jsonb_array_length(p_input->'media')>30 or jsonb_array_length(p_input->'documents')>10 or jsonb_array_length(p_input->'headings')>6
    or ((p_input->>'prefectureCode') is not null and (p_input->>'prefectureCode') !~ '^([1-9]|[1-3][0-9]|4[0-7])$')
  then raise exception 'invalid_report_input' using errcode='23514'; end if;
  if existing.id is null then
    insert into public.usage_reports(id,material_id,author_user_id,crop_id,observed_change,summary,pesticide_ack,form_version)
    values(rid,(p_input->>'materialId')::uuid,uid,null,'','',false,2);
  end if;
  update public.usage_reports r set material_id=(p_input->>'materialId')::uuid,crop_id=(p_input->>'cropId')::uuid,
    crop_name_other=nullif(btrim(p_input->>'cropNameOther'),''),
    variety=null,variety_unknown=(p_input->>'varietyUnknown')::boolean,
    common_plot_description=p_input->>'commonPlotDescription',
    observed_change=p_input->>'observedChange',summary=left(p_input->>'observedChange',120),
    purpose_tags=array(select jsonb_array_elements_text(p_input->'purposeTags')),
    prefecture_code=(p_input->>'prefectureCode')::smallint,publish_city=(p_input->>'showCity')::boolean,
    cultivation_environment=p_input->>'cultivationEnvironment',timing_note=p_input->>'timingNote',
    method_details_ack=(p_input->>'methodDetailsAck')::boolean,documents_ack=(p_input->>'documentsAck')::boolean,
    pesticide_ack=(p_input->>'guidelineAck')::boolean,
    pdf_values_checked=(p_input->>'pdfValuesChecked')::boolean,form_version=2
  where r.id=rid;
  delete from public.usage_report_media m where m.usage_report_id=rid;
  delete from public.usage_report_measurements m where m.report_id=rid;
  delete from public.usage_report_plots p where p.report_id=rid;
  delete from public.usage_report_varieties v where v.report_id=rid;
  delete from public.usage_report_compared_materials c where c.report_id=rid;
  delete from public.usage_report_timings t where t.report_id=rid;
  delete from public.usage_report_private_locations l where l.report_id=rid;
  delete from public.usage_report_documents d where d.report_id=rid;
  delete from public.usage_report_headings h where h.report_id=rid;
  insert into public.usage_report_private_locations values(rid,p_input->>'city');
  insert into public.usage_report_timings select rid,t::text::smallint from jsonb_array_elements(p_input->'timingStages') t;
  for item in select value,ordinality-1 as position from jsonb_array_elements(p_input->'varieties') with ordinality loop
    perform app.check_report_object(item.value,'{"id":"string","name":"string"}');
    insert into public.usage_report_varieties(id,report_id,name,sort_order)
    values((item.value->>'id')::uuid,rid,item.value->>'name',item.position);
  end loop;
  for item in select value,ordinality-1 as position from jsonb_array_elements(p_input->'comparedMaterials') with ordinality loop
    perform app.check_report_object(item.value,'{"id":"string","name":"string"}');
    insert into public.usage_report_compared_materials(id,report_id,name,sort_order)
    values((item.value->>'id')::uuid,rid,item.value->>'name',item.position);
  end loop;
  for plot in select value,ordinality-1 as position from jsonb_array_elements(p_input->'plots') with ordinality loop
    perform app.check_report_object(plot.value,'{"id":"string","name":"string","scope":"string","description":"string","steps":"array","varietyId":"string|null","treatment":"object|null"}');
    if jsonb_array_length(plot.value->'steps')>20 then raise exception 'report_limit' using errcode='23514'; end if;
    plot_treatment:=plot.value->'treatment';
    if jsonb_typeof(plot_treatment)='object' then
      perform app.check_report_object(plot_treatment,case when plot_treatment->>'kind'='compared'
        then '{"kind":"string","comparedMaterialId":"string"}' else '{"kind":"string"}' end::jsonb);
    end if;
    insert into public.usage_report_plots(id,report_id,name,survey_scope,description,sort_order,variety_id,treatment,compared_material_id)
    values((plot.value->>'id')::uuid,rid,plot.value->>'name',plot.value->>'scope',plot.value->>'description',plot.position,
      (plot.value->>'varietyId')::uuid,plot_treatment->>'kind',(plot_treatment->>'comparedMaterialId')::uuid);
    for step in select value,ordinality-1 as position from jsonb_array_elements(plot.value->'steps') with ordinality loop
      perform app.check_report_object(step.value,'{"id":"string","method":"string","targets":"array","otherText":"string"}');
      if jsonb_array_length(step.value->'targets')>6 then raise exception 'report_limit' using errcode='23514'; end if;
      allowed_targets:=case step.value->>'method'
        when 'spray' then array['茎葉','果実','株元','土壌','育苗箱','田面（水面）']
        when 'drench' then array['株元','土壌','培地','育苗箱']
        when 'mix' then array['土壌','培地','養液']
        when 'soak' then array['種子','苗・根']
        when 'coat' then array['種子','樹幹・枝'] else '{}'::text[] end;
      insert into public.usage_report_plot_steps values((step.value->>'id')::uuid,(plot.value->>'id')::uuid,step.value->>'method',step.value->>'otherText',step.position);
      for target in select jsonb_array_elements_text(step.value->'targets') loop
        if not target=any(allowed_targets) then raise exception 'invalid_method_target' using errcode='23514'; end if;
        insert into public.usage_report_step_targets values((step.value->>'id')::uuid,target);
      end loop;
    end loop;
  end loop;
  for measurement in select value,ordinality-1 as position from jsonb_array_elements(p_input->'measurements') with ordinality loop
    perform app.check_report_object(measurement.value,'{"id":"string","kind":"string","name":"string","unit":"string","body":"string","graphs":"array"}');
    if jsonb_array_length(measurement.value->'graphs')>20 then raise exception 'report_limit' using errcode='23514'; end if;
    insert into public.usage_report_measurements values((measurement.value->>'id')::uuid,rid,measurement.value->>'kind',measurement.value->>'name',measurement.value->>'unit',measurement.value->>'body',measurement.position);
    for graph in select value,ordinality-1 as position from jsonb_array_elements(measurement.value->'graphs') with ordinality loop
      perform app.check_report_object(graph.value,'{"id":"string","heading":"string","rows":"array"}');
      insert into public.usage_report_graphs values((graph.value->>'id')::uuid,(measurement.value->>'id')::uuid,graph.value->>'heading',graph.position);
      for value_row in select value,ordinality-1 as position from jsonb_array_elements(graph.value->'rows') with ordinality loop
        perform app.check_report_object(value_row.value,'{"id":"string","plotId":"string|null","label":"string","value":"string"}');
        if value_row.value->>'plotId' is not null and not exists(select 1 from public.usage_report_plots p where p.id=(value_row.value->>'plotId')::uuid and p.report_id=rid) then raise exception 'invalid_plot_reference' using errcode='23514'; end if;
        insert into public.usage_report_graph_rows values((value_row.value->>'id')::uuid,(graph.value->>'id')::uuid,(value_row.value->>'plotId')::uuid,value_row.value->>'label',value_row.value->>'value',value_row.position);
      end loop;
    end loop;
  end loop;
  for item in select value,ordinality-1 as position from jsonb_array_elements(p_input->'media') with ordinality loop
    perform app.check_report_object(item.value||jsonb_build_object('measurementId',coalesce(item.value->'measurementId','null'::jsonb)),
      '{"id":"string","url":"string","mediaType":"string","section":"string","caption":"string","measurementId":"string|null"}');
    object_path:=substring(item.value->>'url' from '^https?://[^/?#]+/storage/v1/object/public/report-media/([^?#]+)$');
    media_measurement:=(item.value->>'measurementId')::uuid;
    if length(item.value->>'url')>4000 or length(item.value->>'caption')>500 or object_path is null or split_part(object_path,'/',1)<>uid::text
      or not exists(select 1 from storage.objects o where o.bucket_id='report-media' and o.name=object_path)
      or item.value->>'section' not in ('results','effects','conditions','plots','measurements','documents')
      or (media_measurement is not null and (item.value->>'mediaType'<>'photo' or not exists(
        select 1 from public.usage_report_measurements m where m.id=media_measurement and m.report_id=rid and m.kind='image')))
    then raise exception 'invalid_report_media' using errcode='23514'; end if;
    insert into public.usage_report_media(id,usage_report_id,media_type,url,caption,placement,sort_order,measurement_id)
    values((item.value->>'id')::uuid,rid,item.value->>'mediaType',item.value->>'url',item.value->>'caption',item.value->>'section',item.position,media_measurement);
  end loop;
  for item in select value,ordinality-1 as position from jsonb_array_elements(p_input->'documents') with ordinality loop
    perform app.check_report_object(item.value,'{"id":"string","path":"string","name":"string"}');
    if split_part(item.value->>'path','/',1)<>uid::text
      or not exists(select 1 from storage.objects o where o.bucket_id='report-documents' and o.name=item.value->>'path')
    then raise exception 'invalid_report_document' using errcode='23514'; end if;
    insert into public.usage_report_documents values((item.value->>'id')::uuid,rid,item.value->>'path',item.value->>'name',item.position);
  end loop;
  for item in select value from jsonb_array_elements(p_input->'headings') loop
    perform app.check_report_object(item.value,'{"section":"string","title":"string"}');
    insert into public.usage_report_headings values(rid,item.value->>'section',item.value->>'title');
  end loop;
  update public.usage_reports r set status=case when p_submit then 'pending' else 'draft' end where r.id=rid returning r.* into saved;
  return query select saved.id,saved.status,saved.updated_at;
end $$;
