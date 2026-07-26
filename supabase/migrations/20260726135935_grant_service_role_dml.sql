-- =============================================================================
-- v2 スキーマ 修正: service_role への public スキーマ DML 権限付与
-- 経緯: T-13 の検証で発覚。config.toml の auto_expose_new_tables は Supabase の
--   新しいクラウド既定（unset = 自動公開しない）に従っており、テーブル作成時に
--   anon/authenticated/service_role へ暗黙の GRANT は行われない。
--   20260726121242_rls_policies.sql は anon/authenticated の権限は明示的に
--   revoke/grant し直しているが、service_role への GRANT が漏れており、
--   src/server（service_role クライアント）から public スキーマのテーブルを
--   一切読み書きできない状態になっていた。
-- 方針: service_role は RLS を BYPASSRLS で無視する第一防御外の信頼ロールなので
--   行フィルタは不要。テーブル権限（GRANT）のみ全面的に付与する。
-- =============================================================================

grant usage on schema public to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;

-- 今後 migration で追加されるテーブルにも自動付与されるようにする
-- （anon/authenticated と同様、テーブル追加時の grant 漏れを防ぐ運用が既に
--   121242 のコメントで案内されているが、service_role は default privileges
--   側で機械的に担保する）。
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

-- app スキーマは関数のみ（テーブルなし）で、service_role へは init_accounts
-- migration で usage を既に付与済み。関数の EXECUTE は作成時点で PUBLIC に
-- 付与される既定のままなので（明示的に revoke public したのは
-- app.refresh_material_review_aggregates(uuid) のみで、これはトリガー経由
-- でしか呼ばれず EXECUTE 権限チェックの対象外）、service_role に追加で
-- 付与すべき権限はない。
