alter table public.usage_reports
  add column form_version smallint not null default 1 check (form_version in (1,2)),
  add column variety_unknown boolean not null default false,
  add column publish_city boolean not null default false,
  add column cultivation_environment text not null default '',
  add column timing_note text not null default '',
  add column method_details_ack boolean not null default false,
  add column documents_ack boolean not null default false,
  alter column crop_id drop not null,
  drop constraint usage_reports_pesticide_ack_required,
  add constraint usage_reports_submission_basics check (status = 'draft' or (crop_id is not null and pesticide_ack));

create table public.usage_report_private_locations (
  report_id uuid primary key references public.usage_reports(id) on delete cascade,
  city text not null check (length(city)<=500)
);
alter table public.usage_report_private_locations enable row level security;
revoke all on public.usage_report_private_locations from anon, authenticated;
grant select on public.usage_report_private_locations to authenticated;
grant all on public.usage_report_private_locations to service_role;
create policy usage_report_private_locations_read on public.usage_report_private_locations for select to authenticated using (exists (select 1 from public.usage_reports r where r.id=report_id and (r.author_user_id=auth.uid() or app.is_admin() or (r.status='published' and r.publish_city))));

create table public.usage_report_timings (
  report_id uuid not null references public.usage_reports(id) on delete cascade,
  stage smallint not null check (stage between 0 and 7),
  primary key(report_id,stage)
);
alter table public.usage_report_timings enable row level security;
revoke all on public.usage_report_timings from anon, authenticated;
grant select on public.usage_report_timings to authenticated;
grant all on public.usage_report_timings to service_role;
create policy usage_report_timings_read on public.usage_report_timings for select to authenticated using (exists (select 1 from public.usage_reports r where r.id = report_id));

create table public.usage_report_plots (
  id uuid primary key,
  report_id uuid not null references public.usage_reports(id) on delete cascade,
  name text not null check (length(name)<=500),
  survey_scope text not null check (length(survey_scope)<=500),
  description text not null check (length(description)<=20000),
  sort_order integer not null check (sort_order between 0 and 49)
);
create index usage_report_plots_parent_idx on public.usage_report_plots(report_id,sort_order);
alter table public.usage_report_plots enable row level security;
revoke all on public.usage_report_plots from anon, authenticated;
grant select on public.usage_report_plots to authenticated;
grant all on public.usage_report_plots to service_role;
create policy usage_report_plots_read on public.usage_report_plots for select to authenticated using (exists (select 1 from public.usage_reports r where r.id = report_id));

create table public.usage_report_plot_steps (
  id uuid primary key,
  plot_id uuid not null references public.usage_report_plots(id) on delete cascade,
  method text not null check (method in ('','spray','drench','mix','soak','coat','other')),
  other_text text not null check (length(other_text)<=500),
  sort_order integer not null check (sort_order between 0 and 49)
);
create index usage_report_plot_steps_parent_idx on public.usage_report_plot_steps(plot_id,sort_order);
alter table public.usage_report_plot_steps enable row level security;
revoke all on public.usage_report_plot_steps from anon, authenticated;
grant select on public.usage_report_plot_steps to authenticated;
grant all on public.usage_report_plot_steps to service_role;
create policy usage_report_plot_steps_read on public.usage_report_plot_steps for select to authenticated using (exists (select 1 from public.usage_report_plots p where p.id = plot_id));

create table public.usage_report_step_targets (
  step_id uuid not null references public.usage_report_plot_steps(id) on delete cascade,
  target text not null check (length(target)<=50),
  primary key(step_id,target)
);
alter table public.usage_report_step_targets enable row level security;
revoke all on public.usage_report_step_targets from anon, authenticated;
grant select on public.usage_report_step_targets to authenticated;
grant all on public.usage_report_step_targets to service_role;
create policy usage_report_step_targets_read on public.usage_report_step_targets for select to authenticated using (exists (select 1 from public.usage_report_plot_steps s where s.id = step_id));

create table public.usage_report_measurements (
  id uuid primary key,
  report_id uuid not null references public.usage_reports(id) on delete cascade,
  kind text not null check (kind in ('numeric','text')),
  name text not null check (length(name)<=500),
  unit text not null check (length(unit)<=500),
  body text not null check (length(body)<=20000),
  sort_order integer not null check (sort_order between 0 and 49)
);
create index usage_report_measurements_parent_idx on public.usage_report_measurements(report_id,sort_order);
alter table public.usage_report_measurements enable row level security;
revoke all on public.usage_report_measurements from anon, authenticated;
grant select on public.usage_report_measurements to authenticated;
grant all on public.usage_report_measurements to service_role;
create policy usage_report_measurements_read on public.usage_report_measurements for select to authenticated using (exists (select 1 from public.usage_reports r where r.id = report_id));

