begin;
create extension if not exists pgtap with schema extensions;
select plan(54);

insert into auth.users(id) values
  ('db932323-0000-4000-8000-000000000001'),('db932323-0000-4000-8000-000000000007'),
  ('db932323-0000-4000-8000-000000000008'),('db932323-0000-4000-8000-000000000009');
insert into public.profiles(user_id,handle,standpoint) values
  ('db932323-0000-4000-8000-000000000001','PDF読み取りの検証','farmer'),
  ('db932323-0000-4000-8000-000000000007','回数の検証','farmer'),
  ('db932323-0000-4000-8000-000000000008','月の境目の検証','farmer'),
  ('db932323-0000-4000-8000-000000000009','別の会員の検証','farmer');
insert into public.materials(id,name,manufacturer_name,publication_status)
values('db932323-0000-4000-8000-000000000002','PDF読み取りの検証','検証会社','published');
insert into public.usage_reports(id,material_id,author_user_id,observed_change,summary,pesticide_ack,form_version)
values('db932323-0000-4000-8000-000000000005','db932323-0000-4000-8000-000000000002','db932323-0000-4000-8000-000000000007','','',false,2);
insert into storage.objects(bucket_id,name)
select 'pdf-reading-sources',format('db932323-0000-4000-8000-000000000007/db932323-0000-4000-9000-%s.pdf',lpad(i::text,12,'0'))
from generate_series(1,11) i;
insert into storage.objects(bucket_id,name) values
  ('pdf-reading-sources','db932323-0000-4000-8000-000000000001/db932323-0000-4000-9001-000000000001.pdf'),
  ('pdf-reading-sources','db932323-0000-4000-8000-000000000001/db932323-0000-4000-9001-000000000002.pdf'),
  ('pdf-reading-sources','db932323-0000-4000-8000-000000000001/db932323-0000-4000-9001-000000000003.pdf');

create function pg_temp.path(p_user text,p_n integer,p_group text default '9000') returns text language sql as $$
  select format('db932323-0000-4000-8000-%s/db932323-0000-4000-%s-%s.pdf',p_user,p_group,lpad(p_n::text,12,'0'))
$$;
create function pg_temp.report_input(p_report text,p_seed text,p_checked boolean default false) returns jsonb language sql as $$
  select jsonb_build_object(
    'reportId',p_report,
    'expectedUpdatedAt',(select updated_at from public.usage_reports where id=p_report::uuid),
    'materialId','db932323-0000-4000-8000-000000000002',
    'cropId',(select id from public.crops limit 1),
    'varietyUnknown',false,
    'varieties',jsonb_build_array(jsonb_build_object('id',format('db932323-0000-4000-%s-000000000011',p_seed),'name','新藍')),
    'comparedMaterials','[]'::jsonb,
    'commonPlotDescription','',
    'observedChange','結果を記入',
    'purposeTags',jsonb_build_array((select name from public.effects limit 1)),
    'prefectureCode',null,'city','','showCity',false,
    'cultivationEnvironment','露地','timingStages','[3]'::jsonb,'timingNote','9月20日に施用',
    'plots',jsonb_build_array(
      jsonb_build_object('id',format('db932323-0000-4000-%s-000000000021',p_seed),'name','無処理区','scope','','description','資材なし','steps','[]'::jsonb,
        'varietyId',format('db932323-0000-4000-%s-000000000011',p_seed),'treatment',jsonb_build_object('kind','untreated')),
      jsonb_build_object('id',format('db932323-0000-4000-%s-000000000022',p_seed),'name','処理区','scope','','description','1000倍を3回','steps','[]'::jsonb,
        'varietyId',format('db932323-0000-4000-%s-000000000011',p_seed),'treatment',jsonb_build_object('kind','posted'))),
    'measurements',jsonb_build_array(jsonb_build_object('id',format('db932323-0000-4000-%s-000000000031',p_seed),
      'kind','text','name','観察','unit','','body','差が見られた','graphs','[]'::jsonb)),
    'media','[]'::jsonb,'documents','[]'::jsonb,'headings','[]'::jsonb,
    'methodDetailsAck',true,'documentsAck',false,'guidelineAck',true,'pdfValuesChecked',p_checked)
$$;

