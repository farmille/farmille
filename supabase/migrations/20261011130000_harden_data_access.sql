-- 発行済みJWTでも、現在の凍結状態とアカウントの紐づけを確認する。
create or replace function app.is_seller()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select app.account_type() = 'seller' and exists (
    select 1 from public.seller_accounts s
    where s.id = app.seller_id()
      and s.auth_user_id = auth.uid()
      and s.status = 'approved'
  );
$$;
revoke all on function app.is_seller() from public;
grant execute on function app.is_seller() to anon, authenticated, service_role;

-- 公開プロフィールへの反映は、表現確認を終えた版の公開処理に限定する。
drop trigger enforce_seller_account_column_scope on public.seller_accounts;
create trigger enforce_seller_account_column_scope
  before update on public.seller_accounts
  for each row execute function app.enforce_protected_columns(
    '{id,auth_user_id,official_name,seller_type,login_id,status,approved_at,invite_code,created_at,profile_text,logo_url,website_url}'
  );

-- 本文の閲覧権限に編集部の内部メモを含めない。編集局はservice_roleで取得する。
revoke select on public.usage_reports from anon, authenticated;
grant select (
  id, material_id, author_user_id, title, status, crop_id, purpose_tags, purpose_note,
  prefecture_code, field_name, variety, planting_date, cultivation_type, cultivation_tags,
  growth_stage, climate_note, observed_change, negative_note, summary, pesticide_ack,
  is_provided_sample, published_at, created_at, updated_at, form_version, variety_unknown,
  publish_city, cultivation_environment, timing_note, method_details_ack, documents_ack
) on public.usage_reports to anon, authenticated;

-- 資材本体のRLSを資料にも適用し、非公開後は権限のある利用者だけに見せる。
alter policy material_images_select_all on public.material_images
  using (exists (select 1 from public.materials m where m.id = material_id));
alter policy material_evidences_select_all on public.material_evidences
  using (exists (select 1 from public.materials m where m.id = material_id));
alter policy material_sources_select_all on public.material_sources
  using (exists (select 1 from public.materials m where m.id = material_id));
