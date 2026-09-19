begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

-- 既定権限が広い環境でも、公開用の表に書き込み権限が残らないことを確認する。
select ok(
  not exists (
    select 1
    from unnest(array[
      'material_crop_groups', 'material_application_methods', 'profile_details',
      'affiliation_options', 'profile_affiliations', 'profile_crops', 'profile_links'
    ]) as tables(table_name)
    cross join unnest(array['anon', 'authenticated']) as roles(role_name)
    where has_table_privilege(role_name, 'public.' || table_name, 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
  ),
  '公開属性に匿名・認証済みユーザーの直接書き込み権限がない'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'material_crop_groups', 'material_application_methods', 'profile_details',
      'affiliation_options', 'profile_affiliations', 'profile_crops', 'profile_links'
    ]) as tables(table_name)
    cross join unnest(array['anon', 'authenticated']) as roles(role_name)
    where not has_table_privilege(role_name, 'public.' || table_name, 'SELECT')
  ),
  '公開属性の読み取り権限を維持する'
);
select * from finish();
rollback;
