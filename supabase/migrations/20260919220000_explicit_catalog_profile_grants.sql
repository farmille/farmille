-- 環境ごとの既定権限に依存せず、公開属性の直接操作を読み取りに限定する。
-- 更新は本人確認を行う RPC またはサーバーの service_role に集約する。
revoke all on table
  public.material_crop_groups,
  public.material_application_methods,
  public.profile_details,
  public.affiliation_options,
  public.profile_affiliations,
  public.profile_crops,
  public.profile_links
from anon, authenticated;

grant select on table
  public.material_crop_groups,
  public.material_application_methods,
  public.profile_details,
  public.affiliation_options,
  public.profile_affiliations,
  public.profile_crops,
  public.profile_links
to anon, authenticated;
