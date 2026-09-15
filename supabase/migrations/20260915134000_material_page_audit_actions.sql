drop policy material_page_audits_read on public.material_page_audits;
create policy material_page_audits_read on public.material_page_audits for select to authenticated using(
  app.is_admin_writer() or exists(select 1 from public.material_editor_grants g join public.seller_accounts s on s.id=g.seller_id
    where g.material_id=material_page_audits.material_id and g.seller_id=app.seller_id() and g.revoked_at is null and s.status='approved')
);
create function public.record_material_page_audit(p_material_id uuid,p_actor_id uuid,p_outcome text,p_note text)
returns void language plpgsql security definer set search_path='' as $$
declare m public.materials;
begin
  if p_outcome not in ('checked','correction_requested','hidden') or nullif(btrim(p_note),'') is null then
    raise exception '監査結果と記録を入力してください' using errcode='23514';
  end if;
  select * into m from public.materials where id=p_material_id for update;
  if not found then raise exception '資材が見つかりません' using errcode='P0002'; end if;
  if p_outcome='hidden' then
    update public.materials set publication_status='archived',archived_at=now(),content_revision=content_revision+1 where id=m.id;
  end if;
  insert into public.material_page_audits(material_id,version_id,actor_id,outcome,note)
    values(m.id,m.published_page_version_id,p_actor_id,p_outcome,btrim(p_note));
end;
$$;
revoke all on function public.record_material_page_audit(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.record_material_page_audit(uuid,uuid,text,text) to service_role;

-- メーカーが公開を止めた場合も、原稿・投稿・公開履歴は残す。
create function public.hide_owned_material_page(p_material_id uuid,p_note text)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform id from public.materials where id=p_material_id for update;
  if not app.is_seller() or not exists(select 1 from public.material_editor_grants g join public.seller_accounts s on s.id=g.seller_id
    where g.material_id=p_material_id and g.seller_id=app.seller_id() and g.revoked_at is null and s.status='approved') then
    raise exception '書類確認済みの編集権が必要です' using errcode='42501';
  end if;
  perform public.record_material_page_audit(p_material_id,auth.uid(),'hidden',p_note);
end;
$$;
revoke all on function public.hide_owned_material_page(uuid,text) from public,anon;
grant execute on function public.hide_owned_material_page(uuid,text) to authenticated;
