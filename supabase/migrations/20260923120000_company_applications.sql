-- 申請の受付記録は不変とし、審査後の権限・公開状態の変更とは分離する。
create table public.company_application_access (
 id uuid primary key default gen_random_uuid(),
 company_name text not null check(length(company_name) between 1 and 200),
 contact_name text not null check(length(contact_name) between 1 and 200),
 email text not null check(length(email) between 3 and 254),
 token_hash text not null unique,
 token_expires_at timestamptz not null,
 consumed_at timestamptz,
 session_hash text unique,
 session_expires_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.company_application_intents (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('registration','transfer_out','transfer_in','removal')),
 seller_id uuid references public.seller_accounts(id),
 access_id uuid references public.company_application_access(id),
 expires_at timestamptz not null default now()+interval '24 hours',
 submitted_at timestamptz,
 content_hash text,
 cleanup_claimed_at timestamptz,
 check ((kind='removal' and access_id is not null and seller_id is null) or
        (kind<>'removal' and seller_id is not null and access_id is null))
);
create unique index company_application_access_intent on public.company_application_intents(access_id) where access_id is not null;
create table public.company_applications (
 id uuid primary key references public.company_application_intents(id),
 kind text not null check(kind in ('registration','transfer_out','transfer_in','removal')),
 seller_id uuid references public.seller_accounts(id),
 access_id uuid references public.company_application_access(id),
 company_name text not null check(length(company_name) between 1 and 200),
 corporate_number text,
 account_id text not null,
 contact_name text not null check(length(contact_name) between 1 and 200),
 department text not null check(length(department) between 1 and 200),
 email text not null check(length(email) between 3 and 254),
 phone text not null check(length(phone) between 1 and 50),
 signer_name text not null check(length(signer_name) between 1 and 200),
 application_date date not null,
 receipt_number bigint generated always as identity unique,
 submitted_at timestamptz not null default now(),
 unique(id,kind),
 check ((kind='removal' and access_id is not null and seller_id is null and corporate_number is null) or
        (kind<>'removal' and seller_id is not null and access_id is null and corporate_number is not null and corporate_number ~ '^[0-9]{13}$'))
);
create table public.company_application_items (
 id uuid primary key,
 application_id uuid not null references public.company_applications(id),
 position integer not null check(position between 0 and 99),
 material_id uuid references public.materials(id),
 material_name text not null check(length(material_name) between 1 and 300),
 material_url text not null,
 unique(application_id,position)
);
create table public.company_application_relations (
 item_id uuid not null references public.company_application_items(id),
 relation text not null check(relation in ('manufacturer','seller','importer')),
 primary key(item_id,relation)
);
create table public.company_application_registration_items (
 item_id uuid primary key references public.company_application_items(id),
 target text not null check(target in ('new','existing')),
 official_url text not null
);
create table public.company_application_transfer_out (
 application_id uuid primary key,
 kind text not null default 'transfer_out' check(kind='transfer_out'),
 destination_seller_id uuid not null references public.seller_accounts(id),
 company_name text not null check(length(company_name) between 1 and 200),
 corporate_number text not null check(corporate_number ~ '^[0-9]{13}$'),
 account_id text not null,
 contact_name text not null check(length(contact_name) between 1 and 200),
 department text not null check(length(department) between 1 and 200),
 email text not null check(length(email) between 3 and 254),
 phone text not null check(length(phone) between 1 and 50),
 foreign key(application_id,kind) references public.company_applications(id,kind)
);
create table public.company_application_transfer_in (
 application_id uuid primary key,
 kind text not null default 'transfer_in' check(kind='transfer_in'),
 background text not null check(length(background) between 1 and 10000),
 foreign key(application_id,kind) references public.company_applications(id,kind)
);
create table public.company_application_transfer_in_items (
 item_id uuid primary key references public.company_application_items(id),
 owner_name text not null check(length(owner_name) between 1 and 200),
 owner_information text not null check(length(owner_information)<=10000)
);
create table public.company_application_removals (
 application_id uuid primary key,
 kind text not null default 'removal' check(kind='removal'),
 company_url text not null check(company_url ~ '^https?://'),
 foreign key(application_id,kind) references public.company_applications(id,kind)
);
create table public.company_application_removal_items (
 item_id uuid primary key references public.company_application_items(id),
 request_type text not null check(request_type in ('discontinued','hidden')),
 reason text not null check(length(reason) between 1 and 10000),
 disclose_reason boolean not null
);
create table public.company_application_consents (
 application_id uuid not null references public.company_applications(id),
 position integer not null,
 version text not null,
 text_snapshot text not null,
 accepted_at timestamptz not null default now(),
 primary key(application_id,position)
);
create table public.company_application_evidence (
 id uuid primary key default gen_random_uuid(),
 intent_id uuid not null references public.company_application_intents(id),
 item_key uuid,
 purpose text not null check(purpose in ('package','involvement','owner_agreement','succession')),
 staging_path text not null unique,
 sealed_path text unique,
 file_name text not null check(length(file_name) between 1 and 200),
 declared_mime text not null check(declared_mime in ('image/jpeg','image/png','application/pdf')),
 byte_size integer not null check(byte_size between 1 and 10485760),
 sha256 text,
 verified_at timestamptz,
 created_at timestamptz not null default now(),
 check((verified_at is null and sealed_path is null and sha256 is null) or
       (verified_at is not null and sealed_path is not null and sha256 is not null)),
 check((purpose in ('package','involvement') and item_key is not null) or
       (purpose in ('owner_agreement','succession') and item_key is null))
);
create table public.company_application_evidence_links (
 item_id uuid not null references public.company_application_items(id),
 url text not null check(url ~ '^https?://'),
 primary key(item_id,url)
);
create table public.company_application_mail_deliveries (
 application_id uuid primary key references public.company_applications(id),
 recipient text not null,
 attempts integer not null default 0,
 claimed_at timestamptz,
 sent_at timestamptz,
 last_error_code text
);

