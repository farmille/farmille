"""正本のJSON書き出しから、単一トランザクションの資材移行SQLを生成する。"""
import argparse
import collections
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import uuid

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--snapshot', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
source = json.loads(args.source.read_text())
live = json.loads(args.snapshot.read_text())
product_map = json.loads(Path(__file__).with_name('product-map.json').read_text())
tags = {row['tag_id']: row for row in source['タグマスター']}
products = {row['product_id']: row for row in source['製品']}
assert len(products) == 380 and len(product_map) == 380
assert live['counts']['versions'] == 0, '編集原稿があるため再確認が必要'
assert all(not row['seller_id'] for row in live['materials']), 'メーカーclaimがあるため再確認が必要'
merged = collections.defaultdict(list)
for product_id, material_id in product_map.items():
    merged[material_id].append(product_id)
assert {frozenset(ids) for ids in merged.values() if len(ids) > 1} == {
    frozenset(['PRD-000085', 'PRD-000377']), frozenset(['PRD-000030', 'PRD-000104'])
}
values = [row for row in source['表示値'] if row['状態'] == '現行レビュー反映値']
assert all(row['field_code'] == 'main_ingredient' or row['tag_id'] in tags for row in values)
values_by_product = collections.defaultdict(list)
for row in values:
    values_by_product[row['product_id']].append(row)


def sql(value):
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


tag_ids = {}
old_groups = {row['name']: row['id'] for row in live['crop_groups']}
for row in tags.values():
    if row['field_code']=='target_crop' and row['階層区分']!='個別作目':
        tag_ids[row['tag_id']] = old_groups.get(row['タグ名'], str(uuid.uuid5(uuid.NAMESPACE_URL, 'https://farmille.com/catalog/20260915/' + row['tag_id'])))
new_names = collections.Counter(row['タグ名'] for row in tags.values() if row['field_code']=='target_crop' and row['階層区分']=='個別作目')
old_crops = {row['name']: row for row in live['crops']}
for row in tags.values():
    if row['field_code']=='target_crop' and row['階層区分']=='個別作目':
        old = old_crops.get(row['タグ名'])
        if old and (new_names[row['タグ名']]==1 or old['group_id']==tag_ids[row['親tag_id']]):
            tag_ids[row['tag_id']] = old['id']
assert len(tag_ids.values()) == len(set(tag_ids.values()))


def uid(key):
    return tag_ids.get(key, str(uuid.uuid5(uuid.NAMESPACE_URL, 'https://farmille.com/catalog/20260915/' + key)))


statements = ['begin;', 'set local lock_timeout=\'5s\';', 'lock table public.materials in share row exclusive mode;',
"do $$ begin if exists(select 1 from public.material_page_versions) or exists(select 1 from public.materials where seller_id is not null) then raise exception '資材が調査後に編集されています'; end if; end $$;"]

def emit(statement):
    statements.append(statement)


def insert(table, fields, rows, suffix=''):
    if not rows:
        return
    for start in range(0, len(rows), 200):
        chunk = rows[start:start + 200]
        emit('insert into public.' + table + '(' + ','.join(fields) + ') values\n' + ',\n'.join('(' + ','.join(sql(value) for value in row) + ')' for row in chunk) + ' ' + suffix + ';')


# 参照時の行バージョンを固定し、調査後の運営更新を上書きしない。
emit('create temporary table import_original_materials(id uuid primary key,updated_at timestamptz);')
for row in live['materials']:
    emit(f"insert into import_original_materials values({sql(row['id'])},{sql(row['updated_at'])});")
emit("do $$ begin if exists(select 1 from import_original_materials o left join public.materials m using(id) where m.id is null or m.updated_at<>o.updated_at) then raise exception '資材が調査後に更新されています'; end if; end $$;")
# 旧分類は投稿の参照を維持して選択肢から外す。
emit("do $$ begin if exists(select 1 from public.reviews) or exists(select 1 from public.usage_reports) then raise exception '投稿データがあるため資材移行の参照確認が必要です'; end if; end $$;")
emit('update public.crops set is_active=false;')
emit('update public.crop_groups set is_active=false;')
group_rows = [row for row in tags.values() if row['field_code'] == 'target_crop' and row['階層区分'] != '個別作目']
for level in ['大分類', '中分類']:
    insert('crop_groups', ['id','name','parent_id','hierarchy_level','sort_order','is_active'], [
        [uid(row['tag_id']), row['タグ名'], uid(row['親tag_id']) if row['親tag_id'] else None, 'major' if level=='大分類' else 'middle', int(float(row['表示順'])), True]
        for row in group_rows if row['階層区分']==level
    ], 'on conflict(id) do update set name=excluded.name,parent_id=excluded.parent_id,hierarchy_level=excluded.hierarchy_level,sort_order=excluded.sort_order,is_active=true')
crop_rows = [row for row in tags.values() if row['field_code'] == 'target_crop' and row['階層区分'] == '個別作目']
assert len(crop_rows) == 851
for row in crop_rows:
    assert row['親tag_id'] in tags
    aliases = re.split('[、;；]', row['同義語']) if row['同義語'] else []
    emit(f"insert into public.crops(id,group_id,name,aliases,sort_order,is_active) values({sql(uid(row['tag_id']))},{sql(uid(row['親tag_id']))},{sql(row['タグ名'])},array[{','.join(sql(a) for a in aliases)}]::text[],{int(float(row['表示順']))},true) on conflict(id) do update set group_id=excluded.group_id,name=excluded.name,aliases=excluded.aliases,sort_order=excluded.sort_order,is_active=true;")
