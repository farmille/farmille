-- 旧分類変更申請には同じ資材へ複数の open 行を作れるため、承認フロー移行前に
-- 最新1件だけを pending 候補として残す。古い行は履歴を失わず見送りとして移行する。

do $$
begin
  -- ローカルで後続 migration を先に検証済みの場合にも再実行可能にする。
  if to_regclass('public.material_edit_requests') is not null then
    with ranked as (
      select
        id,
        row_number() over (
          partition by material_id
          order by created_at desc, id desc
        ) as position
      from public.material_edit_requests
      where status = 'open'
    )
    update public.material_edit_requests requests
    set status = 'declined'
    from ranked
    where requests.id = ranked.id
      and ranked.position > 1;
  end if;
end;
$$;