select is((select format('%s/%s/%s',public,file_size_limit,allowed_mime_types) from storage.buckets where id='pdf-reading-sources'),
  'f/20971520/{application/pdf}','PDF sources bucket is private, 20MB and PDF only');

select set_config('request.jwt.claims','{"sub":"db932323-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select lives_ok($$select public.save_usage_report(pg_temp.report_input('db932323-0000-4000-8000-000000000003','8001'),false)$$,'draft saves with pdfValuesChecked');
select lives_ok($$select public.save_usage_report(pg_temp.report_input('db932323-0000-4000-8000-000000000004','8002'),false)$$,'second draft saves');
select throws_ok($$select * from public.claim_pdf_reading('db932323-0000-4000-8000-000000000001','db932323-0000-4000-8000-000000000003','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000001',1,'9001'))$$,
  '42501',null,'member cannot claim a reading directly');
select throws_ok($$select public.pdf_reading_remaining('db932323-0000-4000-8000-000000000001')$$,'42501',null,'member cannot call the counter directly');
select throws_ok($$insert into public.pdf_readings(user_id,upload_path) values('db932323-0000-4000-8000-000000000001',pg_temp.path('000000000001',1,'9001'))$$,
  '42501',null,'member cannot write reading records');
reset role;

set local role service_role;
select is(public.pdf_reading_remaining('db932323-0000-4000-8000-000000000007'),10,'a new member has 10 readings this month');
select throws_ok($$select * from public.claim_pdf_reading('db932323-0000-4000-8000-000000000009','db932323-0000-4000-8000-000000000005','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000009',1))$$,
  '42501','forbidden','cannot claim on another member report');
select throws_ok($$select * from public.claim_pdf_reading('db932323-0000-4000-8000-000000000007','db932323-0000-4000-8000-000000000005','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000001',1,'9001'))$$,
  '22023','invalid_body','cannot claim with a PDF in another member folder');
select throws_ok($$select * from public.claim_pdf_reading('db932323-0000-4000-8000-000000000007','db932323-0000-4000-8000-000000000005','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000007',99))$$,
  '22023','invalid_body','cannot claim before the PDF is uploaded');
select is((select remaining from public.claim_pdf_reading('db932323-0000-4000-8000-000000000007','db932323-0000-4000-8000-000000000005','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000007',1))),
  9,'first claim leaves 9');
select throws_ok($$select * from public.claim_pdf_reading('db932323-0000-4000-8000-000000000007','db932323-0000-4000-8000-000000000005','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000007',1))$$,
  '23505',null,'the same upload cannot be claimed twice');
select is(public.pdf_reading_remaining('db932323-0000-4000-8000-000000000007'),9,'a repeated upload does not use a reading');
select is((select array_agg(c.remaining order by i) from generate_series(2,10) i
  cross join lateral public.claim_pdf_reading('db932323-0000-4000-8000-000000000007','db932323-0000-4000-8000-000000000005','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000007',i)) c),
  array[8,7,6,5,4,3,2,1,0],'claims 2 to 10 pass');
select throws_ok($$select * from public.claim_pdf_reading('db932323-0000-4000-8000-000000000007','db932323-0000-4000-8000-000000000005','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000007',11))$$,
  'P0001','pdf_reading_limit','the 11th claim in a month is refused');
select is((select count(*)::integer from public.pdf_readings where user_id='db932323-0000-4000-8000-000000000007'),10,'the refused claim leaves no record');
select is(public.pdf_reading_remaining('db932323-0000-4000-8000-000000000009'),10,'another member keeps their own readings');
reset role;

