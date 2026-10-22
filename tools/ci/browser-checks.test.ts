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
function setup(...args: string[]) {
  return spawnSync("bash", ["tools/dev/setup-hooks.sh", ...args], {
    cwd: repo,
    env,
    encoding: "utf8",
  });
}
function commands(): string[] {
  const log = path.join(repo, ".git/commands");
  return fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n") : [];
}

describe("Git pre-push integration", { timeout: 20_000 }, () => {
  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "farmille-hook-test-")));
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
    git("init", "--bare", remote);
    git("remote", "add", "origin", remote);
    for (const file of [
      "tools/dev/pre-push.sh",
      "tools/ci/browser-checks.ts",
      "tools/ci/selection.ts",
      "tools/dev/setup-hooks.sh",
    ]) {
      write(file, fs.readFileSync(path.join(source, file), "utf8"));
    }
    fs.symlinkSync(path.join(source, "node_modules"), path.join(repo, "node_modules"), "dir");
    write(".gitignore", "node_modules\n");
    write("package.json", '{"type":"module"}\n');
    write("pnpm-lock.yaml", "lockfileVersion: 9.0\n");
    git("add", ".");
    git("commit", "-m", "fixture");
    base = git("rev-parse", "HEAD");
    git("-c", "core.hooksPath=/dev/null", "push", "origin", "feature");
    fakePnpm();
    expect(setup().status).toBe(0);
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("does not execute checkout-controlled post-checkout hooks", () => {
    write(".githooks/post-checkout", "#!/bin/sh\nprintf compromised > .git/checkout-marker\n");
    fs.chmodSync(path.join(repo, ".githooks/post-checkout"), 0o755);
    git("add", ".githooks/post-checkout");
    git("commit", "-m", "untrusted checkout hook");
    const untrusted = git("rev-parse", "HEAD");
    git("checkout", "--detach", base);
    git("checkout", "--detach", untrusted);
    expect(fs.existsSync(path.join(repo, ".git/checkout-marker"))).toBe(false);
  });

  it.each(["tools/ci/browser-checks.ts", "tools/ci/selection.ts"])(
    "rejects changes to %s before executing them",
    (file) => {
      write(
        file,
        'import fs from "node:fs"; fs.writeFileSync(".git/runner-marker", "compromised");\n',
      );
      git("add", file);
      git("commit", "-m", "replace runner");
      const result = push("feature");
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("登録済み");
      expect(fs.existsSync(path.join(repo, ".git/runner-marker"))).toBe(false);
      expect(commands()).toEqual([]);
      expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(base);
    },
  );
  it("rejects a symlinked runner before it imports from an untrusted directory", () => {
    write(
      "untrusted/browser-checks.ts",
      fs.readFileSync(path.join(repo, "tools/ci/browser-checks.ts"), "utf8"),
    );
    write(
      "untrusted/selection.ts",
      'import fs from "node:fs"; fs.writeFileSync(".git/runner-marker", "compromised"); export function createBrowserCheckPlan() { throw new Error("untrusted"); }\n',
    );
    fs.unlinkSync(path.join(repo, "tools/ci/browser-checks.ts"));
    fs.symlinkSync(
      "../../untrusted/browser-checks.ts",
      path.join(repo, "tools/ci/browser-checks.ts"),
    );
    git("add", ".");
    git("commit", "-m", "redirect runner imports");
    const result = push("feature");
    expect(result.status).not.toBe(0);
    expect(fs.existsSync(path.join(repo, ".git/runner-marker"))).toBe(false);
    expect(commands()).toEqual([]);
  });
  it("rejects a package scope that redirects runner dependencies", () => {
    write(
      "tools/ci/package.json",
      '{"type":"module","name":"valibot","exports":"./untrusted.ts"}\n',
    );
    write(
      "tools/ci/untrusted.ts",
      'import fs from "node:fs"; fs.writeFileSync(".git/runner-marker", "compromised");\n',
    );
    git("add", ".");
    git("commit", "-m", "redirect package scope");
    const result = push("feature");
    expect(result.status).not.toBe(0);
    expect(fs.existsSync(path.join(repo, ".git/runner-marker"))).toBe(false);
    expect(commands()).toEqual([]);
  });
  it.each(["package.json", "pnpm-lock.yaml"])("rejects untrusted changes to %s", (file) => {
    commit(file);
    const result = push("feature");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("登録済み");
    expect(commands()).toEqual([]);
  });
  it("updates trust only when explicitly requested", () => {
    const hook = path.join(repo, ".git/farmille-hooks/pre-push");
    const original = fs.readFileSync(hook, "utf8");
    write("package.json", '{"type":"module","private":true}\n');
    git("add", "package.json");
    git("commit", "-m", "reviewed package change");
    expect(setup().status).not.toBe(0);
    expect(fs.readFileSync(hook, "utf8")).toBe(original);
    expect(setup("--trust-current").status).toBe(0);
    expect(push("feature").status).toBe(0);
    expect(commands()).toHaveLength(3);
  });
  it("migrates the legacy hook configuration", () => {
    write(
      ".githooks/pre-push",
      '#!/usr/bin/env sh\nset -eu\ncd "$(git rev-parse --show-toplevel)"\nexec node tools/ci/browser-checks.ts pre-push\n',
    );
    fs.chmodSync(path.join(repo, ".githooks/pre-push"), 0o755);
    git("config", "core.hooksPath", ".githooks");
    expect(setup().status).toBe(0);
    expect(git("config", "--get", "core.hooksPath")).toBe(path.join(repo, ".git/farmille-hooks"));
  });
  it("preserves unknown hooks in the managed directory", () => {
    write(".git/farmille-hooks/post-checkout", "#!/bin/sh\nexit 0\n");
    expect(setup("--trust-current").status).not.toBe(0);
    expect(fs.readFileSync(path.join(repo, ".git/farmille-hooks/post-checkout"), "utf8")).toContain(
      "exit 0",
    );
  });
  it("uses the common directory from a linked worktree with spaces", () => {
    const linked = path.join(root, "linked worktree");
    git("worktree", "add", "-b", "linked", linked);
    fs.symlinkSync(path.join(source, "node_modules"), path.join(linked, "node_modules"), "dir");
    expect(spawnSync("bash", ["tools/dev/setup-hooks.sh"], { cwd: linked, env }).status).toBe(0);
    fakePnpm(`printf '%s\\n' "$PWD" >> '${path.join(repo, ".git/checked-worktree")}'`);
    // linked worktree の .git はファイルなので、記録先は共通ディレクトリへ固定する。
    const binary = path.join(repo, ".git/bin/pnpm");
    fs.writeFileSync(
      binary,
      fs
        .readFileSync(binary, "utf8")
        .replace(">> .git/commands", `>> '${path.join(repo, ".git/commands")}'`),
    );
    const result = spawnSync("git", ["push", "origin", "linked"], {
      cwd: linked,
      env,
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
    expect(commands()).toHaveLength(3);
    expect(
      fs.readFileSync(path.join(repo, ".git/checked-worktree"), "utf8").trim().split("\n"),
    ).toEqual([linked, linked, linked]);
  });

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
    expect(git("config", "--get", "core.hooksPath")).toBe(path.join(repo, ".git/farmille-hooks"));
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
      await vi.waitFor(() => expect(commands()).toEqual(["build-storybook"]), { timeout: 10_000 });
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
