create or replace function public.reserve_company_application_evidence(p_intent_id uuid,p_user_id uuid,p_session_hash text,p_item_key uuid default null,p_purpose text default null,p_file_name text default null,p_mime text default null,p_size integer default null)
returns public.company_application_evidence language plpgsql security definer set search_path='' as $$
declare i public.company_application_intents; e public.company_application_evidence; new_id uuid:=gen_random_uuid();
begin
 i:=app.assert_company_application_actor(p_intent_id,p_user_id,p_session_hash);
 if i.submitted_at is not null then raise exception 'conflict'; end if;
 if not ((p_purpose='package' and p_item_key is not null) or (p_purpose='involvement' and p_item_key is not null and i.kind in ('transfer_out','transfer_in')) or (p_purpose in ('owner_agreement','succession') and p_item_key is null and i.kind='transfer_in')) then raise exception 'invalid_body'; end if;
 if (select count(*) from public.company_application_evidence where intent_id=i.id and item_key is not distinct from p_item_key and purpose=p_purpose)>=5 then raise exception 'invalid_body'; end if;
 insert into public.company_application_evidence(id,intent_id,item_key,purpose,staging_path,file_name,declared_mime,byte_size)
 values(new_id,i.id,p_item_key,p_purpose,'staging/'||i.id||'/'||new_id,p_file_name,p_mime,p_size) returning * into e;
 return e;
end $$;