select set_config('request.jwt.claims','{"sub":"db932323-0000-4000-8000-000000000007","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select lives_ok($$delete from public.usage_reports where id='db932323-0000-4000-8000-000000000005'$$,'author deletes the draft');
reset role;
select is((select count(*)::integer from public.pdf_readings where user_id='db932323-0000-4000-8000-000000000007' and report_id is null),10,'records stay after the draft is deleted');
select is(public.pdf_reading_remaining('db932323-0000-4000-8000-000000000007'),0,'deleting the draft does not give readings back');

-- 日本時間の1日0時（UTC では前月末日の15時）の前後に1件ずつと、UTC ではまだ前月の1件。
insert into public.pdf_readings(user_id,upload_path,created_at)
select 'db932323-0000-4000-8000-000000000008',pg_temp.path('000000000008',n),
  date_trunc('month',now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo'+offset_by
from (values(1,interval '-1 second'),(2,interval '0'),(3,interval '1 hour')) as t(n,offset_by);
select is(public.pdf_reading_remaining('db932323-0000-4000-8000-000000000008'),8,'the month starts at 00:00 on the 1st in Japan time');

set local role service_role;
create temp table claimed as
select 'reading1' as label,reading_id from public.claim_pdf_reading('db932323-0000-4000-8000-000000000001','db932323-0000-4000-8000-000000000003','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000001',1,'9001'))
union all
select 'reading2',reading_id from public.claim_pdf_reading('db932323-0000-4000-8000-000000000001','db932323-0000-4000-8000-000000000004','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000001',2,'9001'))
union all
select 'reading3',reading_id from public.claim_pdf_reading('db932323-0000-4000-8000-000000000001','db932323-0000-4000-8000-000000000003','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000001',3,'9001'));
create function pg_temp.reading(p_label text) returns uuid language sql as $$ select reading_id from claimed where label=p_label $$;

