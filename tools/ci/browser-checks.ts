import { execFileSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as v from "valibot";
import { createBrowserCheckPlan, type BrowserCheckPlan } from "./selection.ts";

const sha = v.pipe(v.string(), v.regex(/^[a-f0-9]{40}$/));
const updateSchema = v.tuple([v.string(), sha, v.string(), sha]);
const zeroSha = "0".repeat(40);
const root = process.cwd();
const mode = v.parse(v.picklist(["pre-push", "all"]), process.argv[2]);

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).replace(
    /\n$/,
    "",
  );
}

function assertCheckout(expectedHead: string): void {
  if (git(["rev-parse", "HEAD"]) !== expectedHead) {
    throw new Error("検査中に HEAD が変わりました。現在のブランチから push し直してください。");
  }
  if (git(["status", "--porcelain", "--untracked-files=all"])) {
    throw new Error("未コミットの変更があります。commit または stash してから push してください。");
  }
}

function pushPlan(): { plan: BrowserCheckPlan; head: string } | null {
  const updates = fs
    .readFileSync(0, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => v.parse(updateSchema, line.trim().split(/\s+/)))
    .filter(([, localSha]) => localSha !== zeroSha);
  if (updates.length === 0) return null;
  const head = git(["rev-parse", "HEAD"]);
  const changes = new Set<string>();
  let full = false;
  for (const [, localSha, remoteRef, remoteSha] of updates) {
    if (git(["rev-parse", `${localSha}^{commit}`]) !== head) {
      throw new Error(
        "push 対象が現在の HEAD と異なります。対象のブランチに移動して個別に push してください。",
      );
    }
    // 新規 ref・main・比較元を持たない clone は、差分を推測せず全件検査する。
    if (remoteSha === zeroSha || remoteRef === "refs/heads/main") {
      full = true;
      continue;
    }
    const base = spawnSync("git", ["cat-file", "-e", `${remoteSha}^{commit}`], { stdio: "ignore" });
    if (base.error) throw base.error;
    if (base.status !== 0) {
      full = true;
      continue;
    }
    for (const file of git([
      "diff",
      "--name-only",
      "--no-renames",
      "-z",
      remoteSha,
      head,
      "--",
    ]).split("\0")) {
      if (file) changes.add(file);
    }
  }
  // 依存グラフも、これから送る commit と同じソースから作る。
  assertCheckout(head);
  return { plan: createBrowserCheckPlan(root, [...changes], full), head };
}

async function runChecks(plan: BrowserCheckPlan): Promise<void> {
  if (plan.storybook.mode === "none" && !plan.e2e) return;
  // clone が違っても、同じユーザーの DB とポートを共有する。
  const lock = path.join(os.tmpdir(), `farmille-browser-checks-${os.userInfo().username}.lock`);
  try {
    fs.mkdirSync(lock, { mode: 0o700 });
  } catch (cause) {
    throw new Error(
      `検査用ロックを取得できません：${lock}。実行中の検査が終わってから再実行してください。異常終了後は、検査プロセスが残っていないことを確認してこのディレクトリを削除してください。`,
      { cause },
    );
  }
  try {
    fs.writeFileSync(path.join(lock, "owner"), `PID=${process.pid}\n${root}\n`);
    const env: NodeJS.ProcessEnv = { ...process.env, CI: "true" };
    delete env.PLAYWRIGHT_EXTERNAL_WEB_SERVER;
    delete env.STORYBOOK_RESPONSIVE_SHARD;
    env.STORYBOOK_RESPONSIVE_SELECTION = JSON.stringify(plan.storybook);
    const commands = [
      ...(plan.storybook.mode !== "none" ? ["build-storybook", "test:storybook:responsive"] : []),
      ...(plan.e2e ? ["test:e2e:local"] : []),
    ];
    for (const command of commands) {
      console.log(`[browser-checks] pnpm ${command}`);
      await new Promise<void>((resolve, reject) => {
        const child = spawn("pnpm", [command], {
          env,
          stdio: ["ignore", "inherit", "inherit"],
          detached: true,
        });
        let interrupted = false;
        // Next.js・Playwright の子プロセスも終了させてからロックを解放する。
        const interrupt = () => {
          interrupted = true;
          if (child.pid) process.kill(-child.pid, "SIGTERM");
        };
        process.on("SIGINT", interrupt);
        process.on("SIGTERM", interrupt);
        child.once("error", reject);
        child.once("close", (code) => {
          process.off("SIGINT", interrupt);
          process.off("SIGTERM", interrupt);
          if (code === 0 && !interrupted) resolve();
          else reject(new Error(`pnpm ${command} が失敗または中断しました。検査を中止します。`));
        });
      });
    }
  } finally {
    fs.rmSync(lock, { recursive: true });
  }
}

try {
  const push = mode === "pre-push" ? pushPlan() : null;
  if (mode === "all" || push) {
    const plan = push ? push.plan : createBrowserCheckPlan(root, [], true);
    console.log(JSON.stringify(plan, null, 2));
    await runChecks(plan);
    if (push) assertCheckout(push.head);
    console.log(
      plan.storybook.mode === "none" && !plan.e2e
        ? "[browser-checks] 対象のブラウザ検査はありません。"
        : "[browser-checks] 検査が通りました。",
    );
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
