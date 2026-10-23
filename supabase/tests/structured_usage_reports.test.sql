begin;
create extension if not exists pgtap with schema extensions;
select plan(46);
select ok(app.report_value_is_numeric('-1.2±0.4 ＊'),'negative annotated number accepted');
select ok(app.report_value_is_numeric('0'),'zero accepted');
select ok(not app.report_value_is_numeric('n.s.'),'non numeric prefix rejected');
select ok(not app.report_value_is_numeric(repeat('9',400)),'non finite graph value rejected');
insert into auth.users(id) values('aa932323-0000-4000-8000-000000000001'),('aa932323-0000-4000-8000-000000000004');
insert into public.profiles(user_id,handle,standpoint) values('aa932323-0000-4000-8000-000000000001','構造化レポート検証','farmer'),('aa932323-0000-4000-8000-000000000004','別の投稿者','farmer');
insert into public.materials(id,name,manufacturer_name,publication_status) values('aa932323-0000-4000-8000-000000000002','構造化レポート検証','検証会社','published');
insert into storage.objects(bucket_id,name) values('report-documents','aa932323-0000-4000-8000-000000000001/sample.pdf');
create function pg_temp.report_input(complete boolean default false) returns jsonb language sql as $$
 select '{"reportId": "aa932323-0000-4000-8000-000000000003", "expectedUpdatedAt": null, "materialId": "aa932323-0000-4000-8000-000000000002", "cropId": null, "variety": "", "varietyUnknown": false, "observedChange": "", "purposeTags": [], "prefectureCode": null, "city": "非公開の市", "showCity": false, "cultivationEnvironment": "", "timingStages": [], "timingNote": "", "plots": [], "measurements": [], "media": [], "documents": [], "headings": [], "methodDetailsAck": false, "documentsAck": false, "guidelineAck": false}'::jsonb
 || jsonb_build_object('expectedUpdatedAt',(select updated_at from public.usage_reports where id='aa932323-0000-4000-8000-000000000003'))
 || case when complete then '{"observedChange": "結果を記入", "cultivationEnvironment": "露地", "purposeTags": [], "timingStages": [3], "timingNote": "9月20日に施用", "plots": [{"id": "aa932323-0000-4000-8000-000000000011", "name": "処理区", "scope": "10株", "description": "1000倍を3回", "steps": [{"id": "aa932323-0000-4000-8000-000000000013", "method": "spray", "targets": ["茎葉"], "otherText": ""}]}, {"id": "aa932323-0000-4000-8000-000000000012", "name": "無処理区", "scope": "10株", "description": "資材なし", "steps": []}], "measurements": [{"id": "aa932323-0000-4000-8000-000000000021", "kind": "numeric", "name": "草丈", "unit": "cm", "body": "切替前の文章を保持", "graphs": [{"id": "aa932323-0000-4000-8000-000000000022", "heading": "9月", "rows": [{"id": "aa932323-0000-4000-8000-000000000023", "plotId": "aa932323-0000-4000-8000-000000000011", "label": "", "value": "41.7±0.8 a"}, {"id": "aa932323-0000-4000-8000-000000000024", "plotId": "aa932323-0000-4000-8000-000000000012", "label": "", "value": "0"}]}]}], "methodDetailsAck": true, "guidelineAck": true}'::jsonb || jsonb_build_object('cropId',(select id from public.crops limit 1),'purposeTags',jsonb_build_array((select name from public.effects limit 1))) else '{}'::jsonb end;
