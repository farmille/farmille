-- 下書きから提出に移るときの検査を足す。公開の操作では確かめないので、提出済みの既存レポートはそのまま公開できる。
-- 後の 20261025130000 が app.validate_structured_usage_report を置き換えるので、呼び出しは足さず、
-- 下書きから提出に移るときだけ呼ばれる app.assert_usage_report_plot_submission に入れる。
-- ・調査項目に差し込んだ画像があれば、関連資料と同じく秘密保持の確認（documents_ack）を求める。
create or replace function app.assert_usage_report_plot_submission(r public.usage_reports)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  if r.form_version<>2 then return; end if;
  if (r.variety_unknown and (
        exists(select 1 from public.usage_report_varieties v where v.report_id=r.id)
        or exists(select 1 from public.usage_report_plots p where p.report_id=r.id and p.variety_id is not null)))
    or (not r.variety_unknown and (
        not exists(select 1 from public.usage_report_varieties v where v.report_id=r.id)
        or exists(select 1 from public.usage_report_varieties v where v.report_id=r.id and v.name !~ '\S')
        or exists(select 1 from public.usage_report_plots p where p.report_id=r.id and p.variety_id is null)))
    or exists(select 1 from public.usage_report_plots p where p.report_id=r.id and p.treatment is null)
    or not exists(select 1 from public.usage_report_plots p where p.report_id=r.id and p.treatment='posted')
    or exists(select 1 from public.usage_report_compared_materials c where c.report_id=r.id and c.name !~ '\S')
    or (not r.documents_ack and exists(select 1 from public.usage_report_media m
        where m.usage_report_id=r.id and m.measurement_id is not null))
  then raise exception 'report_incomplete' using errcode='23514'; end if;
end $$;
revoke all on function app.assert_usage_report_plot_submission(public.usage_reports) from public,anon,authenticated;
