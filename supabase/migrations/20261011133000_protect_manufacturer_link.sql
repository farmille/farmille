-- 資材の自動紐づけに使うメーカー名は、運営の承認処理でのみ設定する。
drop trigger enforce_seller_account_column_scope on public.seller_accounts;
create trigger enforce_seller_account_column_scope
  before update on public.seller_accounts
  for each row execute function app.enforce_protected_columns(
    '{id,auth_user_id,official_name,manufacturer_name,seller_type,login_id,status,approved_at,invite_code,created_at,profile_text,logo_url,website_url}'
  );
