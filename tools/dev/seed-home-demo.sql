-- ホームと公開画面の表示確認に使う、ローカル専用のデモデータ。
--
-- !!! ローカルの Supabase 以外では実行しない !!!
--
-- 先に tools/migration/materials-v2-seed.sql を実行する。
-- 固定 UUID で upsert するため、再実行しても件数は増えない。
-- 投稿者名、メールアドレス、投稿内容はすべて架空である。

begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  demo_user.id,
  'authenticated',
  'authenticated',
  demo_user.email,
  crypt('local-display-only', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"account_type":"general"}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    ('22000000-0000-4000-8000-000000000001'::uuid, 'viewer01@example.test'),
    ('22000000-0000-4000-8000-000000000002'::uuid, 'viewer02@example.test'),
    ('22000000-0000-4000-8000-000000000003'::uuid, 'viewer03@example.test'),
    ('22000000-0000-4000-8000-000000000004'::uuid, 'viewer04@example.test'),
    ('22000000-0000-4000-8000-000000000005'::uuid, 'viewer05@example.test'),
    ('22000000-0000-4000-8000-000000000006'::uuid, 'viewer06@example.test'),
    ('22000000-0000-4000-8000-000000000007'::uuid, 'viewer07@example.test'),
    ('22000000-0000-4000-8000-000000000008'::uuid, 'viewer08@example.test')
) as demo_user(id, email)
on conflict (id) do nothing;

insert into public.profiles (user_id, handle, standpoint)
values
  ('22000000-0000-4000-8000-000000000001', 'ひだまり菜園', 'farmer'),
  ('22000000-0000-4000-8000-000000000002', '山の端ファーム', 'farmer'),
  ('22000000-0000-4000-8000-000000000003', 'みのり畑', 'farmer'),
  ('22000000-0000-4000-8000-000000000004', '北風農園', 'farmer'),
  ('22000000-0000-4000-8000-000000000005', 'つちのこ農場', 'farmer'),
  ('22000000-0000-4000-8000-000000000006', 'せせらぎ果樹園', 'farmer'),
  ('22000000-0000-4000-8000-000000000007', '青空ベジラボ', 'expert'),
  ('22000000-0000-4000-8000-000000000008', 'たねまき日和', 'ja')
on conflict (user_id) do update set
  handle = excluded.handle,
  standpoint = excluded.standpoint,
  updated_at = now();

create temporary table _farmille_demo_reviews (
  id uuid primary key,
  material_name text not null,
  manufacturer_name text not null,
  author_user_id uuid not null,
  crop_name text not null,
  rating smallint not null,
  body text not null,
  has_control_plot boolean,
  created_at timestamptz not null
) on commit drop;

