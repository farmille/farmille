-- 資材ジャンル（JBSA材料8分類）の略称。資材ジャンル名は分類に含まれる材料を読点で並べた長い名前なので、
-- 資材カードと資材詳細の見出しには略称を出し、製品詳細の表と選択肢には資材ジャンル名を出す。
-- 略称は、各ジャンルに紐づく資材の主成分に多く現れる語を残して決めた。
alter table public.ingredient_categories add column short_name text;

update public.ingredient_categories
set short_name = case
  when name = '海藻、海藻抽出物' then '海藻'
  when name = 'アミノ酸、ペプチド、タンパク質加水分解物' then 'アミノ酸'
  when name = '腐植酸、腐植物質、フミン酸、フルボ酸' then 'フルボ酸・腐植酸'
  when name = '微生物' then '微生物'
  when name = '微量ミネラル、ビタミン' then '微量ミネラル'
  when name = 'キチン、キトサン、多糖類' then 'キチン・多糖類'
  when name = '動植物抽出物、微生物抽出物' then '動植物・微生物抽出物'
  when name = 'その他' or name like 'その他（%' then 'その他'
end;

alter table public.ingredient_categories
  alter column short_name set not null,
  add constraint ingredient_categories_short_name_key unique (short_name),
  add constraint ingredient_categories_short_name_length check (char_length(short_name) between 1 and 10);

comment on column public.ingredient_categories.short_name is
  '資材カードと資材詳細の見出しに出す略称。10文字以内。資材ジャンル名は name。';
