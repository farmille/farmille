begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

-- JST の日付をまたぐ閲覧で、日次ビューが2行・累計ビューが1行になる対象を作る。
insert into public.view_events(target_type, target_id, created_at) values
 ('usage_report', 'c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c51', '2026-09-30 14:30:00+00'),
 ('usage_report', 'c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c51', '2026-09-30 15:30:00+00'),
 ('usage_report', 'c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c51', '2026-10-01 01:00:00+00'),
 ('article', 'c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c52', '2026-10-01 01:00:00+00');

set local role anon;
select ok(
  has_table_privilege('anon', 'public.view_counts_total', 'SELECT')
    and not has_table_privilege('anon', 'public.view_counts_total', 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'),
  '匿名ユーザーは累計ビューを読めるが書き込めない'
);
select is(
  (select count(*)::integer from public.view_events
    where target_id in ('c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c51', 'c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c52')),
  0,
  '匿名ユーザーは閲覧の生ログを読めない'
);
select is(
  (select count(*)::integer from public.view_counts_daily
    where target_type = 'usage_report' and target_id = 'c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c51'),
  2,
  '日次ビューは JST の日付ごとに行を分ける'
);
select results_eq(
  $$select target_type, view_count from public.view_counts_total
    where target_id in ('c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c51', 'c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c52')
    order by target_type$$,
  $$values ('article'::text, 1::bigint), ('usage_report'::text, 3::bigint)$$,
  '累計ビューは対象ごとに1行で閲覧数を返す'
);
select results_eq(
  $$select target_type,target_id,view_count from public.view_counts_total order by target_type,target_id$$,
  $$select target_type,target_id,sum(view_count)::bigint from public.view_counts_daily group by target_type,target_id order by target_type,target_id$$,
  '累計ビューと日次集計は対象の欠落なく一致する'
);
select lives_ok($$insert into public.view_events(target_type,target_id,viewer_user_id) values('review','c4a1d7e2-5b3f-4e8a-9c6d-0f1e2a3b4c53',null)$$,'anonymous card view can be recorded without an account');
reset role;
select * from finish();
rollback;
