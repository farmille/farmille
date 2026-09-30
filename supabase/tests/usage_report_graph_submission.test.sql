begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select ok(app.report_value_is_numeric('1,250'),'comma-separated number accepted');
select ok(app.report_value_is_numeric('1,250.5±12.5 a'),'comma-separated number with error accepted');
select ok(app.report_value_is_numeric('1,234,567'),'multiple comma groups accepted');
select ok(app.report_value_is_numeric('82 ± foo'),'numeric prefix remains valid before incomplete error text');

insert into auth.users(id) values('ba932323-0000-4000-8000-000000000001');
insert into public.profiles(user_id,handle,standpoint)
values('ba932323-0000-4000-8000-000000000001','グラフ提出検証','farmer');
insert into public.materials(id,name,manufacturer_name,publication_status)
values('ba932323-0000-4000-8000-000000000002','グラフ提出検証','検証会社','published');

insert into public.usage_reports(
  id,material_id,author_user_id,crop_id,observed_change,summary,purpose_tags,cultivation_environment,
  timing_note,method_details_ack,pesticide_ack,form_version
)
select
  id,'ba932323-0000-4000-8000-000000000002','ba932323-0000-4000-8000-000000000001',
  (select id from public.crops limit 1),'結果を記入','結果の要約',array[(select name from public.effects limit 1)],
  '露地','9月20日に施用',true,true,2
from (values
  ('ba932323-0000-4000-8000-000000000003'::uuid),
  ('ba932323-0000-4000-8000-000000000004'::uuid)
) reports(id);
insert into public.usage_report_timings(report_id,stage)
values
  ('ba932323-0000-4000-8000-000000000003',3),
  ('ba932323-0000-4000-8000-000000000004',3);
insert into public.usage_report_plots(id,report_id,name,survey_scope,description,sort_order)
values
  ('ba932323-0000-4000-8000-000000000011','ba932323-0000-4000-8000-000000000003','処理区','10株','1000倍を3回',0),
  ('ba932323-0000-4000-8000-000000000012','ba932323-0000-4000-8000-000000000003','無処理区','10株','資材なし',1),
  ('ba932323-0000-4000-8000-000000000013','ba932323-0000-4000-8000-000000000004','処理区','10株','1000倍を3回',0),
  ('ba932323-0000-4000-8000-000000000014','ba932323-0000-4000-8000-000000000004','無処理区','10株','資材なし',1);
insert into public.usage_report_measurements(id,report_id,kind,name,unit,body,sort_order)
values
  ('ba932323-0000-4000-8000-000000000021','ba932323-0000-4000-8000-000000000003','text','観察結果','','差が見られた',0),
  ('ba932323-0000-4000-8000-000000000022','ba932323-0000-4000-8000-000000000004','numeric','収量','kg','',0);
insert into public.usage_report_graphs(id,measurement_id,heading,sort_order)
values('ba932323-0000-4000-8000-000000000031','ba932323-0000-4000-8000-000000000022','9月',0);
insert into public.usage_report_graph_rows(id,graph_id,plot_id,label,value_text,sort_order)
values
  ('ba932323-0000-4000-8000-000000000041','ba932323-0000-4000-8000-000000000031','ba932323-0000-4000-8000-000000000013','','n.s.',0),
  ('ba932323-0000-4000-8000-000000000042','ba932323-0000-4000-8000-000000000031','ba932323-0000-4000-8000-000000000014','','n.s.',1);

select throws_ok(
  $$update public.usage_reports set status='pending' where id='ba932323-0000-4000-8000-000000000003'$$,
  '23514',null,'text-only submission rejected'
);
set local session_replication_role=replica;
update public.usage_reports
set status='pending'
where id='ba932323-0000-4000-8000-000000000003';
set local session_replication_role=origin;
select lives_ok(
  $$update public.usage_reports set status='published',published_at=now() where id='ba932323-0000-4000-8000-000000000003'$$,
  'legacy pending report can be published without new graph rules'
);
select lives_ok(
  $$update public.usage_reports set status='declined',published_at=null where id='ba932323-0000-4000-8000-000000000003'$$,
  'administrative status change remains available for a legacy report'
);
select throws_ok(
  $$update public.usage_reports set status='pending' where id='ba932323-0000-4000-8000-000000000004'$$,
  '23514',null,'numeric graph requires a numeric value'
);

update public.usage_report_graph_rows
set value_text='1,250±0.8 a'
where id='ba932323-0000-4000-8000-000000000041';
delete from public.usage_report_graph_rows
where id='ba932323-0000-4000-8000-000000000042';
select throws_ok(
  $$update public.usage_reports set status='pending' where id='ba932323-0000-4000-8000-000000000004'$$,
  '23514',null,'every shared plot requires one graph row'
);

insert into public.usage_report_graph_rows(id,graph_id,plot_id,label,value_text,sort_order)
values
  ('ba932323-0000-4000-8000-000000000042','ba932323-0000-4000-8000-000000000031','ba932323-0000-4000-8000-000000000014','','0',1),
  ('ba932323-0000-4000-8000-000000000043','ba932323-0000-4000-8000-000000000031',null,'旧区分','5',2);
select throws_ok(
  $$update public.usage_reports set status='pending' where id='ba932323-0000-4000-8000-000000000004'$$,
  '23514',null,'unshared graph row rejected for a new submission'
);

delete from public.usage_report_graph_rows
where id='ba932323-0000-4000-8000-000000000043';
update public.usage_report_graph_rows
set label='独自の区名'
where id='ba932323-0000-4000-8000-000000000042';
select throws_ok(
  $$update public.usage_reports set status='pending' where id='ba932323-0000-4000-8000-000000000004'$$,
  '23514',null,'shared graph row cannot override the plot name'
);
update public.usage_report_graph_rows
set label=''
where id='ba932323-0000-4000-8000-000000000042';
insert into public.usage_report_graph_rows(id,graph_id,plot_id,label,value_text,sort_order)
values(
  'ba932323-0000-4000-8000-000000000044','ba932323-0000-4000-8000-000000000031',
  'ba932323-0000-4000-8000-000000000013','','1,200',2
);
select throws_ok(
  $$update public.usage_reports set status='pending' where id='ba932323-0000-4000-8000-000000000004'$$,
  '23514',null,'shared plot cannot have duplicate graph rows'
);

delete from public.usage_report_graph_rows
where id='ba932323-0000-4000-8000-000000000044';
select lives_ok(
  $$update public.usage_reports set status='pending' where id='ba932323-0000-4000-8000-000000000004'$$,
  'complete shared graph submits with comma and error notation'
);

select * from finish();
rollback;
