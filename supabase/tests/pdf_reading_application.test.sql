begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users(id) values ('db932324-0000-4000-8000-000000000001');
insert into public.profiles(user_id,handle,standpoint) values ('db932324-0000-4000-8000-000000000001','再送の検証','farmer');
insert into public.materials(id,name,manufacturer_name,publication_status)
values ('db932324-0000-4000-8000-000000000002','再送の検証資材','検証メーカー','published');
insert into public.usage_reports(id,material_id,author_user_id,observed_change,summary,pesticide_ack,form_version,pdf_values_checked)
values ('db932324-0000-4000-8000-000000000003','db932324-0000-4000-8000-000000000002','db932324-0000-4000-8000-000000000001','','',false,2,true);
insert into public.pdf_readings(id,user_id,report_id,material_id,upload_path,status,model,speed,input_tokens,output_tokens,finished_at)
select format('db932324-0000-4000-8000-%s',lpad(n::text,12,'0'))::uuid,
  'db932324-0000-4000-8000-000000000001','db932324-0000-4000-8000-000000000003','db932324-0000-4000-8000-000000000002',
  format('db932324-0000-4000-8000-000000000001/db932324-0000-4000-8000-%s.pdf',lpad(n::text,12,'0')),
  'succeeded','claude-opus-5-5','fast',1,1,now()
from generate_series(11,12) n;

create function pg_temp.apply_fields(p_fields jsonb,p_user uuid default 'db932324-0000-4000-8000-000000000001')
returns void language sql as $$
  select public.apply_pdf_reading('db932324-0000-4000-8000-000000000011',p_user,p_fields)
$$;
create function pg_temp.fields() returns jsonb language sql as $$
  select '[{"fieldKey":"observedChange","value":"結果","quote":"引用"},{"fieldKey":"cultivationEnvironment","value":"露地","quote":"露地栽培"}]'::jsonb
$$;

set local role service_role;
select lives_ok($$select pg_temp.apply_fields(pg_temp.fields())$$,'first application succeeds');
reset role;
create temporary table original_application as
select r.applied_at,u.updated_at from public.pdf_readings r join public.usage_reports u on u.id=r.report_id
where r.id='db932324-0000-4000-8000-000000000011';
set local role service_role;
select lives_ok($$select pg_temp.apply_fields(pg_temp.fields())$$,'same application can be retried after a lost response');
select lives_ok($$select pg_temp.apply_fields(jsonb_build_array(pg_temp.fields()->1,pg_temp.fields()->0))$$,'field order does not matter');
select throws_ok($$select pg_temp.apply_fields('[]')$$,'40001','conflict','missing fields conflict');
select throws_ok($$select pg_temp.apply_fields(jsonb_set(pg_temp.fields(),'{0,value}','"別の値"'))$$,'40001','conflict','different values conflict');
select throws_ok($$select pg_temp.apply_fields(jsonb_set(pg_temp.fields(),'{0,quote}','"別の引用"'))$$,'40001','conflict','different quotes conflict');
select throws_ok($$select pg_temp.apply_fields(pg_temp.fields()||jsonb_build_array(pg_temp.fields()->0))$$,'40001','conflict','duplicated fields conflict');
select throws_ok($$select pg_temp.apply_fields(pg_temp.fields(),'db932324-0000-4000-8000-000000000009')$$,'40001','conflict','another user cannot retry');
reset role;
select is((select count(*)::integer from public.usage_report_pdf_reading_fields where reading_id='db932324-0000-4000-8000-000000000011'),2,'retries do not duplicate fields');
select is((select value from public.usage_report_pdf_reading_fields where reading_id='db932324-0000-4000-8000-000000000011' and field_key='observedChange'),'結果','rejected retries preserve values');
select is((select applied_at from public.pdf_readings where id='db932324-0000-4000-8000-000000000011'),(select applied_at from original_application),'retries preserve applied_at');
select is((select updated_at from public.usage_reports where id='db932324-0000-4000-8000-000000000003'),(select updated_at from original_application),'retries preserve updated_at');

-- 利用者が値を確認した後の再送で、確認を外さない。
update public.usage_reports set pdf_values_checked=true where id='db932324-0000-4000-8000-000000000003';
set local role service_role;
select lives_ok($$select pg_temp.apply_fields(pg_temp.fields())$$,'retry after the user checks the values succeeds');
reset role;
select is((select pdf_values_checked from public.usage_reports where id='db932324-0000-4000-8000-000000000003'),true,'retry preserves a subsequent check');

-- 別の読み取りの適用後も、古い読み取りの再送で印の順序を変えない。
set local role service_role;
select lives_ok($$select public.apply_pdf_reading('db932324-0000-4000-8000-000000000012','db932324-0000-4000-8000-000000000001','[]')$$,'an empty application succeeds');
select lives_ok($$select public.apply_pdf_reading('db932324-0000-4000-8000-000000000012','db932324-0000-4000-8000-000000000001','[]')$$,'an empty application can be retried');
select lives_ok($$select pg_temp.apply_fields(pg_temp.fields())$$,'retrying an older reading succeeds');
reset role;
select is((select id from public.pdf_readings where report_id='db932324-0000-4000-8000-000000000003' order by applied_at desc limit 1),
  'db932324-0000-4000-8000-000000000012'::uuid,'retrying an older reading keeps the latest marks');
select * from finish();
rollback;
