-- 括弧の中が別名になっている作目を、括弧の前の名前と同義語に分ける。
-- 資材カタログの取り込み（tools/catalog/taxonomy.ts の CROP_NAMES_WITH_ALIAS）と同じ対象で、
-- 区別に要る括弧（切花・球根・品種など）と、括弧を外すと既存の作目と同名になるものは対象外。
with targets(full_name, base_name, alias) as (
  values
    ('アマニ（亜麻仁）', 'アマニ', '亜麻仁'),
    ('イグサ（い草）', 'イグサ', 'い草'),
    ('エンバク（オーツ麦）', 'エンバク', 'オーツ麦'),
    ('コンニャク（こんにゃくいも）', 'コンニャク', 'こんにゃくいも'),
    ('サルシファイ（西洋ごぼう）', 'サルシファイ', '西洋ごぼう'),
    ('ターメリック（ウコン）', 'ターメリック', 'ウコン'),
    ('テンサイ（ビート）', 'テンサイ', 'ビート'),
    ('ナタネ（菜種）', 'ナタネ', '菜種'),
    ('なばな（菜の花）', 'なばな', '菜の花'),
    ('ニガウリ（ゴーヤ）', 'ニガウリ', 'ゴーヤ'),
    ('ハツカダイコン（ラディッシュ）', 'ハツカダイコン', 'ラディッシュ'),
    ('ヒヨコマメ（ガルバンゾ）', 'ヒヨコマメ', 'ガルバンゾ'),
    ('フダンソウ（スイスチャード）', 'フダンソウ', 'スイスチャード'),
    ('ベニバナ（紅花）', 'ベニバナ', '紅花'),
    ('ホースラディッシュ（西洋わさび）', 'ホースラディッシュ', '西洋わさび'),
    ('モロコシ（ソルガム）', 'モロコシ', 'ソルガム'),
    ('ライ小麦（トリティケール）', 'ライ小麦', 'トリティケール'),
    ('中玉トマト（ミディトマト）', '中玉トマト', 'ミディトマト'),
    ('白瓜（しろうり）', '白瓜', 'しろうり'),
    ('胡蝶蘭（ファレノプシス）', '胡蝶蘭', 'ファレノプシス')
)
update public.crops
set
  name = targets.base_name,
  aliases = case
    when targets.alias = any(crops.aliases) then crops.aliases
    else array_prepend(targets.alias, crops.aliases)
  end
from targets
where crops.name = targets.full_name
  and not exists (
    select 1 from public.crops other
    where other.id <> crops.id and other.name = targets.base_name
  );
