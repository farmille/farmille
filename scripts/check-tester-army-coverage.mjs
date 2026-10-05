import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import * as v from "valibot";

const FlowSchema = v.object({
  route: v.string(),
  role: v.picklist([
    "anonymous",
    "general",
    "seller",
    "admin",
    "verified-company",
    "local-development",
  ]),
  state: v.pipe(v.string(), v.minLength(1)),
  actions: v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.minLength(1)),
  assertions: v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.minLength(1)),
  tests: v.array(v.string()),
  verification: v.picklist(["pending", "gap", "local-only"]),
});
const ledgerFile = process.argv[2] ?? "tester-army/flows.json";
const flows = v.parse(v.array(FlowSchema), JSON.parse(await readFile(ledgerFile, "utf8")));

async function appRoutes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const routes = [];
  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) routes.push(...(await appRoutes(filename)));
    else if (entry.name === "page.tsx") {
      const relative = path.relative("src/app", directory).split(path.sep).join("/");
      routes.push(relative.length === 0 ? "/" : `/${relative}`);
    }
  }
  return routes;
}

const actualRoutes = new Set(await appRoutes("src/app"));
const ledgerRoutes = new Set(flows.map((flow) => flow.route));
if (ledgerRoutes.size !== flows.length) throw new Error("フロー台帳のURLが重複しています。");
for (const route of actualRoutes) {
  if (!ledgerRoutes.has(route)) throw new Error(`フロー台帳に${route}がありません。`);
}
for (const flow of flows) {
  if (!actualRoutes.has(flow.route))
    throw new Error(`実装にないURL${flow.route}が台帳に残っています。`);
  for (const testFile of flow.tests) await access(testFile);
  if (flow.verification === "pending" && flow.tests.length === 0) {
    throw new Error(`${flow.route}には検証元のテストが必要です。`);
  }
}

console.log(`画面台帳 ${flows.length}件を実装と照合しました。`);
for (const verification of ["pending", "gap", "local-only"]) {
  console.log(
    `${verification} ${flows.filter((flow) => flow.verification === verification).length}件`,
  );
}
console.log(
  "この検査は画面とテスト参照の照合です。操作結果の証拠は各ランナーの実行レポートで確認してください。",
);
