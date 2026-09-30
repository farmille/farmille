create or replace function app.report_value_is_numeric(p_value text)
returns boolean language sql immutable set search_path='' as $$
  select coalesce(abs(parts[1]::numeric)<=1.7976931348623157e308
    and (parts[2] is null or parts[2]::numeric<=1.7976931348623157e308),false)
  from regexp_match(
    regexp_replace(p_value,'([0-9]),(?=[0-9]{3}(?:[^0-9]|$))','\1','g'),
    '^\s*([+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+))(?:\s*±\s*([0-9]+(?:\.[0-9]*)?|\.[0-9]+))?'
  ) parts
$$;
revoke all on function app.report_value_is_numeric(text) from public,anon,authenticated;

create or replace function app.assert_usage_report_graph_submission(r public.usage_reports)
returns void language plpgsql stable security definer set search_path='' as $$
begin
  if r.form_version<>2 then return; end if;
  if not exists(
      select 1 from public.usage_report_measurements m
      where m.report_id=r.id and m.kind='numeric'
    )
    or exists(
      select 1 from public.usage_report_measurements m
      where m.report_id=r.id and m.kind='numeric'
        and not exists(
          select 1 from public.usage_report_graphs g where g.measurement_id=m.id
        )
    )
    or exists(
      select 1
      from public.usage_report_measurements m
      join public.usage_report_graphs g on g.measurement_id=m.id
      where m.report_id=r.id and m.kind='numeric' and (
        not exists(
          select 1 from public.usage_report_graph_rows v
          where v.graph_id=g.id and app.report_value_is_numeric(v.value_text)
        )
        or exists(
          select 1
          from public.usage_report_graph_rows v
          left join public.usage_report_plots p on p.id=v.plot_id and p.report_id=r.id
          where v.graph_id=g.id and (p.id is null or v.label ~ '\S')
        )
        or exists(
          select 1 from public.usage_report_plots p
          where p.report_id=r.id and (
            select count(*) from public.usage_report_graph_rows v
            where v.graph_id=g.id and v.plot_id=p.id
          )<>1
        )
      )
    )
  then raise exception 'report_incomplete' using errcode='23514'; end if;
end $$;
revoke all on function app.assert_usage_report_graph_submission(public.usage_reports) from public,anon,authenticated;

create or replace function app.validate_structured_usage_report()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and old.form_version=2 and new.form_version<>2 then
    raise exception 'report_version_conflict' using errcode='23514';
  end if;
  if new.form_version=2 and new.status<>'draft' then
    perform app.assert_usage_report_submission(new);
  end if;
  if tg_op='UPDATE' and old.status='draft' and new.form_version=2 and new.status='pending' then
    perform app.assert_usage_report_graph_submission(new);
  end if;
  return new;
end $$;
revoke all on function app.validate_structured_usage_report() from public,anon,authenticated;
