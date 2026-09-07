-- ローカル検証用：運営画面が「空だと確認できない」データを補う。
--
-- !!! ローカルの Supabase 以外では実行しない !!!
--
-- 使い方:
--   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
--     -f tools/dev/seed-demo.sql
--
-- 何度実行しても同じ状態になる（既にあれば作らない）。
-- 補うもの:
--   - 審査待ちのメーカー申請 1件（/admin/sellers）
--   - 編集局待ちの使用レポート 1件（/admin/usage-reports）
--   - 未処理の通報 1件（/admin/reports）

begin;

-- 1. 審査待ちのメーカー申請
insert into seller_accounts (
  official_name, login_id, contact_email, contact_name,
  location, region_scope, website_url, profile_text, status
)
select
  'デモ農材工業株式会社', 'demo-applicant',
  'apply@example.com', '申請 太郎',
  '静岡県静岡市', '全国', 'https://example.com',
  '審査画面の確認用に用意した申請です。', 'applied'
where not exists (
  select 1 from seller_accounts where login_id = 'demo-applicant'
);

-- 2. 編集局待ち（pending）の使用レポート
with author as (
  select user_id from profiles where handle = 'しおさい農園' limit 1
),
target as (
  select id from materials order by name limit 1
),
crop as (
  -- ミニトマトがあればそれを、無ければ任意の1件を使う
  select id from crops order by (name = 'ミニトマト') desc, name limit 1
)
insert into usage_reports (
  material_id, author_user_id, crop_id, status, title,
  purpose_tags, prefecture_code, cultivation_type, growth_stage,
  observed_change, summary, pesticide_ack
)
select
  (select id from target),
  (select user_id from author),
  (select id from crop limit 1),
  'pending',
  '編集局の確認待ちレポート（デモ）',
  array['耐暑性改善'], 22, '施設栽培', '収穫期',
  '定植後の草勢が安定し、盛夏でもしおれが出にくくなりました。',
  '高温期の管理が楽になった一方、追肥の設計は見直しが必要でした。',
  true
where exists (select 1 from author)
  and not exists (
    select 1 from usage_reports where title = '編集局の確認待ちレポート（デモ）'
  );

-- 3. 未処理の通報（既存の公開レビュー1件を対象にする）
with reporter as (
  select user_id from profiles where handle = 'しおさい農園' limit 1
),
target_review as (
  select r.id from reviews r
  where r.status = 'published'
    and r.author_user_id <> (select user_id from reporter)
  limit 1
)
insert into content_reports (
  reporter_user_id, target_type, target_id, reason, status
)
select
  (select user_id from reporter), 'review', (select id from target_review),
  '内容が事実と異なる可能性があります（デモ用の通報）。', 'open'
where exists (select 1 from target_review)
  and not exists (
    select 1 from content_reports
    where target_type = 'review' and target_id = (select id from target_review)
  );

commit;

select 'applied sellers' as label, count(*) from seller_accounts where status = 'applied'
union all
select 'pending reports', count(*) from usage_reports where status = 'pending'
union all
select 'open content_reports', count(*) from content_reports where status = 'open';
