-- PDF読み取りの適用の直し。値を下書きに写す保存と、適用の記録（apply_pdf_reading）は別のトランザクションなので、
-- その間で落ちると、値は下書きにあるのに読み取りは succeeded のまま残る。提出時の確認は succeeded の読み取りにも求める。
create or replace function app.assert_usage_report_pdf_submission(r public.usage_reports)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  if not r.pdf_values_checked
    and exists(select 1 from public.pdf_readings p where p.report_id=r.id and p.status in ('succeeded','applied'))
  then raise exception 'report_incomplete' using errcode='23514'; end if;
end $$;
revoke all on function app.assert_usage_report_pdf_submission(public.usage_reports) from public,anon,authenticated;

comment on column public.usage_reports.pdf_values_checked is
  'PDF読み取りで入った値を元の PDF と照らし合わせて確かめたことの確認。成功したか適用済みの読み取りがあるレポートは、下書きから提出するときに必須。';