insert into pg_temp._farmille_demo_reviews values
  ('71000000-0000-4000-8000-000000000001', 'Actibio X EVO53', 'ICL JAPAN', '22000000-0000-4000-8000-000000000001', 'ミニトマト', 5, '晴天が続いた週に3回使いました。午後の葉のしおれが少なく、翌朝の戻りも早いように感じました。', true, '2026-09-07T09:10:00+09:00'),
  ('71000000-0000-4000-8000-000000000002', 'BIOZ Diamond', 'ICL JAPAN', '22000000-0000-4000-8000-000000000002', 'いちご', 5, '定植直後から使い、無処理区と比べて新葉の展開を観察しました。株ごとの差はありますが、初期の揃いは良好でした。', true, '2026-09-07T08:35:00+09:00'),
  ('71000000-0000-4000-8000-000000000003', '鉄力あくあF10', '愛知製鋼', '22000000-0000-4000-8000-000000000005', 'いちご', 4, '葉色が薄くなった区画で灌水に混ぜました。2週間ほどで若い葉の色が整い、管理の目安を立てやすくなりました。', false, '2026-09-06T17:20:00+09:00'),
  ('71000000-0000-4000-8000-000000000004', 'BIOZ Moonstone', 'ICL JAPAN', '22000000-0000-4000-8000-000000000004', 'なす', 5, '盛夏期の草勢維持を狙って葉面散布しました。散布区では上位葉が立った状態を保つ株が多く見られました。', true, '2026-09-06T13:05:00+09:00'),
  ('71000000-0000-4000-8000-000000000005', 'Actibio X EVO53', 'ICL JAPAN', '22000000-0000-4000-8000-000000000002', 'きゅうり', 4, '着果が続く時期に7日間隔で使用しました。大きな差ではないものの、先端の動きが安定した印象です。', false, '2026-09-05T16:40:00+09:00'),
  ('71000000-0000-4000-8000-000000000006', 'Actibio X EVO53', 'ICL JAPAN', '22000000-0000-4000-8000-000000000003', 'レタス', 4, '定植後の乾燥が続いたため試しました。活着のばらつきが抑えられたように見えましたが、次作では区画を広げて確かめたいです。', true, '2026-09-04T10:15:00+09:00'),
  ('71000000-0000-4000-8000-000000000007', 'Actibio X EVO53', 'ICL JAPAN', '22000000-0000-4000-8000-000000000004', 'トマト', 5, '曇天後の急な高温に備えて施用しました。果実肥大を続けながらも、草勢の落ち込みは穏やかでした。', true, '2026-09-03T15:30:00+09:00'),
  ('71000000-0000-4000-8000-000000000008', 'BIOZ Diamond', 'ICL JAPAN', '22000000-0000-4000-8000-000000000003', 'レタス', 4, '土づくりの一環として定植前に施用しました。根鉢の外へ出る細根が多く、活着後の生育も揃っていました。', true, '2026-09-02T11:50:00+09:00'),
  ('71000000-0000-4000-8000-000000000009', 'BIOZ Diamond', 'ICL JAPAN', '22000000-0000-4000-8000-000000000005', 'キャベツ', 4, '圃場の一部で比較しました。処理区は外葉の広がりが揃い、追肥前の生育差を見分けやすかったです。', true, '2026-09-01T14:20:00+09:00'),
  ('71000000-0000-4000-8000-000000000010', 'BIOZ Diamond', 'ICL JAPAN', '22000000-0000-4000-8000-000000000006', 'きゅうり', 4, '灌水と同時に入れたので作業負担は増えませんでした。根の量は未計測ですが、日中の葉姿は安定していました。', false, '2026-08-31T09:45:00+09:00'),
  ('71000000-0000-4000-8000-000000000011', 'BIOZ Moonstone', 'ICL JAPAN', '22000000-0000-4000-8000-000000000003', 'きゅうり', 4, '収穫最盛期に2回散布しました。葉の厚みが保たれ、摘葉後の新葉も動き続けたように感じます。', false, '2026-08-30T18:05:00+09:00'),
  ('71000000-0000-4000-8000-000000000012', 'BIOZ Moonstone', 'ICL JAPAN', '22000000-0000-4000-8000-000000000007', 'ミニトマト', 4, '少量区画で試し、葉色と節間を毎週記録しました。対照区との差は小さく、再現確認が必要だと感じました。', true, '2026-08-29T12:10:00+09:00'),
  ('71000000-0000-4000-8000-000000000013', 'BIOZ Nephrite', 'ICL JAPAN', '22000000-0000-4000-8000-000000000004', '大豆', 4, '開花期の前から使い、根粒の色と数を対照区と比べました。処理区では赤みのある根粒がやや多く見られました。', true, '2026-08-28T16:25:00+09:00'),
  ('71000000-0000-4000-8000-000000000014', 'BIOZ Nephrite', 'ICL JAPAN', '22000000-0000-4000-8000-000000000005', '小麦', 4, '葉面散布後に上位葉の色を定点で記録しました。穂ぞろい期まで葉色を保つ株が多い印象でした。', false, '2026-08-27T08:40:00+09:00'),
  ('71000000-0000-4000-8000-000000000015', 'BIOZ Nephrite', 'ICL JAPAN', '22000000-0000-4000-8000-000000000008', '大豆', 3, '1回だけ試して根粒を確認しました。悪い反応はありませんでしたが、使用回数が少なく違いは判断できませんでした。', false, '2026-08-26T13:30:00+09:00'),
  ('71000000-0000-4000-8000-000000000016', '鉄力あくあF10', '愛知製鋼', '22000000-0000-4000-8000-000000000006', 'きゅうり', 4, '葉色の薄い株を中心に灌水しました。1回では差が小さく、2回目の後から新葉の色が安定しました。', false, '2026-08-25T10:05:00+09:00'),
  ('71000000-0000-4000-8000-000000000017', '鉄力あくあF10', '愛知製鋼', '22000000-0000-4000-8000-000000000001', 'トマト', 4, '養液栽培で濃度を確認しながら使用しました。葉色の変化を追いやすく、少量から調整できました。', true, '2026-08-24T17:55:00+09:00'),
  ('71000000-0000-4000-8000-000000000018', '鉄力あぐりB10', '愛知製鋼', '22000000-0000-4000-8000-000000000006', 'ぶどう', 5, '新梢の伸びが鈍った樹に株元施用しました。新葉の色が戻り、枝ごとのばらつきも小さくなりました。', true, '2026-08-23T09:20:00+09:00'),
  ('71000000-0000-4000-8000-000000000019', '鉄力あぐりB10', '愛知製鋼', '22000000-0000-4000-8000-000000000007', 'りんご', 4, '春先に樹勢の弱い列へ施用しました。対照列より葉色の立ち上がりが早く見えましたが、収量は未比較です。', true, '2026-08-22T14:35:00+09:00'),
  ('71000000-0000-4000-8000-000000000020', '鉄力あぐりB10', '愛知製鋼', '22000000-0000-4000-8000-000000000002', 'みかん', 4, '着果の多い樹を選び、元肥と一緒に施用しました。夏の葉色は維持でき、樹の様子も確認しやすかったです。', false, '2026-08-21T11:25:00+09:00'),
  ('71000000-0000-4000-8000-000000000021', 'Actijump', 'ICL JAPAN', '22000000-0000-4000-8000-000000000007', '大豆', 5, '播種当日に種子処理し、根粒数を無処理区と比べました。掘り取り調査では処理区の根粒が多く確認できました。', true, '2026-08-20T16:10:00+09:00'),
  ('71000000-0000-4000-8000-000000000022', 'Actijump', 'ICL JAPAN', '22000000-0000-4000-8000-000000000008', '大豆', 4, '粉衣作業は手順どおり進めれば難しくありませんでした。発芽は揃い、初期の根張りも良好でした。', false, '2026-08-19T08:50:00+09:00'),
  ('71000000-0000-4000-8000-000000000023', 'ハイタック-C', 'アグロ カネショウ', '22000000-0000-4000-8000-000000000008', 'ミニトマト', 4, '尻腐れが出やすいハウスで、カルシウム補給の一つとして葉面散布しました。若い果実の状態を追いやすかったです。', false, '2026-08-18T15:40:00+09:00'),
  ('71000000-0000-4000-8000-000000000024', 'ハイタック-C', 'アグロ カネショウ', '22000000-0000-4000-8000-000000000001', 'きゅうり', 3, '新葉の縁を観察しながら小区画で使いました。作業性は良好でしたが、今回は生育差まで判断できませんでした。', false, '2026-08-17T12:30:00+09:00');

