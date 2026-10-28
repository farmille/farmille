-- 応答が届かず再送されたときは、同じ適用記録を成功として返す。
create or replace function public.apply_pdf_reading(p_reading_id uuid,p_user_id uuid,p_fields jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare item jsonb; target_report uuid; reading_status text;
begin
  if jsonb_typeof(p_fields) is distinct from 'array' or jsonb_array_length(p_fields)>2000 then
    raise exception 'invalid_body' using errcode='22023';
  end if;
  select r.report_id,r.status into target_report,reading_status
  from public.pdf_readings r
  where r.id=p_reading_id and r.user_id=p_user_id and r.report_id is not null
  for update;
  if not found then raise exception 'conflict' using errcode='40001'; end if;
  if reading_status='applied' then
    -- 配列の順序をそろえて比べ、欄の重複や値・引用の違いも断る。
    if (select coalesce(jsonb_agg(jsonb_build_object('fieldKey',f.field_key,'value',f.value,'quote',f.quote) order by f.field_key),'[]'::jsonb)
        from public.usage_report_pdf_reading_fields f where f.reading_id=p_reading_id)
      = (select coalesce(jsonb_agg(value order by value->>'fieldKey'),'[]'::jsonb) from jsonb_array_elements(p_fields)) then
      return;
    end if;
    raise exception 'conflict' using errcode='40001';
  end if;
  if reading_status<>'succeeded' then raise exception 'conflict' using errcode='40001'; end if;
  update public.pdf_readings set status='applied',applied_at=clock_timestamp() where id=p_reading_id;
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
