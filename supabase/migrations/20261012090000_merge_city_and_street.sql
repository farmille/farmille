alter table public.profile_contact_details
  add column city_street text;

update public.profile_contact_details
set city_street = city || coalesce(street_address, '');

alter table public.profile_contact_details
  alter column city_street set not null;

alter table public.profile_contact_details
  add constraint profile_contact_details_city_street_check
  check (city_street ~ '[^[:space:]　]' and char_length(city_street) between 1 and 300);

drop view public.public_profiles;

alter table public.profile_contact_details
  drop column city,
  drop column street_address;

create view public.public_profiles
with (security_invoker = false, security_barrier = true) as
select p.user_id, p.handle, p.avatar_url, p.created_at, p.standpoint, p.prefecture_code,
  coalesce(d.bio, '') as bio
from public.profiles p
left join public.profile_details d on d.user_id = p.user_id;

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

drop function public.save_profile_details(text, text, boolean, text[], uuid[], text[]);

create function public.save_profile_details(
  p_handle text, p_bio text, p_affiliations text[], p_crop_ids uuid[], p_links text[]
) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not app.can_use_general_features() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(btrim(p_handle)) not between 1 and 30 or char_length(p_bio) > 2000
    or cardinality(p_affiliations) > 20 or cardinality(p_crop_ids) > 50 or cardinality(p_links) > 10
  then raise exception 'invalid profile' using errcode = '22023'; end if;
  update public.profiles set handle = btrim(p_handle) where user_id = uid;
  if not found then raise exception 'profile not found'; end if;
  insert into public.profile_details(user_id, bio) values (uid, p_bio)
    on conflict (user_id) do update set bio = excluded.bio;
  delete from public.profile_affiliations where user_id = uid;
  insert into public.profile_affiliations(user_id, name, sort_order)
    select uid, btrim(value), min(ord)::int from unnest(p_affiliations) with ordinality t(value, ord) group by btrim(value);
  delete from public.profile_crops where user_id = uid;
  insert into public.profile_crops(user_id, crop_id, sort_order)
    select uid, value, min(ord)::int from unnest(p_crop_ids) with ordinality t(value, ord) group by value;
  delete from public.profile_links where user_id = uid;
  insert into public.profile_links(user_id, url, sort_order)
    select uid, btrim(value), min(ord)::int from unnest(p_links) with ordinality t(value, ord) group by btrim(value);
end;
$$;

revoke all on function public.save_profile_details(text, text, text[], uuid[], text[]) from public, anon;
grant execute on function public.save_profile_details(text, text, text[], uuid[], text[]) to authenticated;

alter table public.profile_details drop column city_public;
