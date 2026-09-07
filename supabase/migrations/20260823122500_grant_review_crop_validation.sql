-- SECURITY INVOKERのレビューRPCから呼ぶ入力検証関数だけを実行可能にする。
-- 関数は引数を検証するだけで、テーブルの読み書きや権限昇格は行わない。
grant execute on function app.assert_review_crop_ids(uuid[]) to authenticated, service_role;
