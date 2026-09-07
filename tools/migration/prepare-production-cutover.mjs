import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    output: { type: "string" },
    commit: { type: "boolean", default: false },
    "verify-rollback": { type: "boolean", default: false },
  },
});
if (!values.output) throw new Error("--output が必要です");
if (values.commit && values["verify-rollback"]) throw new Error("復旧検証と本番適用は同時に指定できません");
const migrationDirectory = "supabase/migrations";
const files = readdirSync(migrationDirectory).filter((file) => file.endsWith(".sql")).sort();
const migrations = files.map((file) => ({
  version: file.split("_")[0],
  name: file.slice(15, -4),
  sql: readFileSync(join(migrationDirectory, file), "utf8"),
}));
const quote = (text) => `'${text.replaceAll("'", "''")}'`;
const seed = readFileSync("tools/migration/production-cutover-materials.sql", "utf8");
const supplement = readFileSync("tools/migration/production-cutover-supplement.sql", "utf8");
const rollbackVerification = values["verify-rollback"]
  ? readFileSync("tools/migration/rollback-production-cutover.sql", "utf8")
    .replace(/^begin;\s*$/im, "")
    .replace(/^commit;\s*$/im, "")
    + "\nselect (select count(*) from public.products) as restored_products, (select count(*) from auth.users) as preserved_auth_users;\n"
  : "";
const ledger = migrations.map(({ version, name }) =>
  `insert into supabase_migrations.schema_migrations (version, name) values (${quote(version)}, ${quote(name)});`,
).join("\n");
const sql = `begin;
set local lock_timeout = '5s';
set local statement_timeout = '90s';
select pg_advisory_xact_lock(20260908, 1);
do $$ begin
  if to_regnamespace('legacy_v1_20260908') is not null
    or to_regnamespace('app') is not null
    or to_regclass('public.products') is null then
    raise exception '旧スキーマからの初回切替だけが対象です';
  end if;
end $$;
alter schema public rename to legacy_v1_20260908;
revoke all on schema legacy_v1_20260908 from public, anon, authenticated, service_role;
create or replace function legacy_v1_20260908.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $legacy_auth$ begin return new; end; $legacy_auth$;
create schema public authorization pg_database_owner;
grant usage on schema public to postgres, anon, authenticated, service_role;
alter table supabase_migrations.schema_migrations set schema legacy_v1_20260908;
create table supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
${migrations.map(({ sql: content }) => content.replace(/^\s*--.*$/gm, "")).join("\n")}
${seed}
${supplement}
${ledger}
notify pgrst, 'reload schema';
select jsonb_build_object(
  'materials', (select count(*) from public.materials),
  'manufacturers', (select count(*) from public.manufacturers),
  'images', (select count(*) from public.material_images),
  'sources', (select count(*) from public.material_sources),
  'crop_links', (select count(*) from public.material_crops),
  'effect_links', (select count(*) from public.material_effects),
  'legacy_users', (select count(*) from legacy_v1_20260908.users),
  'legacy_reviews', (select count(*) from legacy_v1_20260908.reviews),
  'auth_users', (select count(*) from auth.users),
  'migration_count', (select count(*) from supabase_migrations.schema_migrations)
) as cutover_verification;
${rollbackVerification}
${values.commit ? "commit;" : "rollback;"}
`;
writeFileSync(values.output, sql, { mode: 0o600 });
console.log(`${migrations.length}件のmigrationを含む${values.commit ? "適用" : "ロールバック検証"}SQLを生成しました`);
