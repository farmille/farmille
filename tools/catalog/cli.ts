import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import * as v from "valibot";
import { ProductMapSchema, SourceSchema, validateSource } from "./source.ts";
import { SnapshotSchema, snapshotQuery } from "./snapshot.ts";
import { planCatalog, ResolutionsSchema } from "./plan.ts";
import { applySql } from "./sql.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    source: { type: "string" },
    snapshot: { type: "string" },
    map: { type: "string" },
    resolutions: { type: "string" },
    out: { type: "string" },
  },
});

if (positionals[0] === "snapshot") process.stdout.write(snapshotQuery + ";\n");
else if (positionals[0] === "plan") {
  if (!values.source || !values.snapshot || !values.out)
    throw new Error("--source、--snapshot、--out を指定してください。");

  const source = validateSource(
    v.parse(SourceSchema, JSON.parse(await readFile(values.source, "utf8"))),
  );

  const snapshot = v.parse(SnapshotSchema, JSON.parse(await readFile(values.snapshot, "utf8")));

  const productMap = v.parse(
    ProductMapSchema,
    JSON.parse(
      await readFile(values.map ?? new URL("./product-map.json", import.meta.url), "utf8"),
    ),
  );

  const resolutions = values.resolutions
    ? v.parse(ResolutionsSchema, JSON.parse(await readFile(values.resolutions, "utf8")))
    : [];

  const plan = planCatalog(source, snapshot, new Map(Object.entries(productMap)), resolutions);
  await mkdir(values.out, { recursive: true });

  const report = {
    runId: plan.runId,
    sourceHash: plan.sourceHash,
    planHash: plan.planHash,
    products: source.製品.length,
    materials: plan.materials.length,
    published: plan.materials.filter((row) => row.fields.publication_status === "published").length,
    links: plan.materials.reduce((sum, row) => sum + row.fields.links.length, 0),
    excludedImages: plan.excluded.length,
    changes: plan.materials
      .filter((row) => row.changed.length)
      .map((row) => ({ id: row.id, name: row.fields.name, fields: row.changed })),
    masterChanges: Object.fromEntries(
      Object.entries(plan.masters).map(([table, rows]) => [table, rows.length]),
    ),
    missingProducts: snapshot.product_map.filter(
      (row) => !source.製品.some((product) => product.product_id === row.source_product_id),
    ),
    retired: plan.retired.map((row) => ({ id: row.id, name: row.fields.name })),
    conflicts: plan.conflicts,
  };

  await writeFile(resolve(values.out, "report.json"), JSON.stringify(report, null, 2) + "\n");
  const output = resolve(values.out, "apply.sql");

  if (plan.conflicts.length) {
    await rm(output, { force: true });
    process.exitCode = 2;
  } else await writeFile(output, applySql(plan, source));
  process.stdout.write(
    `製品 ${report.products}件、公開資材 ${report.published}件、変更 ${report.changes.length}件、未解決 ${report.conflicts.length}件\n`,
  );
} else throw new Error("snapshot または plan を指定してください。");
