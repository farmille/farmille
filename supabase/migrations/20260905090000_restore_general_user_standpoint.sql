-- =============================================================================
-- 一般ユーザーの内部属性「立場」を4択で復元する
--
-- メーカーは専用アカウントへ分離したため、一般ユーザーの選択肢には含めない。
-- 旧 maker_related は一般ユーザーのまま「その他」へ移す。
-- =============================================================================

alter table public.profiles
  add column standpoint text;

update public.profiles as profiles
set standpoint = case
  when restore.standpoint = 'maker_related' then 'other'
  else restore.standpoint
end
from public.profile_standpoint_restore_20260905 as restore
where restore.user_id = profiles.user_id;

do $$
begin
  if exists (select 1 from public.profiles where standpoint is null) then
    raise exception 'standpoint を復元できない一般ユーザーが存在します';
  end if;
end;
$$;

alter table public.profiles
  alter column standpoint set not null,
  add constraint profiles_standpoint_check
    check (standpoint in ('farmer', 'ja', 'expert', 'other'));

comment on column public.profiles.standpoint is
  '一般ユーザーの立場。内部専用で公開プロフィールや投稿には表示しない。farmer / ja / expert / other の4択。';

comment on table public.profiles is
  '一般ユーザー（匿名・ハンドルネーム）。表示情報のハンドル・アバターと、内部属性の立場だけを保持する。実テーブルの SELECT は本人と admin のみに限定し、公開情報は public_profiles ビュー経由で返す。';

drop table public.profile_standpoint_restore_20260905;