-- 個人情報の読取はサーバーで認可してから行う。公開APIにテーブル権限を渡さない。
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename like 'company_application%' loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated, service_role',t);
  execute format('grant select on public.%I to service_role',t);
 end loop;
end $$;
grant insert,update on public.company_application_access, public.company_application_intents,public.company_application_evidence,public.company_application_mail_deliveries to service_role;
grant delete on public.company_application_evidence to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('company-application-evidence','company-application-evidence',false,10485760,array['image/jpeg','image/png','application/pdf']);

-- サーバーが検証したactorを、提出・添付操作のトランザクション内でも再確認する。
create function app.assert_company_application_actor(p_intent_id uuid,p_user_id uuid,p_session_hash text)
returns public.company_application_intents language plpgsql security definer set search_path='' as $$
declare i public.company_application_intents;
begin
 select * into i from public.company_application_intents where id=p_intent_id for update;
 if not found or i.cleanup_claimed_at is not null then raise exception 'forbidden'; end if;
 if i.seller_id is not null then
  if p_user_id is null or not exists(select 1 from public.seller_accounts where id=i.seller_id and auth_user_id=p_user_id and status='approved') then raise exception 'forbidden'; end if;
 else
  if p_session_hash is null or not exists(select 1 from public.company_application_access where id=i.access_id and session_hash=p_session_hash and consumed_at is not null and session_expires_at>now()) then raise exception 'forbidden'; end if;
 end if;
 if i.submitted_at is null and i.expires_at<=now() then raise exception 'expired_link'; end if;
 return i;
end $$;
revoke all on function app.assert_company_application_actor(uuid,uuid,text) from public,anon,authenticated,service_role;

create function public.reserve_company_application_evidence(p_intent_id uuid,p_user_id uuid,p_session_hash text,p_item_key uuid,p_purpose text,p_file_name text,p_mime text,p_size integer)
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
revoke all on function public.reserve_company_application_evidence(uuid,uuid,text,uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.reserve_company_application_evidence(uuid,uuid,text,uuid,text,text,text,integer) to service_role;

-- JSONはRPCの輸送だけに使い、各回答を専用の列と関連行へ分解する。
create function public.submit_company_application(p_intent_id uuid,p_user_id uuid,p_session_hash text,p_input jsonb,p_consents text[])
returns uuid language plpgsql security definer set search_path='' as $$
declare
 i public.company_application_intents; s public.seller_accounts; a public.company_application_access;
 item jsonb; item_id uuid; mid uuid; dest uuid; idx integer:=0; expected integer; hash text; r text; d jsonb;
begin
 i:=app.assert_company_application_actor(p_intent_id,p_user_id,p_session_hash);
 hash:=encode(extensions.digest(p_input::text,'sha256'),'hex');
 if i.submitted_at is not null then
  if i.content_hash<>hash then raise exception 'conflict'; end if;
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
  select id into dest from public.seller_accounts where login_id=d->>'accountId' and status='approved';
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
  if i.kind='transfer_out' and not exists(select 1 from public.material_editor_grants where material_id=mid and seller_id=i.seller_id and revoked_at is null) then raise exception 'forbidden'; end if;
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
revoke all on function public.submit_company_application(uuid,uuid,text,jsonb,text[]) from public,anon,authenticated;
grant execute on function public.submit_company_application(uuid,uuid,text,jsonb,text[]) to service_role;

create function public.finalize_company_application_evidence(p_id uuid,p_user_id uuid,p_session_hash text,p_sealed_path text,p_sha256 text)
returns void language plpgsql security definer set search_path='' as $$
declare e public.company_application_evidence; i public.company_application_intents;
begin
 select * into strict e from public.company_application_evidence where id=p_id;
 i:=app.assert_company_application_actor(e.intent_id,p_user_id,p_session_hash);
 if i.submitted_at is not null then raise exception 'conflict'; end if;
 update public.company_application_evidence set sealed_path=p_sealed_path,sha256=p_sha256,verified_at=now() where id=p_id and verified_at is null;
 if not found then raise exception 'conflict'; end if;
end $$;
revoke all on function public.finalize_company_application_evidence(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.finalize_company_application_evidence(uuid,uuid,text,text,text) to service_role;

create function public.remove_company_application_evidence(p_id uuid,p_user_id uuid,p_session_hash text)
returns public.company_application_evidence language plpgsql security definer set search_path='' as $$
declare e public.company_application_evidence; i public.company_application_intents;
begin
 select * into strict e from public.company_application_evidence where id=p_id;
 i:=app.assert_company_application_actor(e.intent_id,p_user_id,p_session_hash);
 if i.submitted_at is not null then raise exception 'conflict'; end if;
 delete from public.company_application_evidence where id=p_id;
 return e;
end $$;
revoke all on function public.remove_company_application_evidence(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.remove_company_application_evidence(uuid,uuid,text) to service_role;

create function public.confirm_company_application_access(p_token_hash text,p_session_hash text)
returns uuid language plpgsql security definer set search_path='' as $$
declare access_id uuid;
begin
 update public.company_application_access set consumed_at=now(),session_hash=p_session_hash,session_expires_at=now()+interval '24 hours'
 where token_hash=p_token_hash and consumed_at is null and token_expires_at>now() returning id into access_id;
 if access_id is null then raise exception 'expired_link'; end if;
 return access_id;
end $$;
revoke all on function public.confirm_company_application_access(text,text) from public,anon,authenticated;
grant execute on function public.confirm_company_application_access(text,text) to service_role;
