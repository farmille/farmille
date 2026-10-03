-- -----------------------------------------------------------------------------
-- view_counts_total（閲覧数の累計。対象ごとに1行）
-- 生ログ（view_events）は admin のみ。表示用の閲覧数はこのビューから読む。
-- -----------------------------------------------------------------------------

create view public.view_counts_total
with (security_invoker = false, security_barrier = true) as
select
  e.target_type,
  e.target_id,
  count(*)::bigint as view_count
from public.view_events e
group by e.target_type, e.target_id;

comment on view public.view_counts_total is
  '閲覧数の累計。生ログは admin のみ、集計は公開（01 §3）。';

revoke all on public.view_counts_total from anon, authenticated;
grant select on public.view_counts_total to anon, authenticated;