# 効果・ジャンルは既存の正規化マスタを使い、値の表記は正本へそろえる。
effects_by_name = {row['name']: row for row in live['effects']}
genres_by_order = {row['sort_order']: row for row in live['ingredient_categories']}
for row in tags.values():
    if row['field_code']=='expected_effect':
        old_name=row['タグ名'].replace('CO₂','CO2')
        assert old_name in effects_by_name
        emit(f"update public.effects set name={sql(row['タグ名'])},sort_order={int(float(row['表示順']))} where name={sql(old_name)};")
    elif row['field_code']=='material_category':
        old=genres_by_order[int(float(row['表示順']))]
        emit(f"update public.ingredient_categories set name={sql(row['タグ名'])} where name={sql(old['name'])};")
# 本番正本から外れる既存資材は削除せず非表示にする。
emit("update public.materials set publication_status='archived',archived_at=now() where id in(select id from import_original_materials);")
insert('manufacturers',['name'],[[row['情報掲載責任会社']] for row in products.values()], 'on conflict(name) do nothing')
material_rows=[]
for material_id, ids in merged.items():
    entries=[products[product_id] for product_id in ids]
    public=any(row['掲載判定']=='掲載可' for row in entries)
    first=entries[0]
    assert all(row['情報掲載責任会社']==first['情報掲載責任会社'] for row in entries)
    name=first['表示製品名']
    if first['product_id']=='PRD-000139':name+='（りんご向け）'
    if first['product_id']=='PRD-000140':name+='（みかん向け）'
    if first['product_id']=='PRD-000126':name+='（都府県限定品）'
    components=list(dict.fromkeys(row['確定表示値'] for product_id in ids for row in values_by_product[product_id] if row['field_code']=='main_ingredient'))
    assert not any(re.search(r'[%％]|\bpH\b|CFU', value, re.I) for value in components)
    material_rows.append([material_id,name,first['情報掲載責任会社'],'published' if public else 'archived','・'.join(components) or None,None if public else datetime.now(timezone.utc).isoformat()])
insert('materials',['id','name','manufacturer_name','publication_status','main_components','archived_at'],material_rows,
"on conflict(id) do update set name=excluded.name,manufacturer_name=excluded.manufacturer_name,publication_status=excluded.publication_status,main_components=excluded.main_components,description=null,mechanism=null,usage_text=null,archived_at=case when excluded.publication_status='archived' then now() else null end")
# 確定値だけを正規化された関連へ反映する。原文は別テーブルでそのまま保持する。
source_ids=','.join(sql(material_id) for material_id in merged)
for table in ['material_crops','material_crop_groups','material_effects','material_ingredient_categories','material_application_methods','material_search_tags']:
    emit(f'delete from public.{table} where material_id in({source_ids});')
methods={'散布':'spray','灌注':'drench','混和':'mix','浸漬':'soak','粉衣・塗布':'coat','その他':'other'}
for material_id, ids in merged.items():
    seen=set()
    for product_id in ids:
        for row in values_by_product[product_id]:
            field=row['field_code']; tag_id=row['tag_id']
            if field=='main_ingredient':continue
            if (field,tag_id) in seen:continue
            seen.add((field,tag_id));tag=tags[tag_id];order=int(row['表示順'])
            if field=='target_crop':
                table='material_crops' if tag['階層区分']=='個別作目' else 'material_crop_groups'
                column='crop_id' if table=='material_crops' else 'crop_group_id'
                insert(table,['material_id',column,'source_name','sort_order'],[[material_id,uid(tag_id),row['確定表示値'],order]])
            elif field=='expected_effect':
                emit(f"insert into public.material_effects(material_id,effect_id) select {sql(material_id)},id from public.effects where name={sql(tag['タグ名'])};")
            elif field=='material_category':
                emit(f"insert into public.material_ingredient_categories(material_id,ingredient_category_id) select {sql(material_id)},id from public.ingredient_categories where name={sql(tag['タグ名'])};")
            elif field=='application_method':
                insert('material_application_methods',['material_id','method','source_text','sort_order'],[[material_id,methods[tag['タグ名']],row['判断理由・詳細'] or row['確定表示値'],order]])
            else:raise ValueError(field)
insert('catalog_source_products',['source_product_id','material_id','source_name','publication_decision'],[[p,product_map[p],row['表示製品名'],row['掲載判定']] for p,row in products.items()])
sources={row['source_id']:row for row in source['出典']}
insert('catalog_source_evidence',['evidence_id','source_product_id','field_code','source_text','source_url','source_title'],[[row['evidence_id'],row['product_id'],row['field_code'],row['原文'],sources.get(row['source_id'],{}).get('URL'),sources.get(row['source_id'],{}).get('資料名')] for row in source['根拠原文']])
expected=sum(row[3]=='published' for row in material_rows)
assert expected==236,expected
emit(f"do $$ begin if (select count(*) from public.materials where publication_status='published') <> {expected} then raise exception '公開資材数が期待値と一致しません'; end if; if (select count(*) from public.crops where is_active) <> 851 then raise exception '作目数が一致しません'; end if; end $$;")
emit('commit;')
args.output.write_text('\n'.join(statements)+'\n')
print(json.dumps({'public_materials':expected,'source_products':len(products),'crops':len(crop_rows),'groups':len(group_rows),'evidence':len(source['根拠原文']),'source_sha256':hashlib.sha256(args.source.read_bytes()).hexdigest(),'sql_sha256':hashlib.sha256(args.output.read_bytes()).hexdigest()},ensure_ascii=False))
