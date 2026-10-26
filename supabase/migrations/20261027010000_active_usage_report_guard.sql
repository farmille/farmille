-- 同じ利用者・資材の下書きと確認中レポートを、保存RPCから重複させない。
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
  -- 同じ利用者の新規保存と資材変更を直列化し、別タブからの重複も防ぐ。
  perform pg_advisory_xact_lock(hashtextextended('active_report:'||uid::text,0));
  -- 同じ下書きの初回保存同士も直列化し、再送で既存内容を上書きしない。
  perform pg_advisory_xact_lock(hashtextextended(rid::text,0));
  select * into existing from public.usage_reports r where r.id=rid for update;
  if found then
    if existing.author_user_id<>uid or existing.status<>'draft' then raise exception 'forbidden' using errcode='42501'; end if;
    if existing.updated_at is distinct from (p_input->>'expectedUpdatedAt')::timestamptz then raise exception 'report_conflict' using errcode='40001'; end if;
  elsif p_input->>'expectedUpdatedAt' is not null then raise exception 'report_conflict' using errcode='40001'; end if;
  if not exists(select 1 from public.materials m where m.id=(p_input->>'materialId')::uuid and m.publication_status='published') then raise exception 'material_unavailable' using errcode='23514'; end if;
  -- 移行前からある重複は削除しない。同じレポートの編集は残し、新規作成・移動で増やさせない。
  if (existing.id is null or existing.material_id is distinct from (p_input->>'materialId')::uuid)
    and exists(select 1 from public.usage_reports r
      where r.author_user_id=uid and r.material_id=(p_input->>'materialId')::uuid
        and r.status in ('draft','pending') and r.id<>rid) then
    raise exception 'active_report_exists' using errcode='23505';
  end if;
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
