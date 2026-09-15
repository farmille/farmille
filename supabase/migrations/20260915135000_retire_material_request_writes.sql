revoke execute on function public.submit_material_create_request(
  text,uuid,text,text,text,text,text,text,text,text,text,uuid[],uuid[],uuid[],uuid[],uuid[],uuid[],text
) from authenticated;
revoke execute on function public.submit_material_update_request(
  uuid,text,uuid,text,text,text,text,text,text,text,text,text,uuid[],uuid[],uuid[],uuid[],uuid[],uuid[],text
) from authenticated;
revoke execute on function public.submit_material_archive_request(uuid,text) from authenticated;
revoke execute on function public.submit_material_evidence_add_request(uuid,text,text,text,text,jsonb) from authenticated;
revoke execute on function public.submit_material_evidence_remove_request(uuid,uuid) from authenticated;
revoke execute on function public.confirm_material_information(uuid) from authenticated;
