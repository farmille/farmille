import { execFileSync } from "node:child_process";
import fs from "node:fs";
import * as v from "valibot";
import { createCiPlan } from "./selection.ts";

const event = v.parse(v.picklist(["pull_request", "push"]), process.argv[2]);
const root = process.cwd();
let changedFiles: string[] = [];
if (event === "pull_request") {
  const base = v.parse(v.pipe(v.string(), v.regex(/^[a-f0-9]{40}$/)), process.argv[3]);
  // PR 全体を merge-base から比較する。rename は削除＋追加にして全件検査へ送る。
  changedFiles = execFileSync(
    "git",
    ["diff", "--name-only", "--no-renames", "-z", `${base}...HEAD`, "--"],
    {
      encoding: "utf8",
    },
  )
    .split("\0")
    .filter((file) => file.length > 0);
}
const plan = createCiPlan(root, changedFiles, event === "push");
console.log(JSON.stringify(plan, null, 2));
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `storybook=${JSON.stringify(plan.storybook)}\nrun-storybook=${plan.storybook.mode !== "none"}\ne2e=${plan.e2e}\n`,
  );
}