$$;
select set_config('request.jwt.claims','{"sub":"aa932323-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select lives_ok($$select public.save_usage_report(pg_temp.report_input(),false)$$,'empty draft saves without crop and consents');
select is((select crop_id from public.usage_reports where id='aa932323-0000-4000-8000-000000000003'),null::uuid,'draft crop remains null');
select is((select city from public.usage_report_private_locations where report_id='aa932323-0000-4000-8000-000000000003'),'非公開の市','owner restores private city');
select throws_ok($$select public.save_usage_report(pg_temp.report_input(),true)$$,'23514',null,'incomplete submit rejected');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(),'{expectedUpdatedAt}','null'),false)$$,'40001',null,'stale draft cannot overwrite');
select throws_ok($$select public.save_usage_report(pg_temp.report_input()-'plots',false)$$,'23514',null,'malformed payload rejected');
select lives_ok($$select public.save_usage_report(pg_temp.report_input(true),false)$$,'complete nested draft saves');
select is((select value_text from public.usage_report_graph_rows where id='aa932323-0000-4000-8000-000000000023'),'41.7±0.8 a','raw statistical annotation preserved');
select is((select body from public.usage_report_measurements where id='aa932323-0000-4000-8000-000000000021'),'切替前の文章を保持','hidden text preserved in numeric mode');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(true),'{plots,0,steps,0,targets}','["種子"]'),false)$$,'23514',null,'method target combination checked');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(true),'{measurements,0,graphs,0,rows,0,plotId}','"aa932323-0000-4000-8000-000000000099"'),false)$$,'23514',null,'foreign plot reference rejected');
select is((select value_text from public.usage_report_graph_rows where id='aa932323-0000-4000-8000-000000000023'),'41.7±0.8 a','failed replacement rolls back all children');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(true),'{purposeTags}','["未知の効果"]'),false)$$,'23514',null,'unknown effect rejected');
select throws_ok($$insert into public.usage_report_plots values('aa932323-0000-4000-8000-000000000030','aa932323-0000-4000-8000-000000000003','侵入','','',0)$$,'42501',null,'direct child write denied');
select throws_ok($$update public.usage_reports set form_version=1 where id='aa932323-0000-4000-8000-000000000003'$$,'23514',null,'version downgrade cannot bypass submission validation');
select throws_ok($$update public.usage_reports set observed_change='',status='pending' where id='aa932323-0000-4000-8000-000000000003'$$,'23514',null,'direct status transition checks required inputs');
reset role;
select set_config('request.jwt.claims','{"sub":"aa932323-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from public.usage_report_plots where report_id='aa932323-0000-4000-8000-000000000003'),0,'other member cannot read draft children');
select throws_ok($$select public.save_usage_report(pg_temp.report_input(),false)$$,'42501',null,'other owner cannot overwrite draft');
reset role;
select set_config('request.jwt.claims','{"sub":"aa932323-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.report_input(true),'{documents}','[{"id":"aa932323-0000-4000-8000-000000000041","path":"aa932323-0000-4000-8000-000000000001/sample.pdf","name":"試験.pdf"}]'),true)$$,'23514',null,'PDF submission requires rights acknowledgement');
select throws_ok($$select public.save_usage_report(jsonb_set(jsonb_set(pg_temp.report_input(true),'{documents}','[{"id":"aa932323-0000-4000-8000-000000000041","path":"aa932323-0000-4000-8000-000000000001/sample.pdf","name":"試験.pdf"}]'),'{documents,0,path}','"aa932323-0000-4000-8000-000000000001/missing.pdf"'),false)$$,'23514',null,'missing PDF object rejected');
select lives_ok($$select public.save_usage_report(jsonb_set(jsonb_set(pg_temp.report_input(true),'{documents}','[{"id":"aa932323-0000-4000-8000-000000000041","path":"aa932323-0000-4000-8000-000000000001/sample.pdf","name":"試験.pdf"}]'),'{documentsAck}','true'),true)$$,'valid PDF submits atomically');
select is((select storage_path from public.usage_report_documents where report_id='aa932323-0000-4000-8000-000000000003'),'aa932323-0000-4000-8000-000000000001/sample.pdf','PDF path retained');
select is((select status from public.usage_reports where id='aa932323-0000-4000-8000-000000000003'),'pending','editorial review remains required');
select throws_ok($$select public.save_usage_report(pg_temp.report_input(true),false)$$,'42501',null,'submitted report cannot be edited by author');
reset role;
select set_config('request.jwt.claims','{"sub":"aa932323-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from storage.objects where bucket_id='report-documents' and name='aa932323-0000-4000-8000-000000000001/sample.pdf'),0,'member cannot read pending PDF');
reset role;
update public.usage_reports set status='published',published_at=now() where id='aa932323-0000-4000-8000-000000000003';
select set_config('request.jwt.claims','{"sub":"aa932323-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from storage.objects where bucket_id='report-documents' and name='aa932323-0000-4000-8000-000000000001/sample.pdf'),1,'member can read published PDF');
select is((select count(*)::integer from public.usage_report_plots where report_id='aa932323-0000-4000-8000-000000000003'),2,'member can read published plots');
select is((select count(*)::integer from public.usage_report_private_locations where report_id='aa932323-0000-4000-8000-000000000003'),0,'private city hidden from members');
reset role;
update public.usage_reports set publish_city=true where id='aa932323-0000-4000-8000-000000000003';
set local role authenticated;
select is((select city from public.usage_report_private_locations where report_id='aa932323-0000-4000-8000-000000000003'),'非公開の市','city visible after explicit opt in');
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*)::integer from storage.objects where bucket_id='report-documents' and name='aa932323-0000-4000-8000-000000000001/sample.pdf'),0,'anonymous cannot read PDF');
select is((select cultivation_environment from public.list_usage_report_previews() where id='aa932323-0000-4000-8000-000000000003'),'','anonymous preview masks new body columns');
select throws_ok($$select * from public.usage_report_plots where report_id='aa932323-0000-4000-8000-000000000003'$$,'42501',null,'anonymous cannot query structured detail');
reset role;
select set_config('request.jwt.claims','{"sub":"aa932323-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
insert into storage.objects(bucket_id,name) values('report-media','aa932323-0000-4000-8000-000000000001/graph.png');
create function pg_temp.page_input(p_media boolean default true) returns jsonb language sql as $$
 select pg_temp.report_input(true)
 || jsonb_build_object('reportId','aa932323-0000-4000-8000-000000000005',
   'plots','[{"id":"aa932323-0000-4000-8000-000000000053","name":"処理区","scope":"","description":"10株を調査、1000倍を3回","steps":[]},{"id":"aa932323-0000-4000-8000-000000000054","name":"無処理区","scope":"","description":"10株を調査、資材なし","steps":[]}]'::jsonb,
   'expectedUpdatedAt',(select updated_at from public.usage_reports where id='aa932323-0000-4000-8000-000000000005'),
   'measurements','[{"id":"aa932323-0000-4000-8000-000000000051","kind":"image","name":"収量","unit":"","body":"","graphs":[]}]'::jsonb,
   'media',case when p_media then '[{"id":"aa932323-0000-4000-8000-000000000052","url":"http://127.0.0.1:54321/storage/v1/object/public/report-media/aa932323-0000-4000-8000-000000000001/graph.png","mediaType":"photo","section":"measurements","caption":"","measurementId":"aa932323-0000-4000-8000-000000000051"}]'::jsonb else '[]'::jsonb end)
$$;
set local role authenticated;
select lives_ok($$select public.save_usage_report(pg_temp.page_input(false),false)$$,'page draft saves an image measurement without pictures');
select throws_ok($$select public.save_usage_report(pg_temp.page_input(false),true)$$,'23514',null,'image measurement requires a picture to submit');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.page_input(),'{media,0,measurementId}','"aa932323-0000-4000-8000-000000000021"'),false)$$,'23514',null,'picture cannot point to another report measurement');
select throws_ok($$select public.save_usage_report(jsonb_set(pg_temp.page_input(),'{media,0,mediaType}','"video"'),false)$$,'23514',null,'measurement picture must be a photo');
select lives_ok($$select public.save_usage_report(pg_temp.page_input() #- '{media,0,measurementId}',false)$$,'media without measurementId key saves as before');
select lives_ok($$select public.save_usage_report(pg_temp.page_input(),true)$$,'page version submits without survey scope or numeric graph');
select is((select measurement_id from public.usage_report_media where id='aa932323-0000-4000-8000-000000000052'),'aa932323-0000-4000-8000-000000000051'::uuid,'picture keeps its measurement');
select is((select string_agg(survey_scope,'') from public.usage_report_plots where report_id='aa932323-0000-4000-8000-000000000005'),'','empty survey scope accepted');
reset role;
update public.usage_reports set status='published',published_at=now() where id='aa932323-0000-4000-8000-000000000005';
select is(app.public_usage_report_cover_id('aa932323-0000-4000-8000-000000000005'),null::uuid,'measurement picture is not used as the cover');
select lives_ok($$delete from public.usage_reports where id='aa932323-0000-4000-8000-000000000003'$$,'deleting report cascades nested graph rows safely');
select * from finish();
rollback;
