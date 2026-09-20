alter table public.profile_contact_details
  add column street_address text check (
    street_address is null or (street_address ~ '[^[:space:]　]' and char_length(street_address) <= 200)
  ),
  add column building_name text check (
    building_name is null or (building_name ~ '[^[:space:]　]' and char_length(building_name) <= 200)
  );

insert into public.affiliation_options(name, sort_order) values
  ('JA全青協', 1),
  ('4Hクラブ', 2),
  ('日本農業法人協会', 3),
  ('JA営農指導員', 4),
  ('都道府県 農業普及指導員', 5),
  ('都道府県 農業研究員', 6),
  ('農研機構 研究員', 7),
  ('大学 研究員', 8),
  ('その他', 9)
on conflict(name) do update set sort_order = excluded.sort_order;
