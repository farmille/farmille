create or replace function app.guard_company_application_evidence() returns trigger language plpgsql security definer set search_path='' as $$
declare done timestamptz; intent_id uuid;
begin
 intent_id:=case when tg_op='INSERT' then new.intent_id else old.intent_id end;
 select submitted_at into done from public.company_application_intents where id=intent_id for update;
 if done is not null then raise exception 'submitted evidence is immutable'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
drop trigger company_application_evidence_immutable on public.company_application_evidence;
create trigger company_application_evidence_immutable before insert or update or delete on public.company_application_evidence for each row execute function app.guard_company_application_evidence();
create function app.guard_submitted_company_application_intent() returns trigger language plpgsql set search_path='' as $$
begin
 if old.submitted_at is not null then raise exception 'submitted intent is immutable'; end if;
 return new;
end $$;
create trigger company_application_intent_immutable before update on public.company_application_intents for each row execute function app.guard_submitted_company_application_intent();
