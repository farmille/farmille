-- 実証詳細レポートの区に、試した品種と使った資材（投稿した資材・比較した資材・無処理）を持たせる。
-- form_version は 2 のまま。新しい必須は下書き→提出の遷移だけで確かめ、提出済みの既存レポートはそのまま公開できる。

create table public.usage_report_varieties (
  id uuid primary key,
  report_id uuid not null references public.usage_reports(id) on delete cascade,
  name text not null check (length(name)<=500),
  sort_order integer not null check (sort_order between 0 and 49),
  unique (id,report_id)
);
create index usage_report_varieties_parent_idx on public.usage_report_varieties(report_id,sort_order);
alter table public.usage_report_varieties enable row level security;
revoke all on public.usage_report_varieties from anon, authenticated;
grant select on public.usage_report_varieties to authenticated;
grant all on public.usage_report_varieties to service_role;
create policy usage_report_varieties_read on public.usage_report_varieties for select to authenticated using (exists (select 1 from public.usage_reports r where r.id = report_id));

-- 比較した資材は名前だけで持ち、資材のカタログには紐づけない。
create table public.usage_report_compared_materials (
  id uuid primary key,
  report_id uuid not null references public.usage_reports(id) on delete cascade,
  name text not null check (length(name)<=500),
  sort_order integer not null check (sort_order between 0 and 49),
  unique (id,report_id)
);
create index usage_report_compared_materials_parent_idx on public.usage_report_compared_materials(report_id,sort_order);
alter table public.usage_report_compared_materials enable row level security;
revoke all on public.usage_report_compared_materials from anon, authenticated;
grant select on public.usage_report_compared_materials to authenticated;
grant all on public.usage_report_compared_materials to service_role;
create policy usage_report_compared_materials_read on public.usage_report_compared_materials for select to authenticated using (exists (select 1 from public.usage_reports r where r.id = report_id));

-- 区は同じレポートの品種・比較した資材だけを指せる（複合外部キー）。treatment が null の区は、品種と資材を持たない既存のレポート。
alter table public.usage_report_plots
  add column variety_id uuid,
  add column treatment text check (treatment in ('posted','compared','untreated')),
  add column compared_material_id uuid,
  add constraint usage_report_plots_variety_fkey foreign key (variety_id,report_id)
    references public.usage_report_varieties(id,report_id),
  add constraint usage_report_plots_compared_material_fkey foreign key (compared_material_id,report_id)
    references public.usage_report_compared_materials(id,report_id),
  add constraint usage_report_plots_compared_material_ref
    check ((treatment is distinct from 'compared') = (compared_material_id is null));
create index usage_report_plots_variety_idx on public.usage_report_plots(variety_id)
  where variety_id is not null;
create index usage_report_plots_compared_material_idx on public.usage_report_plots(compared_material_id)
  where compared_material_id is not null;
comment on column public.usage_report_plots.treatment is
  '区で使った資材。posted は投稿した資材（レポートの material_id）、compared は compared_material_id の資材、untreated は無処理。';

alter table public.usage_reports
  add column common_plot_description text not null default '' check (length(common_plot_description)<=20000);
grant select (common_plot_description) on public.usage_reports to anon, authenticated;
comment on column public.usage_reports.variety is
  'form_version=1 の品種。form_version=2 の品種は usage_report_varieties に置き、この列には書かない。';

-- 既存の form_version=2 の品種を子テーブルへ写し、区に付ける。品種の行があるレポートは飛ばすので、何度流しても同じ状態になる。
create function app.copy_usage_report_varieties()
returns void language sql security definer set search_path='' as $$
  with copied as (
    insert into public.usage_report_varieties(id,report_id,name,sort_order)
    select gen_random_uuid(),r.id,r.variety,0 from public.usage_reports r
    where r.form_version=2 and not r.variety_unknown and r.variety ~ '\S'
      and not exists(select 1 from public.usage_report_varieties v where v.report_id=r.id)
    returning id,report_id
  )
  update public.usage_report_plots p set variety_id=c.id from copied c where c.report_id=p.report_id
$$;
revoke all on function app.copy_usage_report_varieties() from public,anon,authenticated;
select app.copy_usage_report_varieties();

-- 未ログインの一覧と記事の見出しにも品種を出す。form_version=2 の品種は子テーブルから読む。
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
    r.form_version,false,false,''::text,''::text,false,false,''::text
  from public.usage_reports r join public.materials m on m.id=r.material_id
  where r.status='published' and m.publication_status='published'
