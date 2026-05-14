-- Sprint 1 / ADR-0009 §2.2 / spec maker-approval-admin §4.1
-- users.role CHECK 制約に 'admin' を 6 ロール目として追加する。
-- PostgreSQL の CHECK 制約は内容変更不可なので DROP + RECREATE する。
-- 既存 5 ロールデータと整合するため、DROP の直後に旧 5 ロール + 'admin' を許容する新制約を作成。
-- アンチパターン回避: admin を boolean フラグで表現せず role 1 本に統一 (SKILL §4 #4)。
-- 参考: init.sql L99 の元の制約定義。

BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('farmer','maker','ja_staff','researcher','unassigned','admin'));

COMMIT;
