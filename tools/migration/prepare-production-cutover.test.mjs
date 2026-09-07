import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("本番切替の既定はロールバック検証で、旧データを削除しない", () => {
  const directory = mkdtempSync(join(tmpdir(), "farmille-cutover-test-"));
  const output = join(directory, "dry-run.sql");
  execFileSync(process.execPath, ["tools/migration/prepare-production-cutover.mjs", "--output", output]);
  const sql = readFileSync(output, "utf8");
  assert.ok(sql.startsWith("begin;"));
  assert.ok(sql.trimEnd().endsWith("rollback;"));
  assert.ok(sql.includes("alter schema public rename to legacy_v1_20260908"));
  assert.ok(sql.includes("資材マスタの移行件数が一致しません"));
  assert.ok(sql.includes("施用レシピの移行件数が一致しません"));
  assert.doesNotMatch(sql, /(?:delete\s+from|truncate|drop\s+table)\s+(?:auth\.users|legacy_v1_20260908\.)/i);
});

test("適用版には明示的なcommitオプションが必要", () => {
  const directory = mkdtempSync(join(tmpdir(), "farmille-cutover-test-"));
  const output = join(directory, "commit.sql");
  execFileSync(process.execPath, ["tools/migration/prepare-production-cutover.mjs", "--output", output, "--commit"]);
  assert.ok(readFileSync(output, "utf8").trimEnd().endsWith("commit;"));
});