insert into public.reviews (
  id,
  material_id,
  author_user_id,
  rating,
  body,
  has_control_plot,
  purchase_channel,
  pesticide_ack,
  is_provided_sample,
  status,
  created_at,
  updated_at
)
select
  demo.id,
  material.id,
  demo.author_user_id,
  demo.rating,
  demo.body,
  demo.has_control_plot,
  'direct',
  true,
  false,
  'published',
  demo.created_at,
  demo.created_at
from pg_temp._farmille_demo_reviews as demo
join public.materials as material
  on material.name = demo.material_name
 and material.manufacturer_name = demo.manufacturer_name
on conflict (id) do update set
  material_id = excluded.material_id,
  author_user_id = excluded.author_user_id,
  rating = excluded.rating,
  body = excluded.body,
  has_control_plot = excluded.has_control_plot,
  purchase_channel = excluded.purchase_channel,
  pesticide_ack = excluded.pesticide_ack,
  is_provided_sample = excluded.is_provided_sample,
  status = excluded.status,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.review_crops (review_id, crop_id, sort_order)
select demo.id, crop.id, 0
from pg_temp._farmille_demo_reviews as demo
join public.crops as crop on crop.name = demo.crop_name
on conflict (review_id) do update set
  crop_id = excluded.crop_id,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.review_photos (id, review_id, url, caption, sort_order)
