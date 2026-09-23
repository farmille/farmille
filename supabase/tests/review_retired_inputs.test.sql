begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users(id) values ('bcaa0000-0000-4000-8000-000000000001');
insert into public.profiles(user_id, handle, standpoint)
values ('bcaa0000-0000-4000-8000-000000000001', 'retired-review-inputs', 'other');
insert into public.materials(id, name, manufacturer_name)
values ('bcaa0000-0000-4000-8000-000000000002', '口コミ入力検証', '検証メーカー');
insert into public.reviews(id, material_id, author_user_id, rating, body, pesticide_ack, has_control_plot, purchase_channel, status)
values ('bcaa0000-0000-4000-8000-000000000003', 'bcaa0000-0000-4000-8000-000000000002', 'bcaa0000-0000-4000-8000-000000000001', 4, '旧本文', true, true, 'ja', 'published');
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

select lives_ok($$select public.update_review_with_crops(
  'bcaa0000-0000-4000-8000-000000000003',
  'bcaa0000-0000-4000-8000-000000000002',
  'bcaa0000-0000-4000-8000-000000000001',
  5::smallint, '本文を更新', array[(select id from public.crops order by id limit 1)],
  false, true, 'ec'
)$$, '旧シグネチャで編集できる');
select ok((select has_control_plot and purchase_channel = 'ja' and body = '本文を更新'
  from public.reviews where id = 'bcaa0000-0000-4000-8000-000000000003'),
  '本文を更新しても旧購入場所と対照区の値を保持する');
delete from public.reviews where id = 'bcaa0000-0000-4000-8000-000000000003';
select lives_ok($$select public.create_review_with_crops(
  p_material_id => 'bcaa0000-0000-4000-8000-000000000002',
  p_author_user_id => 'bcaa0000-0000-4000-8000-000000000001',
  p_rating => 4::smallint, p_body => '新本文',
  p_crop_ids => array[(select id from public.crops order by id limit 1)],
  p_pesticide_ack => true
)$$, '退役引数なしで新規投稿できる');
select ok((select has_control_plot is null and purchase_channel is null
  from public.reviews where author_user_id = 'bcaa0000-0000-4000-8000-000000000001'),
  '未収集の項目はNULLを保存する');
delete from public.reviews where author_user_id = 'bcaa0000-0000-4000-8000-000000000001';
select throws_ok($$select public.create_review_with_crops(
  p_material_id => 'bcaa0000-0000-4000-8000-000000000002',
  p_author_user_id => 'bcaa0000-0000-4000-8000-000000000001',
  p_rating => 4::smallint, p_body => '同意なし',
  p_crop_ids => array[(select id from public.crops order by id limit 1)]
)$$, '23514', null, '同意省略では投稿できない');
select public.create_review_with_crops(
  'bcaa0000-0000-4000-8000-000000000002',
  'bcaa0000-0000-4000-8000-000000000001',
  4::smallint, '旧クライアントからの新規投稿',
  array[(select id from public.crops order by id limit 1)], true, true, 'ja'
);
select ok((select has_control_plot is null and purchase_channel is null
  from public.reviews where author_user_id = 'bcaa0000-0000-4000-8000-000000000001'),
  '旧クライアントが送信する退役値も保存しない');
select * from finish();
rollback;
