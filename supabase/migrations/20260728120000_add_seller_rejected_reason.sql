-- =============================================================================
-- T-45: 出品者申請の却下理由
-- =============================================================================

alter table public.seller_accounts
  add column rejected_reason text;

comment on column public.seller_accounts.rejected_reason is
  '出品者申請の却下理由。運営管理だけで扱い、公開ビューには含めない。';
