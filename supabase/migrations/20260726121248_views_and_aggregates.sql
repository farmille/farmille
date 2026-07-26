-- =============================================================================
-- v2 スキーマ 7/8: 公開ビューと集計
-- 正: docs/rebuild/01-domain-model.md §5（公開ビュー）・§3（集計）・§7
-- =============================================================================
-- 公開ビューの security_invoker について
--   * public_sellers … security_invoker = true。seller_accounts は approved 行を
--     全員が SELECT できるので、呼び出し元の権限でも公開行だけが見える。
--     contact_* はテーブル権限（GRANT SELECT (…)）の側で読めなくしてある。
--   * public_profiles … security_invoker = false（＝定義者権限）。profiles は
--     実テーブルの SELECT を本人のみに絞っている（01 §5「実テーブルは本人のみ」）
--     ため、security_invoker = true では他人の行が1件も見えず「公開カラムだけを
--     全員に晒す」というビューの目的が成立しない。standpoint と非公開
--     prefecture を DB 層で守ることを優先し、定義者権限にしている。
--     ビューには SELECT のみ許可し、更新系の権限は剥奪する。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public_profiles（公開プロフィール）
-- 除外: standpoint（内部専用）・prefecture_public=false のときの prefecture_code
-- -----------------------------------------------------------------------------

create view public.public_profiles
with (security_invoker = false, security_barrier = true) as
select
  p.user_id,
  p.handle,
  p.avatar_url,
  p.bio,
  p.cultivation_styles,
  p.affiliation,
  p.website_url,
  p.sns_url,
  p.prefecture_public,
  case when p.prefecture_public then p.prefecture_code end as prefecture_code,
  p.created_at
from public.profiles p;

comment on view public.public_profiles is
  '公開プロフィール。standpoint と非公開の prefecture_code を晒さない（01 §5）。';

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

-- -----------------------------------------------------------------------------
-- public_sellers（公開出品者ページ）
-- 除外: contact_email・contact_name（内部）・auth_user_id・invite_code
-- 対象: approved のみ
-- -----------------------------------------------------------------------------

create view public.public_sellers
with (security_invoker = true, security_barrier = true) as
select
  s.id,
  s.official_name,
  s.seller_type,
  s.login_id,
  s.location,
  s.region_scope,
  s.website_url,
  s.logo_url,
  s.profile_text,
  s.approved_at,
  s.created_at,
  s.updated_at
from public.seller_accounts s
where s.status = 'approved';

comment on view public.public_sellers is
  '公開出品者ページ。contact_* と内部カラムを晒さず、approved のみを返す（01 §5）。';

revoke all on public.public_sellers from anon, authenticated;
grant select on public.public_sellers to anon, authenticated;

-- -----------------------------------------------------------------------------
-- helpful_counts（参考になったの件数）
-- 個票（helpful_votes）は本人しか読めないため、表示用の件数は定義者権限の
-- 集計ビューで公開する。誰が押したかは晒さない。
-- -----------------------------------------------------------------------------

create view public.helpful_counts
with (security_invoker = false, security_barrier = true) as
select
  v.target_type,
  v.target_id,
  count(*)::bigint as helpful_count
from public.helpful_votes v
group by v.target_type, v.target_id;

comment on view public.helpful_counts is
  '参考になったの件数。個票は本人のみ、件数は全員に公開する（01 §3）。';

revoke all on public.helpful_counts from anon, authenticated;
grant select on public.helpful_counts to anon, authenticated;

-- -----------------------------------------------------------------------------
-- view_counts_daily（閲覧数の日次集計。JST 基準）
-- 生ログ（view_events）は admin のみ。表示は使用レポートと記事のみで使う。
-- -----------------------------------------------------------------------------

create view public.view_counts_daily
with (security_invoker = false, security_barrier = true) as
select
  e.target_type,
  e.target_id,
  (e.created_at at time zone 'Asia/Tokyo')::date as view_date,
  count(*)::bigint as view_count
from public.view_events e
group by e.target_type, e.target_id, (e.created_at at time zone 'Asia/Tokyo')::date;

comment on view public.view_counts_daily is
  '閲覧数の日次集計（JST）。生ログは admin のみ、集計は公開（01 §3）。';

revoke all on public.view_counts_daily from anon, authenticated;
grant select on public.view_counts_daily to anon, authenticated;

-- -----------------------------------------------------------------------------
-- materials の集計カラムを reviews のトリガーで更新する
--   review_count        … published レビュー件数
--   avg_rating          … published レビューの平均評価（0 件なら NULL）
--   control_plot_ratio  … 対照区ありレビュー率（0 件なら NULL）
-- SECURITY DEFINER のため materials の RLS と
-- enforce_material_column_scope トリガーを通り抜けられる。
-- -----------------------------------------------------------------------------

create or replace function app.refresh_material_review_aggregates(p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.materials m
     set review_count = agg.review_count,
         avg_rating = agg.avg_rating,
         control_plot_ratio = agg.control_plot_ratio
    from (
      select
        count(*) as review_count,
        round(avg(r.rating), 2) as avg_rating,
        case
          when count(*) = 0 then null
          else round(count(*) filter (where r.has_control_plot)::numeric / count(*), 3)
        end as control_plot_ratio
      from public.reviews r
      where r.material_id = p_material_id
        and r.status = 'published'
    ) agg
   where m.id = p_material_id;
end;
$$;

comment on function app.refresh_material_review_aggregates(uuid) is
  'materials の非正規化集計カラムを published レビューから再計算する。生データから常に再計算可能（01 §7）。';

revoke all on function app.refresh_material_review_aggregates(uuid) from public;

create or replace function app.reviews_refresh_aggregates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform app.refresh_material_review_aggregates(new.material_id);
  end if;

  if tg_op = 'DELETE'
     or (tg_op = 'UPDATE' and old.material_id is distinct from new.material_id) then
    perform app.refresh_material_review_aggregates(old.material_id);
  end if;

  return null;
end;
$$;

create trigger reviews_refresh_material_aggregates
  after insert or update or delete on public.reviews
  for each row
  execute function app.reviews_refresh_aggregates();
