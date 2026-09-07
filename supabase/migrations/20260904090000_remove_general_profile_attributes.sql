-- =============================================================================
-- 一般ユーザーのプロフィール属性を廃止する
--
-- 投稿者の識別に必要なハンドルとアバターだけを残し、立場・地域・自己紹介・
-- 栽培情報・所属・外部リンクは収集も公開もしない。
-- =============================================================================

drop view public.public_profiles;

drop table public.profile_crops;

alter table public.profiles
  drop column prefecture_code,
  drop column prefecture_public,
  drop column standpoint,
  drop column bio,
  drop column cultivation_styles,
  drop column affiliation,
  drop column website_url,
  drop column sns_url;

comment on table public.profiles is
  '一般ユーザー（匿名・ハンドルネーム）。投稿者の識別に必要な表示情報だけを保持する。実テーブルの SELECT は本人と admin のみに限定し、公開情報は public_profiles ビュー経由で返す。';

create view public.public_profiles
with (security_invoker = false, security_barrier = true) as
select
  p.user_id,
  p.handle,
  p.avatar_url,
  p.created_at
from public.profiles p;

comment on view public.public_profiles is
  '一般ユーザーの公開表示情報。ハンドル・アバター・登録日時だけを返す。';

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