create table public.usage_report_graphs (
  id uuid primary key,
  measurement_id uuid not null references public.usage_report_measurements(id) on delete cascade,
  heading text not null check (length(heading)<=500),
  sort_order integer not null check (sort_order between 0 and 49)
);
create index usage_report_graphs_parent_idx on public.usage_report_graphs(measurement_id,sort_order);
alter table public.usage_report_graphs enable row level security;
revoke all on public.usage_report_graphs from anon, authenticated;
grant select on public.usage_report_graphs to authenticated;
grant all on public.usage_report_graphs to service_role;
create policy usage_report_graphs_read on public.usage_report_graphs for select to authenticated using (exists (select 1 from public.usage_report_measurements m where m.id = measurement_id));

create table public.usage_report_graph_rows (
  id uuid primary key,
  graph_id uuid not null references public.usage_report_graphs(id) on delete cascade,
  plot_id uuid references public.usage_report_plots(id) on delete cascade,
  label text not null check (length(label)<=500),
  value_text text not null check (length(value_text)<=500),
  sort_order integer not null check (sort_order between 0 and 49)
);
create index usage_report_graph_rows_parent_idx on public.usage_report_graph_rows(graph_id,sort_order);
alter table public.usage_report_graph_rows enable row level security;
revoke all on public.usage_report_graph_rows from anon, authenticated;
grant select on public.usage_report_graph_rows to authenticated;
grant all on public.usage_report_graph_rows to service_role;
create policy usage_report_graph_rows_read on public.usage_report_graph_rows for select to authenticated using (exists (select 1 from public.usage_report_graphs g where g.id = graph_id));

create table public.usage_report_documents (
  id uuid primary key,
  report_id uuid not null references public.usage_reports(id) on delete cascade,
  storage_path text not null check (length(storage_path)<=1000),
  name text not null check (length(name)<=500),
  sort_order integer not null check (sort_order between 0 and 49),
  unique(report_id,storage_path)
);
create index usage_report_documents_parent_idx on public.usage_report_documents(report_id,sort_order);
alter table public.usage_report_documents enable row level security;
revoke all on public.usage_report_documents from anon, authenticated;
grant select on public.usage_report_documents to authenticated;
grant all on public.usage_report_documents to service_role;
create policy usage_report_documents_read on public.usage_report_documents for select to authenticated using (exists (select 1 from public.usage_reports r where r.id = report_id));

create table public.usage_report_headings (
  report_id uuid not null references public.usage_reports(id) on delete cascade,
  section text not null check(section in ('results','effects','conditions','plots','measurements','documents')),
  title text not null check(length(title)<=500),
  primary key(report_id,section)
);
alter table public.usage_report_headings enable row level security;
revoke all on public.usage_report_headings from anon, authenticated;
grant select on public.usage_report_headings to authenticated;
grant all on public.usage_report_headings to service_role;
create policy usage_report_headings_read on public.usage_report_headings for select to authenticated using (exists (select 1 from public.usage_reports r where r.id = report_id));

create or replace function public.list_usage_report_previews()
returns setof public.usage_reports
language sql stable security definer set search_path = '' as $$
  select r.id,r.material_id,r.author_user_id,r.title,r.status,r.crop_id,
    r.purpose_tags,null::text,null::smallint,null::text,r.variety,
    null::date,null::text,'{}'::text[],null::text,null::text,
    left(r.observed_change,200),null::text,left(r.summary,120),
    r.pesticide_ack,r.is_provided_sample,null::text,r.published_at,r.created_at,r.updated_at,
    r.form_version,false,false,''::text,''::text,false,false
  from public.usage_reports r join public.materials m on m.id=r.material_id
  where r.status='published' and m.publication_status='published'
$$;

create function app.report_value_is_numeric(p_value text)
returns boolean language sql immutable set search_path='' as $$
  select coalesce(abs(parts[1]::numeric)<=1.7976931348623157e308
    and (parts[2] is null or parts[2]::numeric<=1.7976931348623157e308),false)
  from regexp_match(p_value,'^\s*([+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+))(?:\s*±\s*([0-9]+(?:\.[0-9]*)?|\.[0-9]+))?') parts
$$;
revoke all on function app.report_value_is_numeric(text) from public,anon,authenticated;

