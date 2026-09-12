-- 個人としての利用権限。運営の管理権限（is_admin_writer）は変更しない。
create or replace function app.can_use_general_features()
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.account_type() in ('general', 'admin');
$$;

comment on function app.can_use_general_features() is
  '一般ユーザーと運営が本人として投稿・プロフィール・画像を管理できる。管理操作のAAL2要件とは独立。';

alter policy profiles_insert_self on public.profiles
  with check (user_id = auth.uid() and app.can_use_general_features());

alter policy reviews_insert_own on public.reviews
  with check (app.can_use_general_features() and author_user_id = auth.uid() and status = 'published');

alter policy usage_reports_insert_own on public.usage_reports
  with check (
    app.can_use_general_features()
    and author_user_id = auth.uid()
    and status in ('draft', 'pending')
  );

alter policy farmille_storage_general_insert on storage.objects
  with check (
    bucket_id in ('avatars', 'review-photos', 'report-media')
    and app.can_use_general_features()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter policy farmille_storage_general_update on storage.objects
  using (
    bucket_id in ('avatars', 'review-photos', 'report-media')
    and app.can_use_general_features()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('avatars', 'review-photos', 'report-media')
    and app.can_use_general_features()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter policy farmille_storage_general_delete on storage.objects
  using (
    bucket_id in ('avatars', 'review-photos', 'report-media')
    and app.can_use_general_features()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