values
  ('71100000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 'https://placehold.co/720x720/e8f5e9/2e7d32?text=tomato', '午後の株全体', 0),
  ('71100000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000002', 'https://placehold.co/720x720/f1f8f2/1b5e20?text=strawberry', '定植2週間後の株', 0),
  ('71100000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000003', 'https://placehold.co/720x720/fff4e0/b26a00?text=leaf-color', '若い葉の色', 0),
  ('71100000-0000-4000-8000-000000000004', '71000000-0000-4000-8000-000000000004', 'https://placehold.co/720x720/e8f5e9/2e7d32?text=eggplant', '散布区の上位葉', 0)
on conflict (id) do update set
  review_id = excluded.review_id,
  url = excluded.url,
  caption = excluded.caption,
  sort_order = excluded.sort_order,
  updated_at = now();

create temporary table _farmille_demo_usage_reports (
  id uuid primary key,
  material_name text not null,
  manufacturer_name text not null,
  author_user_id uuid not null,
  crop_name text not null,
  title text not null,
  purpose_tags text[] not null,
  prefecture_code smallint not null,
  cultivation_type text not null,
  growth_stage text not null,
  observed_change text not null,
  summary text not null,
  published_at timestamptz not null
) on commit drop;

insert into pg_temp._farmille_demo_usage_reports values
  ('72000000-0000-4000-8000-000000000001', 'Actibio X EVO53', 'ICL JAPAN', '22000000-0000-4000-8000-000000000001', 'ミニトマト', '高温期のミニトマトで葉姿を3週間追った記録', array['高温対策', '草勢維持'], 12, '施設栽培', '収穫期', '処理区と対照区を同じ灌水条件で観察しました。2回目の使用後から、午後の上位葉の角度に小さな差が見られました。', '収量差はまだ判断できませんが、盛夏期の株の状態を保つ補助として継続して比較します。', '2026-09-06T10:00:00+09:00'),
  ('72000000-0000-4000-8000-000000000002', 'BIOZ Diamond', 'ICL JAPAN', '22000000-0000-4000-8000-000000000002', 'いちご', 'いちご定植後の根張りを2週間比較', array['活着', '根張り'], 22, '施設栽培', '定植直後', '定植時に処理区を設け、7日目と14日目に根鉢を確認しました。処理区では白い細根が外周に多く見られました。', '初期生育は揃いました。次回は同じ苗ロットで株数を増やし、花芽への影響も記録します。', '2026-09-05T10:00:00+09:00'),
  ('72000000-0000-4000-8000-000000000003', 'BIOZ Moonstone', 'ICL JAPAN', '22000000-0000-4000-8000-000000000003', 'きゅうり', 'きゅうりの着果期に葉面散布を試した', array['着果期', '草勢維持'], 8, '施設栽培', '収穫初期', '7日間隔で2回散布し、節間と葉色を記録しました。処理区では摘葉後の新葉が止まりにくい傾向でした。', '作業時間は通常散布とほぼ同じでした。果数は期間を延ばして確認する必要があります。', '2026-09-04T10:00:00+09:00'),
  ('72000000-0000-4000-8000-000000000004', 'BIOZ Onyx Annual', 'ICL JAPAN', '22000000-0000-4000-8000-000000000004', '水稲', '水稲の出穂前後で葉色を観察', array['高温対策', '登熟'], 15, '露地栽培', '出穂期', '出穂前に処理し、対照区と葉色を定点観察しました。出穂後10日でも処理区は上位葉の色を保っていました。', '登熟歩合は収穫後に確認します。現時点では葉色の経過を比較できる記録が得られました。', '2026-09-03T10:00:00+09:00'),
  ('72000000-0000-4000-8000-000000000005', 'Actijump', 'ICL JAPAN', '22000000-0000-4000-8000-000000000007', '大豆', '大豆の播種時に種子処理を試した', array['根粒形成', '初期生育'], 1, '露地栽培', '播種期', '処理区と無処理区を各20株掘り取り、根粒を数えました。処理区は株ごとのばらつきが小さく、根粒数も多い結果でした。', '小区画での結果なので、次作は土壌条件の異なる圃場でも同じ手順で比較します。', '2026-09-02T10:00:00+09:00'),
  ('72000000-0000-4000-8000-000000000006', '鉄力あぐりB10', '愛知製鋼', '22000000-0000-4000-8000-000000000006', 'ぶどう', 'ぶどう肥大期の新梢と葉色の記録', array['葉色改善', '樹勢'], 19, '露地栽培', '果実肥大期', '樹勢の弱い列へ株元施用し、葉色票で4週間記録しました。2週目以降に新葉の色が整う傾向でした。', '新梢長には大きな差がありませんでした。葉色と収量の関係を収穫まで追います。', '2026-09-01T10:00:00+09:00'),
  ('72000000-0000-4000-8000-000000000007', 'BIOZ Nephrite', 'ICL JAPAN', '22000000-0000-4000-8000-000000000005', '大豆', '大豆の開花期以降に根粒の状態を比較', array['根粒活性', '窒素固定'], 10, '露地栽培', '開花期', '開花前から2回施用し、処理区と対照区で根粒の色と数を確認しました。処理区では赤みのある根粒がやや多く残っていました。', '小区画での観察なので、収量調査まで続けて根粒の状態との関係を確認します。', '2026-08-31T10:00:00+09:00'),
  ('72000000-0000-4000-8000-000000000008', 'ハイタック-C', 'アグロ カネショウ', '22000000-0000-4000-8000-000000000008', 'なす', 'なすの新葉と果実を3週間観察', array['カルシウム補給', '果実品質'], 43, '施設栽培', '収穫期', '7日間隔で葉面散布し、新葉の縁と若い果実を定点で確認しました。処理区では葉先の状態が揃って見えました。', '生育差は小さかったため、次作は尻腐れ果の数も区画別に記録します。', '2026-08-30T10:00:00+09:00');

insert into public.usage_reports (
  id,
  material_id,
  author_user_id,
  crop_id,
  status,
  title,
  purpose_tags,
  prefecture_code,
  cultivation_type,
  growth_stage,
  observed_change,
  summary,
  pesticide_ack,
  is_provided_sample,
  published_at,
  created_at,
  updated_at
)
select
  demo.id,
  material.id,
  demo.author_user_id,
  crop.id,
  'published',
  demo.title,
  demo.purpose_tags,
  demo.prefecture_code,
  demo.cultivation_type,
  demo.growth_stage,
  demo.observed_change,
  demo.summary,
  true,
  false,
  demo.published_at,
  demo.published_at,
  demo.published_at
from pg_temp._farmille_demo_usage_reports as demo
join public.materials as material
  on material.name = demo.material_name
 and material.manufacturer_name = demo.manufacturer_name
join public.crops as crop on crop.name = demo.crop_name
on conflict (id) do update set
  material_id = excluded.material_id,
  author_user_id = excluded.author_user_id,
  crop_id = excluded.crop_id,
  status = excluded.status,
  title = excluded.title,
  purpose_tags = excluded.purpose_tags,
  prefecture_code = excluded.prefecture_code,
  cultivation_type = excluded.cultivation_type,
  growth_stage = excluded.growth_stage,
  observed_change = excluded.observed_change,
  summary = excluded.summary,
  pesticide_ack = excluded.pesticide_ack,
  is_provided_sample = excluded.is_provided_sample,
  published_at = excluded.published_at,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.usage_report_media (
  id, usage_report_id, media_type, url, caption, placement, sort_order
)
values
  ('72100000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000001', 'photo', 'https://placehold.co/960x540/e8f5e9/2e7d32?text=tomato-house', 'ミニトマトの処理区', 'cover', 0),
  ('72100000-0000-4000-8000-000000000002', '72000000-0000-4000-8000-000000000002', 'photo', 'https://placehold.co/960x540/f1f8f2/1b5e20?text=strawberry-roots', '定植2週間後の根鉢', 'cover', 0),
  ('72100000-0000-4000-8000-000000000003', '72000000-0000-4000-8000-000000000003', 'photo', 'https://placehold.co/960x540/e8f5e9/2e7d32?text=cucumber', '着果期のきゅうり', 'cover', 0),
  ('72100000-0000-4000-8000-000000000004', '72000000-0000-4000-8000-000000000004', 'photo', 'https://placehold.co/960x540/fff4e0/b26a00?text=rice-field', '出穂期の処理区', 'cover', 0),
  ('72100000-0000-4000-8000-000000000005', '72000000-0000-4000-8000-000000000005', 'photo', 'https://placehold.co/960x540/f1f8f2/1b5e20?text=soybean-roots', '掘り取り調査の根', 'cover', 0),
  ('72100000-0000-4000-8000-000000000006', '72000000-0000-4000-8000-000000000006', 'photo', 'https://placehold.co/960x540/e8f5e9/2e7d32?text=grape-vine', '肥大期の新梢', 'cover', 0),
  ('72100000-0000-4000-8000-000000000007', '72000000-0000-4000-8000-000000000007', 'photo', 'https://placehold.co/960x540/f1f8f2/1b5e20?text=soybean-nodules', '開花期の大豆の根', 'cover', 0),
  ('72100000-0000-4000-8000-000000000008', '72000000-0000-4000-8000-000000000008', 'photo', 'https://placehold.co/960x540/e8f5e9/2e7d32?text=eggplant', '葉面散布後のなす', 'cover', 0)
on conflict (id) do update set
  usage_report_id = excluded.usage_report_id,
  media_type = excluded.media_type,
  url = excluded.url,
  caption = excluded.caption,
  placement = excluded.placement,
  sort_order = excluded.sort_order,
  updated_at = now();

-- カード上で参考数の違いを確認できるよう、投稿者本人を除いて固定票を付ける。
insert into public.helpful_votes (user_id, target_type, target_id)
select voter.user_id, 'review', review.id
from (
  values
    ('22000000-0000-4000-8000-000000000001'::uuid),
    ('22000000-0000-4000-8000-000000000002'::uuid),
    ('22000000-0000-4000-8000-000000000003'::uuid),
    ('22000000-0000-4000-8000-000000000004'::uuid),
    ('22222222-2222-4222-8222-222222222222'::uuid)
) as voter(user_id)
cross join pg_temp._farmille_demo_reviews as review
where voter.user_id <> review.author_user_id
on conflict (user_id, target_type, target_id) do nothing;

insert into public.helpful_votes (user_id, target_type, target_id)
select voter.user_id, 'usage_report', report.id
from (
  values
    ('22000000-0000-4000-8000-000000000001'::uuid),
    ('22000000-0000-4000-8000-000000000002'::uuid),
    ('22000000-0000-4000-8000-000000000003'::uuid),
    ('22000000-0000-4000-8000-000000000004'::uuid),
    ('22222222-2222-4222-8222-222222222222'::uuid)
) as voter(user_id)
cross join pg_temp._farmille_demo_usage_reports as report
where voter.user_id <> report.author_user_id
on conflict (user_id, target_type, target_id) do nothing;

commit;

select 'materials' as label, count(*) from public.materials
union all
select 'profiles', count(*) from public.profiles
union all
select 'published reviews', count(*) from public.reviews where status = 'published'
union all
select 'published usage reports', count(*) from public.usage_reports where status = 'published';