create function app.assert_usage_report_submission(r public.usage_reports)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if r.form_version <> 2 then return; end if;
  if r.crop_id is null or r.observed_change !~ '\S' or cardinality(r.purpose_tags)=0
    or r.cultivation_environment !~ '\S' or r.timing_note !~ '\S'
    or not r.method_details_ack or not r.pesticide_ack
    or exists(select 1 from unnest(r.purpose_tags) t where not exists(select 1 from public.effects e where e.name=t))
    or not exists(select 1 from public.usage_report_timings t where t.report_id=r.id)
    or (select count(*) from public.usage_report_plots p where p.report_id=r.id)<2
    or exists(select 1 from public.usage_report_plots p where p.report_id=r.id and (p.name !~ '\S' or p.survey_scope !~ '\S' or p.description !~ '\S'))
    or not exists(select 1 from public.usage_report_measurements m where m.report_id=r.id)
    or exists(select 1 from public.usage_report_measurements m where m.report_id=r.id and
      (m.name !~ '\S' or (m.kind='text' and m.body !~ '\S') or
       (m.kind='numeric' and (not exists(select 1 from public.usage_report_graphs g where g.measurement_id=m.id)
        or exists(select 1 from public.usage_report_graphs g where g.measurement_id=m.id and
          not exists(select 1 from public.usage_report_graph_rows v where v.graph_id=g.id and app.report_value_is_numeric(v.value_text)))))))
    or exists(select 1 from public.usage_report_graph_rows v join public.usage_report_graphs g on g.id=v.graph_id join public.usage_report_measurements m on m.id=g.measurement_id where m.report_id=r.id and m.kind='numeric' and v.plot_id is null and v.label !~ '\S')
    or (not r.documents_ack and exists(select 1 from public.usage_report_documents d where d.report_id=r.id))
  then raise exception 'report_incomplete' using errcode='23514'; end if;
end $$;
revoke all on function app.assert_usage_report_submission(public.usage_reports) from public,anon,authenticated;

create function app.validate_structured_usage_report()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='UPDATE' and old.form_version=2 and new.form_version<>2 then
    raise exception 'report_version_conflict' using errcode='23514';
  end if;
  if new.form_version=2 and new.status<>'draft' then perform app.assert_usage_report_submission(new); end if;
  return new;
end $$;
revoke all on function app.validate_structured_usage_report() from public,anon,authenticated;
create trigger usage_reports_validate_structured before insert or update on public.usage_reports
  for each row execute function app.validate_structured_usage_report();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('report-documents','report-documents',false,20971520,array['application/pdf']);
create policy report_documents_upload on storage.objects for insert to authenticated
with check(bucket_id='report-documents' and app.can_use_general_features() and (storage.foldername(name))[1]=auth.uid()::text);
create policy report_documents_read on storage.objects for select to authenticated
using(bucket_id='report-documents' and ((storage.foldername(name))[1]=auth.uid()::text or app.is_admin() or exists(
 select 1 from public.usage_report_documents d join public.usage_reports r on r.id=d.report_id
 where d.storage_path=storage.objects.name and r.status='published')));
create policy report_documents_delete on storage.objects for delete to authenticated
using(bucket_id='report-documents' and (storage.foldername(name))[1]=auth.uid()::text and not exists(
 select 1 from public.usage_report_documents d where d.storage_path=storage.objects.name));

