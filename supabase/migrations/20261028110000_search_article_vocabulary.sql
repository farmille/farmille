begin;

-- 本文で確認した語と展開した表現の根拠は docs/research/catalog-search-vocabulary.md に記載する。
create temporary table search_article_alias_seed (
  tag_name text not null,
  alias text not null,
  primary key (tag_name, alias)
) on commit drop;

insert into search_article_alias_seed (tag_name, alias) values
  ('養分吸収', '養分吸収量'),
  ('養分吸収', '栄養成分の吸収'),
  ('養分吸収', '養分の吸収効率'),
  ('水分吸収', '水分の吸収効率'),
  ('肥料効率', '栄養成分の利用効率'),
  ('肥料効率', '肥料成分の有効活用'),
  ('高温対策', '高温耐性'),
  ('高温対策', '高温ストレス対策'),
  ('高温対策', '高温障害対策'),
  ('遮光', '強光'),
  ('環境ストレス対策', '環境ストレスの緩和'),
  ('環境ストレス対策', '非生物的ストレス耐性'),
  ('収量向上', '収量増加'),
  ('収量向上', '収量低下'),
  ('収量向上', '収量の低下'),
  ('収量向上', '収量が減少'),
  ('収量向上', '収量が増えた'),
  ('糖度向上', '糖度低下'),
  ('糖度向上', '糖度が低い'),
  ('光合成促進', '光合成能力の維持'),
  ('光合成促進', '光合成が弱い');

-- 辞書の前提が欠けている環境では、一部だけ登録せずに停止する。
do $$
begin
  if exists (
    select 1
    from search_article_alias_seed seed
    left join public.search_tags tag on tag.category = 'concern' and tag.name = seed.tag_name
    where tag.id is null
  ) then
    raise exception '新聞記事の検索語に対応する悩みタグが見つかりません';
  end if;
end;
$$;

insert into public.search_tag_aliases (search_tag_id, name)
select tag.id, seed.alias
from search_article_alias_seed seed
join public.search_tags tag on tag.category = 'concern' and tag.name = seed.tag_name
on conflict do nothing;

commit;
