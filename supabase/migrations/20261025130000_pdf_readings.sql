-- PDF読み取りの記録・回数制限・PDF の一時置き場・読み取った値と根拠の引用・提出時の確認。
-- 記録の書き込みは service_role の関数だけが行い、本人は自分の記録を読むだけにする。

-- 読み取り1回ごとの記録。回数はこの表の行数で数えるので、失敗した行も消さない。
create table public.pdf_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 下書きを消しても回数は戻さない。
  report_id uuid references public.usage_reports(id) on delete set null,
  material_id uuid references public.materials(id) on delete set null,
  -- 同じアップロードでの二重送信を一意制約で止める。
  upload_path text not null unique
    check (upload_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$'
      and split_part(upload_path,'/',1)=user_id::text),
  status text not null default 'reserved' check (status in ('reserved','succeeded','failed','applied')),
  model text check (length(model) between 1 and 100),
  speed text check (speed in ('fast','standard')),
  input_tokens integer check (input_tokens>=0),
  output_tokens integer check (output_tokens>=0),
  error_code text check (error_code ~ '^[a-z][a-z0-9_]{0,63}$'),
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  check ((status='reserved')=(finished_at is null)),
  check ((status='failed')=(error_code is not null)),
  check (status not in ('succeeded','applied')
    or (model is not null and speed is not null and input_tokens is not null and output_tokens is not null))
);
create index pdf_readings_user_created_idx on public.pdf_readings(user_id,created_at);
create index pdf_readings_report_idx on public.pdf_readings(report_id) where report_id is not null;
comment on table public.pdf_readings is
  'PDF読み取り1回の記録。AI に送る前に reserved で入れ、結果で succeeded か failed、下書きに写したら applied にする。行数が月の回数なので、運用で消さない。';
alter table public.pdf_readings enable row level security;
revoke all on public.pdf_readings from anon, authenticated;
revoke insert, update, delete on public.pdf_readings from service_role;
grant select on public.pdf_readings to authenticated, service_role;
create policy pdf_readings_read_own on public.pdf_readings for select to authenticated using (user_id=auth.uid());

-- 読み取りで入れた値と根拠の引用。下書きの子テーブルは保存のたびに入れ直すので外部キーを持たず、
-- 区や行の id を含む経路（plots.<id>.name など）で欄を指す。印は今の値がこの value と同じ欄にだけ出す。
create table public.usage_report_pdf_reading_fields (
  reading_id uuid not null references public.pdf_readings(id) on delete cascade,
  field_key text not null check (length(field_key)<=200
    and field_key ~ '^[a-z][A-Za-z]*(\.([a-z][A-Za-z]*|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))*$'),
  value text not null check (length(value)<=20000),
  quote text not null check (length(quote)<=1000),
  primary key (reading_id,field_key)
);
alter table public.usage_report_pdf_reading_fields enable row level security;
revoke all on public.usage_report_pdf_reading_fields from anon, authenticated;
revoke insert, update, delete on public.usage_report_pdf_reading_fields from service_role;
grant select on public.usage_report_pdf_reading_fields to authenticated, service_role;
create policy usage_report_pdf_reading_fields_read_own on public.usage_report_pdf_reading_fields for select to authenticated
  using (exists(select 1 from public.pdf_readings r where r.id=reading_id and r.user_id=auth.uid()));

