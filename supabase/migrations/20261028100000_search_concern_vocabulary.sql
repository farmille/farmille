begin;

create table public.search_tag_aliases (
  search_tag_id uuid not null references public.search_tags(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  primary key (search_tag_id, name)
);

create table public.search_tag_effects (
  search_tag_id uuid not null references public.search_tags(id) on delete cascade,
  effect_id uuid not null references public.effects(id) on delete restrict,
  primary key (search_tag_id, effect_id)
);
create index search_tag_effects_effect_id_idx on public.search_tag_effects(effect_id);

comment on table public.search_tag_aliases is '検索タグの同義語・表記ゆれ。';
comment on table public.search_tag_effects is '悩みタグから検索できる効果分類。資材への効果の登録とは区別する。';

alter table public.search_tag_aliases enable row level security;
alter table public.search_tag_effects enable row level security;
revoke all on public.search_tag_aliases, public.search_tag_effects from public, anon, authenticated;
grant select on public.search_tag_aliases, public.search_tag_effects to anon, authenticated;
grant all on public.search_tag_aliases, public.search_tag_effects to service_role;
create policy search_tag_aliases_read on public.search_tag_aliases for select using (true);
create policy search_tag_effects_read on public.search_tag_effects for select using (true);

create temporary table search_concern_seed (
  name text primary key,
  effects text[] not null,
  aliases text[] not null,
  sort_order integer not null
) on commit drop;

insert into search_concern_seed (name, effects, aliases, sort_order) values
  ('養分吸収', array['養分吸収の改善']::text[], array['肥料の吸収','養分の吸収','栄養吸収','肥料吸収の改善']::text[], 100),
  ('水分吸収', array['水分吸収の改善']::text[], array['水の吸収','吸水','吸水力','水分の吸収']::text[], 101),
  ('根の酸欠', array['酸素の供給効率の改善']::text[], array['酸素不足','根の酸素不足','酸素供給']::text[], 102),
  ('CO2供給', array['CO2の供給効率の改善']::text[], array['二酸化炭素の供給','炭酸ガスの供給','CO2の供給']::text[], 103),
  ('肥料効率', array['養分の利用効率の改善']::text[], array['施肥効率','肥料の利用効率','養分利用効率','栄養利用効率']::text[], 104),
  ('高温対策', array['耐暑性改善']::text[], array['暑さ','暑さ対策','暑さに強く','高温障害','高温ストレス','猛暑対策','耐暑性']::text[], 105),
  ('低温対策', array['耐寒性改善']::text[], array['寒さ','寒さ対策','低温障害','低温ストレス','耐寒性']::text[], 106),
  ('水不足', array['耐乾燥性改善']::text[], array['水分不足','水不足対策','乾燥対策','乾燥ストレス','干ばつ','干ばつ対策','旱魃','耐乾燥性']::text[], 107),
  ('湿害対策', array['湿害からの回復改善']::text[], array['過湿','過湿対策','湿害からの回復','水が多すぎる']::text[], 108),
  ('日照不足', array['低照度下での生育改善']::text[], array['日照不足対策','光不足','光量不足','低日照','低照度']::text[], 109),
  ('塩害対策', array['塩害耐性改善']::text[], array['塩ストレス','塩類集積','塩分ストレス','耐塩性']::text[], 110),
  ('遮光', array['遮光効果']::text[], array['強い日差し','強日射','日射を抑える']::text[], 111),
  ('霜対策', array['耐霜性改善']::text[], array['霜害','霜害対策','耐霜性']::text[], 112),
  ('環境ストレス対策', array['環境ストレス耐性を高める']::text[], array['非生物的ストレス','環境ストレス','ストレス耐性']::text[], 113),
  ('収量向上', array['収量改善']::text[], array['増収','収量を増やす','収量アップ']::text[], 114),
  ('秀品率向上', array['秀品率の改善']::text[], array['秀品率を上げる','等級向上','上位等級']::text[], 115),
  ('有用成分の向上', array['有用成分（栄養成分・機能性成分）の改善']::text[], array['栄養成分の向上','機能性成分','有用成分','栄養価の向上']::text[], 116),
  ('糖度向上', array['糖度増加']::text[], array['甘み','甘くする','糖度を上げる','糖度アップ']::text[], 117),
  ('光合成促進', array['光合成改善']::text[], array['光合成効率','光合成の改善']::text[], 118),
  ('細胞壁の強化', array['細胞壁の強化']::text[], array['細胞壁を強くする','細胞壁強化']::text[], 119),
  ('草勢維持', array['樹勢改善']::text[], array['樹勢回復','草勢回復','樹勢維持','草勢改善','樹勢が弱い','草勢が弱い']::text[], 120),
  ('成り疲れ対策', array['成り疲れ改善']::text[], array['なり疲れ','なり疲れ対策','成り疲れ','成り疲れ回復']::text[], 121),
  ('傷からの回復', array['外部損傷の修復']::text[], array['傷の修復','損傷の修復','外部損傷','傷ついた']::text[], 122),
  ('しおれ対策', array['しおれ軽減']::text[], array['萎れ','萎れ対策','しおれる','萎凋']::text[], 123),
  ('土壌微生物の活性化', array['根圏の有用微生物の活性化']::text[], array['有用微生物','根圏微生物','微生物の活性化']::text[], 124),
  ('気候変動対策', array['耐暑性改善','耐寒性改善','耐乾燥性改善','湿害からの回復改善','低照度下での生育改善','塩害耐性改善','遮光効果','耐霜性改善','環境ストレス耐性を高める']::text[], array['気候変動','気象変動','気象変動対策','異常気象','異常気象対策']::text[], 125),
  ('夏の暑さ対策', array['耐暑性改善']::text[], array[]::text[], 126);

-- 分類名の表記ゆれは正規化し、対応先の欠落・重複は適用前に検出する。
do $$
begin
  if exists (
    select requested.name
    from (select distinct unnest(effects) as name from search_concern_seed) requested
    left join public.effects e on normalize(e.name, NFKC) = normalize(requested.name, NFKC)
    group by requested.name having count(e.id) <> 1
  ) then
    raise exception '検索語に対応する効果分類が一意に見つかりません';
  end if;
end;
$$;

insert into public.search_tags (name, category, sort_order)
select name, 'concern', sort_order from search_concern_seed
on conflict (category, name) do nothing;

insert into public.search_tag_aliases (search_tag_id, name)
select tag.id, alias.name
from search_concern_seed seed
join public.search_tags tag on tag.category = 'concern' and tag.name = seed.name
cross join lateral unnest(seed.aliases) alias(name)
on conflict do nothing;

insert into public.search_tag_effects (search_tag_id, effect_id)
select tag.id, effect.id
from search_concern_seed seed
join public.search_tags tag on tag.category = 'concern' and tag.name = seed.name
cross join lateral unnest(seed.effects) requested(name)
join public.effects effect on normalize(effect.name, NFKC) = normalize(requested.name, NFKC)
on conflict do nothing;

commit;