$$;

-- 公開の操作でも動くので、緩める変更だけを入れる。区の説明は、区ごとか共通のどちらかがあればよい。
create or replace function app.assert_usage_report_submission(r public.usage_reports)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if r.form_version <> 2 then return; end if;
  if r.crop_id is null or r.observed_change !~ '\S' or cardinality(r.purpose_tags)=0
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
revoke all on function app.assert_usage_report_submission(public.usage_reports) from public,anon,authenticated;

-- 品種と使った資材の必須。提出済みの既存レポートを公開できるよう、下書き→提出の遷移だけで確かめる。
create function app.assert_usage_report_plot_submission(r public.usage_reports)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  if r.form_version<>2 then return; end if;
  if (r.variety_unknown and (
        exists(select 1 from public.usage_report_varieties v where v.report_id=r.id)
        or exists(select 1 from public.usage_report_plots p where p.report_id=r.id and p.variety_id is not null)))
    or (not r.variety_unknown and (
        not exists(select 1 from public.usage_report_varieties v where v.report_id=r.id)
        or exists(select 1 from public.usage_report_varieties v where v.report_id=r.id and v.name !~ '\S')
        or exists(select 1 from public.usage_report_plots p where p.report_id=r.id and p.variety_id is null)))
    or exists(select 1 from public.usage_report_plots p where p.report_id=r.id and p.treatment is null)
    or not exists(select 1 from public.usage_report_plots p where p.report_id=r.id and p.treatment='posted')
    or exists(select 1 from public.usage_report_compared_materials c where c.report_id=r.id and c.name !~ '\S')
  then raise exception 'report_incomplete' using errcode='23514'; end if;
end $$;
revoke all on function app.assert_usage_report_plot_submission(public.usage_reports) from public,anon,authenticated;

create or replace function app.validate_structured_usage_report()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and old.form_version=2 and new.form_version<>2 then
    raise exception 'report_version_conflict' using errcode='23514';
  end if;
  if new.form_version=2 and new.status<>'draft' then
    perform app.assert_usage_report_submission(new);
  end if;
  if tg_op='UPDATE' and old.status='draft' and new.form_version=2 and new.status='pending' then
    perform app.assert_usage_report_graph_submission(new);
    perform app.assert_usage_report_plot_submission(new);
  end if;
  return new;
end $$;
revoke all on function app.validate_structured_usage_report() from public,anon,authenticated;

-- 最上位に varieties・comparedMaterials・commonPlotDescription を足し、variety を外す。区に varietyId・treatment を足す。
-- 区・品種・比較した資材は40まで。区が品種・比較した資材を指すので、消すのは区が先、入れるのは品種・比較した資材が先。
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
  perform app.check_report_object(p_input,'{"reportId":"string","expectedUpdatedAt":"string|null","materialId":"string","cropId":"string|null","varietyUnknown":"boolean","varieties":"array","comparedMaterials":"array","commonPlotDescription":"string","observedChange":"string","purposeTags":"array","prefectureCode":"number|null","city":"string","showCity":"boolean","cultivationEnvironment":"string","timingStages":"array","timingNote":"string","plots":"array","measurements":"array","media":"array","documents":"array","headings":"array","methodDetailsAck":"boolean","documentsAck":"boolean","guidelineAck":"boolean"}');
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
    variety=null,variety_unknown=(p_input->>'varietyUnknown')::boolean,
    common_plot_description=p_input->>'commonPlotDescription',
    observed_change=p_input->>'observedChange',summary=left(p_input->>'observedChange',120),
    purpose_tags=array(select jsonb_array_elements_text(p_input->'purposeTags')),
    prefecture_code=(p_input->>'prefectureCode')::smallint,publish_city=(p_input->>'showCity')::boolean,
    cultivation_environment=p_input->>'cultivationEnvironment',timing_note=p_input->>'timingNote',
    method_details_ack=(p_input->>'methodDetailsAck')::boolean,documents_ack=(p_input->>'documentsAck')::boolean,
    pesticide_ack=(p_input->>'guidelineAck')::boolean,form_version=2
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
revoke all on function public.save_usage_report(jsonb,boolean) from public,anon;
grant execute on function public.save_usage_report(jsonb,boolean) to authenticated,service_role;
