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

-- 印は適用した順で最新の1件を選ぶ。既存の applied の行は、終わった時刻（無ければ確保した時刻）で埋める。
alter table public.pdf_readings add column applied_at timestamptz;
update public.pdf_readings set applied_at=coalesce(finished_at,created_at) where status='applied';
alter table public.pdf_readings add constraint pdf_readings_applied_at_check
  check ((status='applied')=(applied_at is not null));

-- 適用の時刻は、同じトランザクションで続けて適用しても順が付くよう clock_timestamp で入れる。
-- 写した値で確かめ直してもらうため、適用したら確認を外す。確認していない行まで更新すると、set_updated_at で
-- updated_at が進み、画面が持つ更新日時と食い違って次の保存が競合になるので、確認済みの行だけを更新する。
create or replace function public.apply_pdf_reading(p_reading_id uuid,p_user_id uuid,p_fields jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare item jsonb; target_report uuid;
begin
  if jsonb_typeof(p_fields) is distinct from 'array' or jsonb_array_length(p_fields)>2000 then
    raise exception 'invalid_body' using errcode='22023';
  end if;
  update public.pdf_readings r set status='applied',applied_at=clock_timestamp()
  where r.id=p_reading_id and r.user_id=p_user_id and r.status='succeeded' and r.report_id is not null
  returning r.report_id into target_report;
  if not found then raise exception 'conflict' using errcode='40001'; end if;
  update public.usage_reports u set pdf_values_checked=false where u.id=target_report and u.pdf_values_checked;
  for item in select value from jsonb_array_elements(p_fields) loop
    perform app.check_report_object(item,'{"fieldKey":"string","value":"string","quote":"string"}');
    insert into public.usage_report_pdf_reading_fields(reading_id,field_key,value,quote)
    values(p_reading_id,item->>'fieldKey',item->>'value',item->>'quote');
  end loop;
end $$;
revoke all on function public.apply_pdf_reading(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_pdf_reading(uuid,uuid,jsonb) to service_role;
