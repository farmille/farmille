-- 入力を破棄したintentは操作不可にし、資料は既存の期限切れ掃除に残す。
drop index public.company_application_access_intent;
create unique index company_application_access_intent on public.company_application_intents(access_id)
 where access_id is not null and cleanup_claimed_at is null;
create function public.restart_removal_application(p_intent_id uuid,p_session_hash text)
returns uuid language plpgsql security definer set search_path='' as $$
declare i public.company_application_intents; new_id uuid;
begin
 i:=app.assert_company_application_actor(p_intent_id,null,p_session_hash);
 if i.kind<>'removal' or i.submitted_at is not null then raise exception 'conflict'; end if;
 update public.company_application_intents set cleanup_claimed_at=now(),expires_at=greatest(expires_at,now()+interval '24 hours') where id=i.id;
 insert into public.company_application_intents(kind,access_id) values('removal',i.access_id) returning id into new_id;
 return new_id;
end $$;
revoke all on function public.restart_removal_application(uuid,text) from public,anon,authenticated;
grant execute on function public.restart_removal_application(uuid,text) to service_role;
