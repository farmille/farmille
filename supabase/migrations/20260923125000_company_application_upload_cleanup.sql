-- 未提出・期限切れの資料だけを少量ずつ確保する。提出と同じ行ロックを使う。
create function public.claim_expired_company_application_uploads()
returns setof public.company_application_intents language sql security definer set search_path='' as $$
 update public.company_application_intents i set cleanup_claimed_at=now()
 where i.id in (
  select x.id from public.company_application_intents x
  where x.submitted_at is null and x.expires_at<now()
   and (x.cleanup_claimed_at is null or x.cleanup_claimed_at<now()-interval '5 minutes')
   and exists(select 1 from public.company_application_evidence e where e.intent_id=x.id)
  order by x.expires_at limit 5 for update skip locked
 ) returning i.*;
$$;
revoke all on function public.claim_expired_company_application_uploads() from public,anon,authenticated;
grant execute on function public.claim_expired_company_application_uploads() to service_role;
