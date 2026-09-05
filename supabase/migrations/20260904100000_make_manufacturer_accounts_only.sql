-- =============================================================================
-- 組織アカウントの責務をメーカーに限定する
--
-- seller_accounts は既存の内部識別子として維持するが、利用できる組織は
-- メーカーだけとする。メーカー以外の既存行を自動変換すると組織の意味を
-- 壊すため、該当行がある環境では明示的に停止する。
-- =============================================================================

do $$
begin
  if exists (
    select 1
    from public.seller_accounts
    where seller_type <> 'maker'
  ) then
    raise exception 'メーカー以外の組織アカウントが存在するため移行できません'
      using errcode = 'P0001',
            hint = '対象アカウントの扱いを決定してから migration を再実行してください。';
  end if;
end;
$$;

drop view public.public_sellers;

alter table public.seller_accounts
  drop column seller_type;

comment on table public.seller_accounts is
  'メーカーアカウント。申請から承認、運用までを status で管理する。承認時に共有ログインを発行して auth_user_id を紐付ける。';

create view public.public_sellers
with (security_invoker = true, security_barrier = true) as
select
  s.id,
  s.official_name,
  s.login_id,
  s.location,
  s.region_scope,
  s.website_url,
  s.logo_url,
  s.profile_text,
  s.approved_at,
  s.created_at,
  s.updated_at
from public.seller_accounts s
where s.status = 'approved';

comment on view public.public_sellers is
  '公開メーカーページ。contact_* と内部カラムを公開せず、approved のメーカーだけを返す。';

revoke all on public.public_sellers from anon, authenticated;
grant select on public.public_sellers to anon, authenticated;
