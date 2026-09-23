-- 確認メールの再発行中も、発行済みセッションの期限と秘密値を認可の根拠にする。
create or replace function app.assert_company_application_actor(p_intent_id uuid,p_user_id uuid,p_session_hash text)
returns public.company_application_intents language plpgsql security definer set search_path='' as $$
declare i public.company_application_intents;
begin
 select * into i from public.company_application_intents where id=p_intent_id for update;
 if not found or i.cleanup_claimed_at is not null then raise exception 'forbidden'; end if;
 if i.seller_id is not null then
  if p_user_id is null then raise exception 'forbidden'; end if;
  perform 1 from public.seller_accounts where id=i.seller_id and auth_user_id=p_user_id and status='approved' for share;
  if not found then raise exception 'forbidden'; end if;
 else
  if p_session_hash is null then raise exception 'forbidden'; end if;
  perform 1 from public.company_application_access where id=i.access_id and session_hash=p_session_hash and session_expires_at>now() for share;
  if not found then raise exception 'forbidden'; end if;
 end if;
 if i.submitted_at is null and i.expires_at<=now() then raise exception 'expired_link'; end if;
 return i;
end $$;
