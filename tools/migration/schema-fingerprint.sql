set search_path = pg_catalog;
select jsonb_build_object(
  'columns', (
    select jsonb_agg(jsonb_build_object(
      'schema', n.nspname, 'table', c.relname, 'column', a.attname,
      'type', format_type(a.atttypid, a.atttypmod), 'not_null', a.attnotnull,
      'default', pg_get_expr(d.adbin, d.adrelid)
    ) order by n.nspname, c.relname, a.attnum)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
    left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
    where n.nspname in ('public', 'app') and c.relkind in ('r', 'v')
      and a.attnum > 0 and not a.attisdropped
  ),
  'constraints', (
    select jsonb_agg(jsonb_build_object(
      'schema', n.nspname, 'table', c.relname, 'name', con.conname,
      'definition', pg_get_constraintdef(con.oid)
    ) order by n.nspname, c.relname, con.conname)
    from pg_constraint con join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'app')
  ),
  'functions', (
    select jsonb_agg(jsonb_build_object(
      'schema', n.nspname, 'name', p.proname,
      'arguments', pg_get_function_identity_arguments(p.oid),
      'definition', pg_get_functiondef(p.oid)
    ) order by n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'app') and p.prokind = 'f'
  ),
  'policies', (
    select jsonb_agg(to_jsonb(p) order by schemaname, tablename, policyname)
    from pg_policies p where schemaname in ('public', 'app')
  ),
  'row_security', (
    select jsonb_agg(jsonb_build_object('schema', n.nspname, 'table', c.relname,
      'rls', c.relrowsecurity, 'forced', c.relforcerowsecurity)
      order by n.nspname, c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'app') and c.relkind = 'r'
  )
) as schema_fingerprint;
