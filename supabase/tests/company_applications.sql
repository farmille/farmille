begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select lives_ok($test$
do $$
declare
 access_id uuid:=gen_random_uuid(); intent_id uuid:=gen_random_uuid(); item_id uuid:=gen_random_uuid(); material_id uuid:=gen_random_uuid();
 evidence public.company_application_evidence; payload jsonb; submitted uuid; n integer;
begin
 insert into public.materials(id,name,manufacturer_name) values(material_id,'独立受付検証','独立受付検証法人');
 insert into public.company_application_access(id,company_name,contact_name,email,token_hash,token_expires_at)
 values(access_id,'独立受付検証法人','検証担当','forms-check@example.test',access_id::text,now()+interval '30 minutes');
 insert into public.company_application_intents(id,kind,access_id) values(intent_id,'removal',access_id);
 begin
  perform public.reserve_company_application_evidence(intent_id,null,'session',item_id,'package','test.pdf','application/pdf',20);
  raise exception 'unverified access accepted';
 exception when raise_exception then if sqlerrm <> 'forbidden' then raise; end if; end;
 perform public.confirm_company_application_access(access_id::text,access_id::text);
 begin
  perform public.confirm_company_application_access(access_id::text,access_id::text);
  raise exception 'token replay accepted';
 exception when raise_exception then if sqlerrm <> 'expired_link' then raise; end if; end;
 evidence:=public.reserve_company_application_evidence(intent_id,null,access_id::text,item_id,'package','test.pdf','application/pdf',20);
 perform public.finalize_company_application_evidence(evidence.id,null,access_id::text,'sealed/'||evidence.id,repeat('a',64));
 payload:=jsonb_build_object('kind','removal','companyName','独立受付検証法人','contactName','検証担当','email','forms-check@example.test','accountId','','department','検証部署','phone','0000000000','signerName','検証担当','applicationDate','2026-09-23','companyUrl','https://example.test/company','consents',to_jsonb(array_fill(true,array[9])),'items',jsonb_build_array(jsonb_build_object('id',item_id,'materialId',material_id,'materialName','申請時の資材名','materialUrl','https://www.farmille.com/materials/'||material_id,'relations',jsonb_build_array('manufacturer'),'requestType','hidden','reason','検証用申請理由','discloseReason',false,'evidenceUrl','')));
 submitted:=public.submit_company_application(intent_id,null,access_id::text,payload,array_fill('原稿の同意文面'::text,array[9]));
 if submitted<>intent_id then raise exception 'receipt mismatch'; end if;
 submitted:=public.submit_company_application(intent_id,null,access_id::text,payload,array_fill('原稿の同意文面'::text,array[9]));
 select count(*) into n from public.company_applications where id=intent_id;
 if n<>1 then raise exception 'duplicate receipt'; end if;
 begin
  perform public.submit_company_application(intent_id,null,access_id::text,jsonb_set(payload,'{phone}','"1111111111"'),array_fill('原稿の同意文面'::text,array[9]));
  raise exception 'changed retry accepted';
 exception when raise_exception then if sqlerrm <> 'conflict' then raise; end if; end;
 begin
  update public.company_application_evidence set file_name='changed.pdf' where id=evidence.id;
  raise exception 'submitted evidence modified';
 exception when raise_exception then if sqlerrm <> 'submitted evidence is immutable' then raise; end if; end;
 begin
  delete from public.company_application_evidence where id=evidence.id;
  raise exception 'submitted evidence deleted';
 exception when raise_exception then if sqlerrm <> 'submitted evidence is immutable' then raise; end if; end;
 if (select name from public.materials where id=material_id)<>'独立受付検証' then raise exception 'material mutated'; end if;
 update public.materials set name='後日の資材名' where id=material_id;
 if (select material_name from public.company_application_items where id=item_id)<>'申請時の資材名' then raise exception 'receipt did not preserve material name'; end if;
 if (select recipient from public.company_application_mail_deliveries where application_id=intent_id)<>'forms-check@example.test' then raise exception 'wrong recipient'; end if;
 if (select sent_at from public.company_application_mail_deliveries where application_id=intent_id) is not null then raise exception 'mail pretended sent'; end if;
end $$;
$test$, 'application submission enforces access, idempotency, immutable evidence and receipt snapshots');

select lives_ok($test$
do $$
declare restart_access_id uuid:=gen_random_uuid(); old_intent uuid:=gen_random_uuid(); new_intent uuid;
begin
 insert into public.company_application_access(id,company_name,contact_name,email,token_hash,token_expires_at,consumed_at,session_hash,session_expires_at)
 values(restart_access_id,'再開検証法人','検証担当','restart@example.test',gen_random_uuid()::text,now()+interval '30 minutes',now(),restart_access_id::text,now()+interval '24 hours');
 insert into public.company_application_intents(id,kind,access_id) values(old_intent,'removal',restart_access_id);
 perform public.reserve_company_application_evidence(old_intent,null,restart_access_id::text,gen_random_uuid(),'package','test.pdf','application/pdf',20);
 new_intent:=public.restart_removal_application(old_intent,restart_access_id::text);
 if new_intent=old_intent then raise exception 'restart reused old intent'; end if;
 update public.company_application_access set consumed_at=null,token_hash=gen_random_uuid()::text where id=restart_access_id;
 perform public.reserve_company_application_evidence(new_intent,null,restart_access_id::text,gen_random_uuid(),'package','after-reissue.pdf','application/pdf',20);
 if not exists(select 1 from public.company_application_intents where id=new_intent and access_id=restart_access_id and cleanup_claimed_at is null) then raise exception 'restart lost verified access'; end if;
 begin
  perform public.reserve_company_application_evidence(old_intent,null,restart_access_id::text,gen_random_uuid(),'package','test.pdf','application/pdf',20);
  raise exception 'discarded intent remained usable';
 exception when raise_exception then if sqlerrm<>'forbidden' then raise; end if; end;
 if not exists(select 1 from public.company_application_evidence where intent_id=old_intent) then raise exception 'restart lost cleanup metadata'; end if;
end $$;
$test$, 'restart preserves verified access and cleanup metadata while rejecting discarded intents');

select * from finish();
rollback;
