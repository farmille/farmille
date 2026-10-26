-- 適用で確認を外すのは、下書きのレポートだけにする。値を下書きに写す保存と適用は別のトランザクションなので、
-- その間に提出されると、確認して提出したレポートの確認を外し、updated_at も進めてしまう。
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
  update public.usage_reports u set pdf_values_checked=false
  where u.id=target_report and u.pdf_values_checked and u.status='draft';
  for item in select value from jsonb_array_elements(p_fields) loop
    perform app.check_report_object(item,'{"fieldKey":"string","value":"string","quote":"string"}');
    insert into public.usage_report_pdf_reading_fields(reading_id,field_key,value,quote)
    values(p_reading_id,item->>'fieldKey',item->>'value',item->>'quote');
  end loop;
end $$;
revoke all on function public.apply_pdf_reading(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_pdf_reading(uuid,uuid,jsonb) to service_role;
