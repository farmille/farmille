-- form_version=2 の品種を子テーブルへ「写す」から「移す」に改め、親の variety 列には残さない。
-- 写した後も親の列に同じ値が残ると、読む側によって品種が食い違う。
create or replace function app.copy_usage_report_varieties()
returns void language sql security definer set search_path='' as $$
  with copied as (
    insert into public.usage_report_varieties(id,report_id,name,sort_order)
    select gen_random_uuid(),r.id,r.variety,0 from public.usage_reports r
    where r.form_version=2 and not r.variety_unknown and r.variety ~ '\S'
      and not exists(select 1 from public.usage_report_varieties v where v.report_id=r.id)
    returning id,report_id
  )
  update public.usage_report_plots p set variety_id=c.id from copied c where c.report_id=p.report_id;
  update public.usage_reports set variety=null where form_version=2 and variety is not null;
$$;
revoke all on function app.copy_usage_report_varieties() from public,anon,authenticated;

-- 列を空にするだけなので、更新日時を進めず、提出済みのレポートに提出の検査をかけ直さない。
alter table public.usage_reports disable trigger set_updated_at;
alter table public.usage_reports disable trigger usage_reports_validate_structured;
select app.copy_usage_report_varieties();
alter table public.usage_reports enable trigger usage_reports_validate_structured;
alter table public.usage_reports enable trigger set_updated_at;

alter table public.usage_reports add constraint usage_reports_v2_variety_in_children
  check (form_version<>2 or variety is null);