create function app.check_report_object(p_value jsonb,p_types jsonb)
returns void language plpgsql immutable set search_path='' as $$
declare f record; value jsonb;
begin
  if jsonb_typeof(p_value) is distinct from 'object' or not (p_value ?& array(select jsonb_object_keys(p_types)))
    or exists(select 1 from jsonb_object_keys(p_value) k where not p_types ? k)
  then raise exception 'invalid_report_input' using errcode='23514'; end if;
  for f in select * from jsonb_each_text(p_types) loop
    value:=p_value->f.key;
    if not (jsonb_typeof(value)=any(string_to_array(f.value,'|')))
      then raise exception 'invalid_report_input: %',f.key using errcode='23514'; end if;
    if jsonb_typeof(value)='array' then
      if jsonb_array_length(value)>50 then raise exception 'report_limit' using errcode='23514'; end if;
    elsif jsonb_typeof(value)='string' then
      if length(value#>>'{}')>20000 then raise exception 'report_limit' using errcode='23514'; end if;
    end if;
  end loop;
end $$;
revoke all on function app.check_report_object(jsonb,jsonb) from public,anon,authenticated;

create function public.save_usage_report(p_input jsonb,p_submit boolean)
returns table(report_id uuid,status text,updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid(); rid uuid; existing public.usage_reports; saved public.usage_reports;
  plot record; step record; measurement record; graph record; value_row record; item record;
  target text; allowed_targets text[]; object_path text;
begin
  if uid is null or not coalesce(app.can_use_general_features(),false) then raise exception 'forbidden' using errcode='42501'; end if;
  if p_input is null or p_submit is null or octet_length(p_input::text)>1048576 then raise exception 'invalid_report_input' using errcode='23514'; end if;
  perform app.check_report_object(p_input,'{"reportId":"string","expectedUpdatedAt":"string|null","materialId":"string","cropId":"string|null","variety":"string","varietyUnknown":"boolean","observedChange":"string","purposeTags":"array","prefectureCode":"number|null","city":"string","showCity":"boolean","cultivationEnvironment":"string","timingStages":"array","timingNote":"string","plots":"array","measurements":"array","media":"array","documents":"array","headings":"array","methodDetailsAck":"boolean","documentsAck":"boolean","guidelineAck":"boolean"}');
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
    or jsonb_array_length(p_input->'plots')>20 or jsonb_array_length(p_input->'measurements')>30
    or jsonb_array_length(p_input->'purposeTags')>30 or jsonb_array_length(p_input->'timingStages')>8
    or jsonb_array_length(p_input->'media')>30 or jsonb_array_length(p_input->'documents')>10 or jsonb_array_length(p_input->'headings')>6
    or length(p_input->>'variety')>500
    or ((p_input->>'prefectureCode') is not null and (p_input->>'prefectureCode') !~ '^([1-9]|[1-3][0-9]|4[0-7])$')
  then raise exception 'invalid_report_input' using errcode='23514'; end if;
  if existing.id is null then
    insert into public.usage_reports(id,material_id,author_user_id,crop_id,observed_change,summary,pesticide_ack,form_version)
    values(rid,(p_input->>'materialId')::uuid,uid,null,'','',false,2);
  end if;
  update public.usage_reports r set material_id=(p_input->>'materialId')::uuid,crop_id=(p_input->>'cropId')::uuid,
    variety=p_input->>'variety',variety_unknown=(p_input->>'varietyUnknown')::boolean,
    observed_change=p_input->>'observedChange',summary=left(p_input->>'observedChange',120),
    purpose_tags=array(select jsonb_array_elements_text(p_input->'purposeTags')),
    prefecture_code=(p_input->>'prefectureCode')::smallint,publish_city=(p_input->>'showCity')::boolean,
    cultivation_environment=p_input->>'cultivationEnvironment',timing_note=p_input->>'timingNote',
    method_details_ack=(p_input->>'methodDetailsAck')::boolean,documents_ack=(p_input->>'documentsAck')::boolean,
    pesticide_ack=(p_input->>'guidelineAck')::boolean,form_version=2
  where r.id=rid;
  delete from public.usage_report_measurements m where m.report_id=rid;
  delete from public.usage_report_plots p where p.report_id=rid;
  delete from public.usage_report_timings t where t.report_id=rid;
  delete from public.usage_report_private_locations l where l.report_id=rid;
  delete from public.usage_report_documents d where d.report_id=rid;
  delete from public.usage_report_headings h where h.report_id=rid;
  delete from public.usage_report_media m where m.usage_report_id=rid;
  insert into public.usage_report_private_locations values(rid,p_input->>'city');
  insert into public.usage_report_timings select rid,t::text::smallint from jsonb_array_elements(p_input->'timingStages') t;
  for plot in select value,ordinality-1 as position from jsonb_array_elements(p_input->'plots') with ordinality loop
    perform app.check_report_object(plot.value,'{"id":"string","name":"string","scope":"string","description":"string","steps":"array"}');
    if jsonb_array_length(plot.value->'steps')>20 then raise exception 'report_limit' using errcode='23514'; end if;
    insert into public.usage_report_plots values((plot.value->>'id')::uuid,rid,plot.value->>'name',plot.value->>'scope',plot.value->>'description',plot.position);
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
    perform app.check_report_object(item.value,'{"id":"string","url":"string","mediaType":"string","section":"string","caption":"string"}');
    object_path:=substring(item.value->>'url' from '^https?://[^/?#]+/storage/v1/object/public/report-media/([^?#]+)$');
    if length(item.value->>'url')>4000 or length(item.value->>'caption')>500 or object_path is null or split_part(object_path,'/',1)<>uid::text
      or not exists(select 1 from storage.objects o where o.bucket_id='report-media' and o.name=object_path)
      or item.value->>'section' not in ('results','effects','conditions','plots','measurements','documents')
    then raise exception 'invalid_report_media' using errcode='23514'; end if;
    insert into public.usage_report_media(id,usage_report_id,media_type,url,caption,placement,sort_order)
    values((item.value->>'id')::uuid,rid,item.value->>'mediaType',item.value->>'url',item.value->>'caption',item.value->>'section',item.position);
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
