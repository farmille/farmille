-- 凍結と提出が競合したときも、承認状態を確認した同じ取引内で受付を完了する。
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
  perform 1 from public.company_application_access where id=i.access_id and session_hash=p_session_hash and consumed_at is not null and session_expires_at>now() for share;
  if not found then raise exception 'forbidden'; end if;
 end if;
 if i.submitted_at is null and i.expires_at<=now() then raise exception 'expired_link'; end if;
 return i;
end $$;

create or replace function public.submit_company_application(p_intent_id uuid,p_user_id uuid default null,p_session_hash text default null,p_input jsonb default null,p_consents text[] default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 i public.company_application_intents; s public.seller_accounts; a public.company_application_access;
 item jsonb; item_id uuid; mid uuid; dest uuid; idx integer:=0; expected integer; hash text; r text; d jsonb;
begin
 i:=app.assert_company_application_actor(p_intent_id,p_user_id,p_session_hash);
 hash:=encode(extensions.digest(p_input::text,'sha256'),'hex');
 if i.submitted_at is not null then
  if i.content_hash is distinct from hash then raise exception 'conflict'; end if;
  return i.id;
 end if;
 if p_input->>'kind' is distinct from i.kind or jsonb_typeof(p_input->'items') is distinct from 'array' or jsonb_array_length(p_input->'items') not between 1 and 100 then raise exception 'invalid_body'; end if;
 expected:=case i.kind when 'registration' then 12 when 'transfer_out' then 9 when 'transfer_in' then 11 else 9 end;
 if cardinality(p_consents) is distinct from expected or jsonb_typeof(p_input->'consents') is distinct from 'array' or jsonb_array_length(p_input->'consents') is distinct from expected or exists(select 1 from jsonb_array_elements(p_input->'consents') c where c<>'true'::jsonb) then raise exception 'invalid_body'; end if;
 if i.seller_id is not null then
  select * into strict s from public.seller_accounts where id=i.seller_id;
 else
  select * into strict a from public.company_application_access where id=i.access_id;
  if p_input->>'email' is distinct from a.email or p_input->>'companyName' is distinct from a.company_name or p_input->>'contactName' is distinct from a.contact_name then raise exception 'forbidden'; end if;
 end if;
 insert into public.company_applications(id,kind,seller_id,access_id,company_name,corporate_number,account_id,contact_name,department,email,phone,signer_name,application_date)
 values(i.id,i.kind,i.seller_id,i.access_id,p_input->>'companyName',case when i.kind<>'removal' then p_input->>'corporateNumber' end,
 case when i.kind='removal' then p_input->>'accountId' else s.login_id end,p_input->>'contactName',p_input->>'department',p_input->>'email',p_input->>'phone',p_input->>'signerName',(p_input->>'applicationDate')::date);
 if i.kind='transfer_out' then
  d:=p_input->'destination';
  select id into dest from public.seller_accounts where login_id=d->>'accountId' and status='approved' for share;
  if dest is null or dest=i.seller_id then raise exception 'invalid_body'; end if;
  insert into public.company_application_transfer_out(application_id,destination_seller_id,company_name,corporate_number,account_id,contact_name,department,email,phone)
  values(i.id,dest,d->>'companyName',d->>'corporateNumber',d->>'accountId',d->>'contactName',d->>'department',d->>'email',d->>'phone');
 elsif i.kind='transfer_in' then
  insert into public.company_application_transfer_in(application_id,background) values(i.id,p_input->>'background');
 elsif i.kind='removal' then
  insert into public.company_application_removals(application_id,company_url) values(i.id,p_input->>'companyUrl');
 end if;
 for item in select value from jsonb_array_elements(p_input->'items') loop
  item_id:=(item->>'id')::uuid;
  mid:=nullif(item->>'materialId','')::uuid;
  if (i.kind<>'registration' or item->>'target'='existing') and mid is null then raise exception 'invalid_body'; end if;
  if i.kind='registration' and item->>'target'='new' and mid is not null then raise exception 'invalid_body'; end if;
  if i.kind='transfer_out' then
   perform 1 from public.material_editor_grants where material_id=mid and seller_id=i.seller_id and revoked_at is null for share;
   if not found then raise exception 'forbidden'; end if;
  end if;
  insert into public.company_application_items(id,application_id,position,material_id,material_name,material_url)
  values(item_id,i.id,idx,mid,item->>'materialName',item->>'materialUrl');
  if i.kind in ('registration','removal') then
   if jsonb_typeof(item->'relations') is distinct from 'array' or jsonb_array_length(item->'relations') not between 1 and 3 then raise exception 'invalid_body'; end if;
   for r in select jsonb_array_elements_text(item->'relations') loop
    insert into public.company_application_relations(item_id,relation) values(item_id,r);
   end loop;
  end if;
  if i.kind='registration' then
   insert into public.company_application_registration_items values(item_id,item->>'target',item->>'officialUrl');
  elsif i.kind='transfer_in' then
   insert into public.company_application_transfer_in_items values(item_id,item->>'ownerName',item->>'ownerInformation');
  elsif i.kind='removal' then
   insert into public.company_application_removal_items values(item_id,item->>'requestType',item->>'reason',(item->>'discloseReason')::boolean);
  end if;
  if coalesce(item->>'evidenceUrl','')<>'' then insert into public.company_application_evidence_links values(item_id,item->>'evidenceUrl'); end if;
  if coalesce(item->>'evidenceUrl','')='' and not exists(select 1 from public.company_application_evidence where intent_id=i.id and item_key=item_id and verified_at is not null and (purpose='package' or (purpose='involvement' and i.kind in ('transfer_in','transfer_out')))) then raise exception 'invalid_body'; end if;
  idx:=idx+1;
 end loop;
 if exists(select 1 from public.company_application_evidence e where intent_id=i.id and (verified_at is null or (item_key is not null and not exists(select 1 from public.company_application_items it where it.id=e.item_key and it.application_id=i.id)) or (item_key is null and i.kind<>'transfer_in'))) then raise exception 'invalid_body'; end if;
 insert into public.company_application_consents(application_id,position,version,text_snapshot)
 select i.id,n,'2026-09-23',p_consents[n] from generate_subscripts(p_consents,1) n;
 insert into public.company_application_mail_deliveries(application_id,recipient) values(i.id,case when i.kind='removal' then a.email else s.contact_email end);
 update public.company_application_intents set submitted_at=now(),content_hash=hash where id=i.id;
 return i.id;
end $$;