select throws_ok($$select public.apply_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000001','[]')$$,'40001','conflict','a reserved reading cannot be applied');
select throws_ok($$select public.finish_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000001','succeeded','claude-opus-5-5','fast',null,null,null)$$,
  '23514',null,'success needs the token counts');
select throws_ok($$select public.finish_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000001','applied','claude-opus-5-5','fast',1,1,null)$$,
  '22023','invalid_body','finish only records success or failure');
select throws_ok($$select public.finish_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000009','succeeded','claude-opus-5-5','fast',1200,300,null)$$,
  '40001','conflict','another member cannot finish the reading');
select lives_ok($$select public.finish_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000001','succeeded','claude-opus-5-5','fast',1200,300,null)$$,'success is recorded');
select throws_ok($$select public.finish_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000001','failed','claude-opus-5-5','fast',null,null,'timeout')$$,
  '40001','conflict','a finished reading cannot be finished again');
select throws_ok($$select public.finish_pdf_reading(pg_temp.reading('reading3'),'db932323-0000-4000-8000-000000000001','failed','claude-opus-5-5','standard',null,null,null)$$,
  '23514',null,'failure needs a reason');
select lives_ok($$select public.finish_pdf_reading(pg_temp.reading('reading3'),'db932323-0000-4000-8000-000000000001','failed','claude-opus-5-5','standard',null,null,'timeout')$$,'failure is recorded');
select throws_ok($$select public.apply_pdf_reading(pg_temp.reading('reading3'),'db932323-0000-4000-8000-000000000001','[]')$$,'40001','conflict','a failed reading cannot be applied');
select throws_ok($$select public.apply_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000001','[{"fieldKey":"plots.1.name","value":"処理区","quote":"処理区"}]')$$,
  '23514',null,'field key must be a typed path');
select is((select status from public.pdf_readings where id=pg_temp.reading('reading1')),'succeeded','a rejected apply leaves the reading unapplied');
select lives_ok($$select public.apply_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000001',
  '[{"fieldKey":"observedChange","value":"結果を記入","quote":"処理区で葉色が濃い"},{"fieldKey":"plots.db932323-0000-4000-8001-000000000022.name","value":"処理区","quote":"処理区（1000倍）"}]')$$,
  'applying records values and quotes');
select throws_ok($$select public.apply_pdf_reading(pg_temp.reading('reading1'),'db932323-0000-4000-8000-000000000001','[]')$$,'40001','conflict','a reading is applied once');
select lives_ok($$select public.finish_pdf_reading(pg_temp.reading('reading2'),'db932323-0000-4000-8000-000000000001','succeeded','claude-opus-5-5','standard',900,200,null)$$,'second reading succeeds');
reset role;

select set_config('request.jwt.claims','{"sub":"db932323-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from public.pdf_readings),3,'member reads their own reading records');
select is((select string_agg(field_key||'='||value,',' order by field_key) from public.usage_report_pdf_reading_fields),
  'observedChange=結果を記入,plots.db932323-0000-4000-8001-000000000022.name=処理区','member reads their own values and quotes');
select is((select count(*)::integer from storage.objects where bucket_id='pdf-reading-sources'),3,'member reads their own PDFs');
select throws_ok($$select public.save_usage_report(pg_temp.report_input('db932323-0000-4000-8000-000000000003','8001'),true)$$,
  '23514',null,'a report with an applied reading needs the check to submit');
select lives_ok($$select public.save_usage_report(pg_temp.report_input('db932323-0000-4000-8000-000000000003','8001',true),true)$$,'checked report submits');
select is((select status||'/'||pdf_values_checked from public.usage_reports where id='db932323-0000-4000-8000-000000000003'),'pending/true','submitted with the check');
select throws_ok($$select public.save_usage_report(pg_temp.report_input('db932323-0000-4000-8000-000000000004','8002'),true)$$,
  '23514',null,'a succeeded reading not yet recorded as applied still needs the check');
select lives_ok($$select public.save_usage_report(pg_temp.report_input('db932323-0000-4000-8000-000000000004','8002',true),true)$$,
  'checked report with a succeeded reading submits');
reset role;

set local role service_role;
select throws_ok($$select * from public.claim_pdf_reading('db932323-0000-4000-8000-000000000001','db932323-0000-4000-8000-000000000003','db932323-0000-4000-8000-000000000002',pg_temp.path('000000000001',3,'9001'))$$,
  '42501','forbidden','a submitted report cannot be read into');
reset role;

select set_config('request.jwt.claims','{"sub":"db932323-0000-4000-8000-000000000009","role":"authenticated","app_metadata":{"account_type":"general"}}',true);
set local role authenticated;
select is((select count(*)::integer from public.pdf_readings),0,'other member cannot read reading records');
select is((select count(*)::integer from public.usage_report_pdf_reading_fields),0,'other member cannot read values and quotes');
select is((select count(*)::integer from storage.objects where bucket_id='pdf-reading-sources'),0,'other member cannot read the PDFs');
select throws_ok($$insert into storage.objects(bucket_id,name) values('pdf-reading-sources',pg_temp.path('000000000001',4,'9001'))$$,
  '42501',null,'other member cannot upload into the owner folder');
select throws_ok($$insert into storage.objects(bucket_id,name) values('pdf-reading-sources','db932323-0000-4000-8000-000000000009/成績書.pdf')$$,
  '42501',null,'uploads must use the reading path');
select lives_ok($$insert into storage.objects(bucket_id,name) values('pdf-reading-sources',pg_temp.path('000000000009',4,'9002'))$$,
  'member uploads into their own folder');
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select throws_ok($$select * from public.pdf_readings$$,'42501',null,'anonymous cannot query reading records');
reset role;

-- 確認の列が無かったころに提出されたレポート（確認は false）に、適用済みの読み取りがあっても公開できる。
update public.usage_reports set pdf_values_checked=false where id='db932323-0000-4000-8000-000000000004';
insert into public.pdf_readings(user_id,report_id,material_id,upload_path,status,model,speed,input_tokens,output_tokens,finished_at)
values('db932323-0000-4000-8000-000000000001','db932323-0000-4000-8000-000000000004','db932323-0000-4000-8000-000000000002',
  pg_temp.path('000000000001',5,'9001'),'applied','claude-opus-5-5','fast',1,1,now());
select lives_ok($$update public.usage_reports set status='published',published_at=now() where id='db932323-0000-4000-8000-000000000004'$$,
  'publishing a submitted report does not need the check');
select is((select count(*)::integer from public.list_usage_report_previews() where id='db932323-0000-4000-8000-000000000004'),1,'previews still list published reports');

insert into storage.objects(bucket_id,name,created_at) values
  ('pdf-reading-sources',pg_temp.path('000000000009',1,'9002'),now()-interval '25 hours'),
  ('pdf-reading-sources',pg_temp.path('000000000009',2,'9002'),now()-interval '23 hours'),
  ('report-documents',pg_temp.path('000000000009',3,'9002'),now()-interval '25 hours');
set local role service_role;
select is(array(select u from public.list_expired_pdf_reading_uploads(1000) u where u like 'db932323-%'),
  array[pg_temp.path('000000000009',1,'9002')],'only PDFs left for more than a day are listed for removal');
reset role;

select * from finish();
rollback;
