-- =============================================================================
-- 一般ユーザー属性の整理前に、内部属性の立場を退避する
--
-- 次の migration で profiles の不要な属性を削除するが、立場は後続の migration
-- で4択へ整理して復元する。適用途中でも anon / authenticated から読めないよう、
-- 退避表への権限は付与しない。
-- =============================================================================

create table public.profile_standpoint_restore_20260905 (
  user_id uuid primary key,
  standpoint text not null
    constraint profile_standpoint_restore_20260905_value_check
    check (standpoint in ('farmer', 'ja', 'maker_related', 'expert', 'other'))
);

revoke all on public.profile_standpoint_restore_20260905 from anon, authenticated;

insert into public.profile_standpoint_restore_20260905 (user_id, standpoint)
select user_id, standpoint
from public.profiles;