-- PDF の一時置き場。AI に送った直後に消し、消し損ねは list_expired_pdf_reading_uploads で拾う。
-- 運営が読めるポリシーは置かない（同意の文言で、運営は PDF を閲覧しないと約束している）。
-- 置ける名前は pdf_readings.upload_path と同じ形（<利用者の id>/<アップロードの id>.pdf）に限る。
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pdf-reading-sources','pdf-reading-sources',false,20971520,array['application/pdf']);
create policy pdf_reading_sources_upload on storage.objects for insert to authenticated
  with check(bucket_id='pdf-reading-sources' and app.can_use_general_features() and (storage.foldername(name))[1]=auth.uid()::text
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$');
create policy pdf_reading_sources_read on storage.objects for select to authenticated
  using(bucket_id='pdf-reading-sources' and (storage.foldername(name))[1]=auth.uid()::text);
create policy pdf_reading_sources_delete on storage.objects for delete to authenticated
  using(bucket_id='pdf-reading-sources' and (storage.foldername(name))[1]=auth.uid()::text);

-- 月の上限の10はここだけに置く。月は日本時間の暦月。
create function public.pdf_reading_remaining(p_user_id uuid)
returns integer language sql stable security definer set search_path='' as $$
  select greatest(10-count(*)::integer,0) from public.pdf_readings r
  where r.user_id=p_user_id
    and r.created_at>=date_trunc('month',now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'
$$;
revoke all on function public.pdf_reading_remaining(uuid) from public,anon,authenticated;
grant execute on function public.pdf_reading_remaining(uuid) to service_role;

-- 利用者ごとのロックの中で数えて入れるので、同時に押されても上限を超えない。
create function public.claim_pdf_reading(p_user_id uuid,p_report_id uuid,p_material_id uuid,p_upload_path text)
returns table(reading_id uuid,remaining integer)
language plpgsql security definer set search_path='' as $$
declare left_count integer; rid uuid;
begin
  if p_user_id is null or p_report_id is null or p_material_id is null or p_upload_path is null then
    raise exception 'invalid_body' using errcode='22023';
  end if;
  if not exists(select 1 from public.usage_reports r where r.id=p_report_id and r.author_user_id=p_user_id
    and r.material_id=p_material_id and r.status='draft' and r.form_version=2) then
    raise exception 'forbidden' using errcode='42501';
  end if;
  if split_part(p_upload_path,'/',1)<>p_user_id::text
    or not exists(select 1 from storage.objects o where o.bucket_id='pdf-reading-sources' and o.name=p_upload_path) then
    raise exception 'invalid_body' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('pdf_reading:'||p_user_id::text,0));
  left_count:=public.pdf_reading_remaining(p_user_id);
  if left_count<=0 then raise exception 'pdf_reading_limit' using errcode='P0001'; end if;
  insert into public.pdf_readings(user_id,report_id,material_id,upload_path)
  values(p_user_id,p_report_id,p_material_id,p_upload_path) returning id into rid;
  return query select rid,left_count-1;
end $$;
revoke all on function public.claim_pdf_reading(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_pdf_reading(uuid,uuid,uuid,text) to service_role;

-- AI を呼ぶ前や応答の前に失敗した場合は、モデル・速度・トークン数を省く。
create function public.finish_pdf_reading(p_reading_id uuid,p_user_id uuid,p_status text,p_model text default null,
  p_speed text default null,p_input_tokens integer default null,p_output_tokens integer default null,p_error_code text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  if p_status not in ('succeeded','failed') then raise exception 'invalid_body' using errcode='22023'; end if;
  update public.pdf_readings r set status=p_status,model=p_model,speed=p_speed,input_tokens=p_input_tokens,
    output_tokens=p_output_tokens,error_code=p_error_code,finished_at=now()
  where r.id=p_reading_id and r.user_id=p_user_id and r.status='reserved';
  if not found then raise exception 'conflict' using errcode='40001'; end if;
end $$;
revoke all on function public.finish_pdf_reading(uuid,uuid,text,text,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.finish_pdf_reading(uuid,uuid,text,text,text,integer,integer,text) to service_role;

-- 下書きに写した読み取りを applied にし、入れた値と引用を同じトランザクションで残す。
create function public.apply_pdf_reading(p_reading_id uuid,p_user_id uuid,p_fields jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare item jsonb;
begin
  if jsonb_typeof(p_fields) is distinct from 'array' or jsonb_array_length(p_fields)>2000 then
    raise exception 'invalid_body' using errcode='22023';
  end if;
  update public.pdf_readings r set status='applied'
  where r.id=p_reading_id and r.user_id=p_user_id and r.status='succeeded' and r.report_id is not null;
  if not found then raise exception 'conflict' using errcode='40001'; end if;
  for item in select value from jsonb_array_elements(p_fields) loop
    perform app.check_report_object(item,'{"fieldKey":"string","value":"string","quote":"string"}');
    insert into public.usage_report_pdf_reading_fields(reading_id,field_key,value,quote)
    values(p_reading_id,item->>'fieldKey',item->>'value',item->>'quote');
  end loop;
end $$;
revoke all on function public.apply_pdf_reading(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_pdf_reading(uuid,uuid,jsonb) to service_role;

create function public.list_expired_pdf_reading_uploads(p_limit integer)
returns setof text language sql stable security definer set search_path='' as $$
  select o.name from storage.objects o
  where o.bucket_id='pdf-reading-sources' and o.created_at<now()-interval '1 day'
  order by o.created_at limit least(greatest(p_limit,0),1000)
$$;
revoke all on function public.list_expired_pdf_reading_uploads(integer) from public,anon,authenticated;
grant execute on function public.list_expired_pdf_reading_uploads(integer) to service_role;

alter table public.usage_reports add column pdf_values_checked boolean not null default false;
grant select (pdf_values_checked) on public.usage_reports to authenticated;
comment on column public.usage_reports.pdf_values_checked is
  'PDF読み取りで入った値を元の PDF と照らし合わせて確かめたことの確認。適用済みの読み取りがあるレポートは、下書きから提出するときに必須。';

-- list_usage_report_previews は usage_reports の列を位置で返すので、列を足したら作り直す。
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
    r.form_version,false,false,''::text,''::text,false,false,''::text,false
  from public.usage_reports r join public.materials m on m.id=r.material_id
  where r.status='published' and m.publication_status='published'
$$;

-- 提出済みの既存レポートを公開できるよう、確認の必須は下書き→提出の遷移だけで確かめる。
create function app.assert_usage_report_pdf_submission(r public.usage_reports)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  if not r.pdf_values_checked
    and exists(select 1 from public.pdf_readings p where p.report_id=r.id and p.status='applied')
  then raise exception 'report_incomplete' using errcode='23514'; end if;
end $$;
revoke all on function app.assert_usage_report_pdf_submission(public.usage_reports) from public,anon,authenticated;

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
    perform app.assert_usage_report_pdf_submission(new);
  end if;
  return new;
end $$;
revoke all on function app.validate_structured_usage_report() from public,anon,authenticated;

-- 最上位に pdfValuesChecked を足す。それ以外は 20261025120000 と同じ。
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
  perform app.check_report_object(p_input,'{"reportId":"string","expectedUpdatedAt":"string|null","materialId":"string","cropId":"string|null","varietyUnknown":"boolean","varieties":"array","comparedMaterials":"array","commonPlotDescription":"string","observedChange":"string","purposeTags":"array","prefectureCode":"number|null","city":"string","showCity":"boolean","cultivationEnvironment":"string","timingStages":"array","timingNote":"string","plots":"array","measurements":"array","media":"array","documents":"array","headings":"array","methodDetailsAck":"boolean","documentsAck":"boolean","guidelineAck":"boolean","pdfValuesChecked":"boolean"}');
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
revoke all on function public.save_usage_report(jsonb,boolean) from public,anon;
grant execute on function public.save_usage_report(jsonb,boolean) to authenticated,service_role;
