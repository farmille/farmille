// @vitest-environment node
import { execFileSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const source = process.cwd();
let root: string;
let repo: string;
let remote: string;
let base: string;
let env: NodeJS.ProcessEnv;

function git(...args: string[]): string {
  return execFileSync("git", args, {
    cwd: repo,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
  fs.writeFileSync(path.join(repo, file), content);
}
function commit(file: string): string {
  write(file, "changed\n");
  git("add", file);
  git("commit", "-m", "test change");
  return git("rev-parse", "HEAD");
}
function fakePnpm(script = ""): void {
  write(".git/bin/pnpm", `#!/bin/sh\nprintf '%s\\n' "$*" >> .git/commands\n${script}\n`);
  fs.chmodSync(path.join(repo, ".git/bin/pnpm"), 0o755);
}
function push(...refs: string[]) {
  return spawnSync("git", ["push", "origin", ...refs], { cwd: repo, env, encoding: "utf8" });
}
function commands(): string[] {
  const log = path.join(repo, ".git/commands");
  return fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n") : [];
}

describe("Git pre-push integration", { timeout: 20_000 }, () => {
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "farmille-hook-test-"));
    repo = path.join(root, "repo");
    remote = path.join(root, "remote.git");
    fs.mkdirSync(repo);
    // 個人の Git 設定や、実際のブラウザ検査用ロックと独立して検証する。
    env = {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      TMPDIR: root,
      PATH: `${path.join(repo, ".git/bin")}:${path.dirname(process.execPath)}:${process.env.PATH}`,
    };
    git("init", "--initial-branch=feature");
    git("config", "user.name", "Hook test");
    git("config", "user.email", "hook@example.test");
    git("config", "commit.gpgSign", "false");
    git("config", "core.hooksPath", ".githooks");
    git("init", "--bare", remote);
    git("remote", "add", "origin", remote);
    for (const file of [
      ".githooks/pre-push",
      "tools/ci/browser-checks.ts",
      "tools/ci/selection.ts",
      "tools/dev/setup-hooks.sh",
    ]) {
      write(file, fs.readFileSync(path.join(source, file), "utf8"));
    }
    fs.chmodSync(path.join(repo, ".githooks/pre-push"), 0o755);
    fs.symlinkSync(path.join(source, "node_modules"), path.join(repo, "node_modules"), "dir");
    write(".gitignore", "node_modules\n");
    write("package.json", '{"type":"module"}\n');
    git("add", ".");
    git("commit", "-m", "fixture");
    base = git("rev-parse", "HEAD");
    git("-c", "core.hooksPath=/dev/null", "push", "origin", "feature");
    fakePnpm();
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("runs Storybook then E2E and publishes the checked commit", () => {
    const head = commit("src/components/Example.tsx");
    const result = push("feature");
    expect(result.status, result.stderr).toBe(0);
    expect(commands()).toEqual(["build-storybook", "test:storybook:responsive", "test:e2e:local"]);
    expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(head);
  });
  it("blocks publication when a responsive check fails and releases its lock", () => {
    commit("src/components/Example.tsx");
    fakePnpm('[ "$1" != "test:storybook:responsive" ]');
    const result = push("feature");
    expect(result.status).not.toBe(0);
    expect(commands()).toEqual(["build-storybook", "test:storybook:responsive"]);
    expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(base);
    expect(
      fs.existsSync(path.join(root, `farmille-browser-checks-${os.userInfo().username}.lock`)),
    ).toBe(false);
  });
  it("skips browser checks for documentation-only updates", () => {
    commit("README.md");
    expect(push("feature").status).toBe(0);
    expect(commands()).toEqual([]);
  });
  it("runs only E2E for E2E-only updates", () => {
    commit("e2e/search.spec.ts");
    expect(push("feature").status).toBe(0);
    expect(commands()).toEqual(["test:e2e:local"]);
  });
  it("runs every check for a new branch", () => {
    commit("README.md");
    expect(push("HEAD:refs/heads/new").status).toBe(0);
    expect(commands()).toHaveLength(3);
  });
  it("allows deletion with an unrelated dirty working tree", () => {
    write("scratch.txt", "unsaved");
    expect(push(":feature").status).toBe(0);
    expect(commands()).toEqual([]);
  });
  it("rejects uncommitted files before checking a commit", () => {
    commit("src/components/Example.tsx");
    write("scratch.txt", "unsaved");
    const result = push("feature");
    expect(result.stderr).toContain("未コミット");
    expect(result.status).not.toBe(0);
    expect(commands()).toEqual([]);
  });
  it("rejects another branch's commit in a multiple-ref push", () => {
    git("branch", "other", base);
    commit("README.md");
    const result = push("feature", "other");
    expect(result.stderr).toContain("現在の HEAD と異なります");
    expect(result.status).not.toBe(0);
    expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(base);
  });
  it("checks multiple refs and an annotated tag pointing to HEAD once", () => {
    commit("src/components/Example.tsx");
    git("tag", "-a", "release-test", "-m", "test tag");
    expect(push("feature", "refs/tags/release-test").status).toBe(0);
    expect(commands()).toHaveLength(3);
  });
  it("blocks a second check while the shared lock exists without deleting it", () => {
    commit("src/components/Example.tsx");
    const lock = path.join(root, `farmille-browser-checks-${os.userInfo().username}.lock`);
    fs.mkdirSync(lock);
    const result = push("feature");
    expect(result.stderr).toContain("ロックを取得できません");
    expect(result.status).not.toBe(0);
    expect(fs.existsSync(lock)).toBe(true);
    expect(commands()).toEqual([]);
  });
  it("rejects working-tree edits made while checks run", () => {
    commit("src/components/Example.tsx");
    fakePnpm("printf edited > scratch.txt");
    expect(push("feature").status).not.toBe(0);
    expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(base);
  });
  it("registers hooks idempotently and preserves another hook configuration", () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      expect(spawnSync("bash", ["tools/dev/setup-hooks.sh"], { cwd: repo, env }).status).toBe(0);
    }
    expect(git("config", "--get", "core.hooksPath")).toBe(".githooks");
    git("config", "core.hooksPath", ".custom-hooks");
    expect(spawnSync("bash", ["tools/dev/setup-hooks.sh"], { cwd: repo, env }).status).not.toBe(0);
    expect(git("config", "--get", "core.hooksPath")).toBe(".custom-hooks");
  });

  it("stops an interrupted check and releases its lock", async () => {
    fakePnpm("sleep 30 & wait");
    const child = spawn(process.execPath, ["tools/ci/browser-checks.ts", "all"], {
      cwd: repo,
      env,
      stdio: "ignore",
    });
    const closed = new Promise<number | null>((resolve) => child.once("close", resolve));
    try {
      await vi.waitFor(() => expect(commands()).toEqual(["build-storybook"]));
      child.kill("SIGTERM");
      expect(await closed).not.toBe(0);
      expect(
        fs.existsSync(path.join(root, `farmille-browser-checks-${os.userInfo().username}.lock`)),
      ).toBe(false);
      expect(commands()).toEqual(["build-storybook"]);
    } finally {
      child.kill("SIGTERM");
      await closed;
    }
  });
  it("rejects malformed hook input before running checks", () => {
    const result = spawnSync(process.execPath, ["tools/ci/browser-checks.ts", "pre-push"], {
      cwd: repo,
      env,
      input: "refs/heads/feature invalid\n",
      encoding: "utf8",
    });
    expect(result.status).not.toBe(0);
    expect(commands()).toEqual([]);
  });

  it("preserves executable hooks in the default hooks directory", () => {
    git("config", "--unset", "core.hooksPath");
    write(".git/hooks/pre-commit", "#!/bin/sh\nexit 0\n");
    fs.chmodSync(path.join(repo, ".git/hooks/pre-commit"), 0o755);
    const result = spawnSync("bash", ["tools/dev/setup-hooks.sh"], {
      cwd: repo,
      env,
      encoding: "utf8",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("既存 hook");
    expect(spawnSync("git", ["config", "--get", "core.hooksPath"], { cwd: repo, env }).status).toBe(
      1,
    );
  });
  it("requires CI checks and ignores inherited partial-test settings", () => {
    commit("src/components/Example.tsx");
    env.CI = "";
    env.PLAYWRIGHT_EXTERNAL_WEB_SERVER = "1";
    env.STORYBOOK_RESPONSIVE_SHARD = "1/3";
    env.STORYBOOK_RESPONSIVE_SELECTION = '{"mode":"none","reason":"test"}';
    fakePnpm(
      `[ "$CI" = "true" ] && [ -z "$PLAYWRIGHT_EXTERNAL_WEB_SERVER" ] && [ -z "$STORYBOOK_RESPONSIVE_SHARD" ] && [ "$STORYBOOK_RESPONSIVE_SELECTION" != '{"mode":"none","reason":"test"}' ]`,
    );
    const result = push("feature");
    expect(result.status, result.stderr).toBe(0);
    expect(commands()).toHaveLength(3);
  });
});
