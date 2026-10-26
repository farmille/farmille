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

const policyCheck =
  "install --frozen-lockfile --lockfile-only --config.trust-lockfile=false --config.minimum-release-age=1440";

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

  it.each(["C", process.platform === "darwin" ? "en_US.UTF-8" : "C.UTF-8"])(
    "reports untrusted files and registers them under %s",
    (locale) => {
      env.LC_ALL = locale;
      git("update-ref", "refs/remotes/origin/main", base);
      fs.appendFileSync(path.join(repo, "tools/ci/selection.ts"), "\n");
      write("package.json", '{"type":"module","private":true}\n');
      git("add", "tools/ci/selection.ts", "package.json");
      git("commit", "-m", "change checks and package settings");
      const rejected = push("feature");
      expect(rejected.status).not.toBe(0);
      expect(rejected.stderr).toContain(
        "tools/ci/selection.ts・package.json が origin/main と異なり",
      );
      expect(commands()).toEqual([]);
      const registered = setup("--trust-current");
      expect(registered.stderr).toBe("");
      expect(registered.status).toBe(0);
      expect(push("feature").status).toBe(0);
    },
  );

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
    const trusted = path.join(repo, ".git/farmille-hooks/trusted");
    const original = fs.readFileSync(trusted, "utf8");
    write("package.json", '{"type":"module","private":true}\n');
    git("add", "package.json");
    git("commit", "-m", "reviewed package change");
    const result = setup();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("登録済み");
    expect(fs.readFileSync(trusted, "utf8")).toBe(original);
    expect(setup("--trust-current").status).toBe(0);
    expect(push("feature").status).toBe(0);
    expect(commands()).toHaveLength(3);
  });
  it("keeps earlier trusted sets when another set is registered", () => {
    write("pnpm-lock.yaml", "lockfileVersion: 9.0\n# feature\n");
    git("commit", "-am", "feature dependency");
    expect(setup("--trust-current").status).toBe(0);
    git("checkout", "-b", "other", base);
    write("pnpm-lock.yaml", "lockfileVersion: 9.0\n# other\n");
    git("commit", "-am", "other dependency");
    expect(setup("--trust-current").status).toBe(0);
    expect(push("other").status).toBe(0);
    git("checkout", "feature");
    const result = push("feature");
    expect(result.status, result.stderr).toBe(0);
  });
  it("passes files identical to origin/main without registration and rejects others", () => {
    const trusted = path.join(repo, ".git/farmille-hooks/trusted");
    const original = fs.readFileSync(trusted, "utf8");
    write("pnpm-lock.yaml", "lockfileVersion: 9.0\n# main\n");
    git("commit", "-am", "main dependency");
    git("update-ref", "refs/remotes/origin/main", git("rev-parse", "HEAD"));
    const merged = commit("README.md");
    const result = push("feature");
    expect(result.status, result.stderr).toBe(0);
    expect(fs.readFileSync(trusted, "utf8")).toBe(original);
    expect(commands()).toHaveLength(3);

    fs.appendFileSync(path.join(repo, "tools/ci/selection.ts"), "\n");
    git("commit", "-am", "unreviewed check change");
    const rejected = push("feature");
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain("tools/ci/selection.ts が origin/main と異なり、登録済み");
    expect(commands()).toHaveLength(3);
    expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(merged);
  });
  it("passes dependency-only changes that pnpm's supply-chain policy accepts", () => {
    const trusted = path.join(repo, ".git/farmille-hooks/trusted");
    const original = fs.readFileSync(trusted, "utf8");
    git("update-ref", "refs/remotes/origin/main", base);
    write("package.json", '{"type":"module","dependencies":{"pdfjs-dist":"4.10.38"}}\n');
    write(
      "pnpm-lock.yaml",
      [
        "lockfileVersion: 9.0",
        "importers:",
        "  .:",
        "    dependencies:",
        "      resolution:",
        "        specifier: 1.0.0",
        "        version: 1.0.0",
        "packages:",
        "  pdfjs-dist@4.10.38:",
        "    resolution: {integrity: sha512-pdfjs}",
        "    peerDependencies:",
        "      resolution: ^1.0.0",
        "  resolution@1.0.0:",
        "    resolution: {integrity: sha512-resolution}",
        "",
      ].join("\n"),
    );
    git("commit", "-am", "add dependency");
    const head = git("rev-parse", "HEAD");
    const result = push("feature");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("pnpm の supply-chain の方針の検査に通りました");
    expect(commands()).toEqual([
      policyCheck,
      "build-storybook",
      "test:storybook:responsive",
      "test:e2e:local",
    ]);
    expect(fs.readFileSync(trusted, "utf8")).toBe(original);
    expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(head);
  });
  it("rejects dependency-only changes that pnpm's supply-chain policy rejects", () => {
    git("update-ref", "refs/remotes/origin/main", base);
    fakePnpm('[ "$1" != install ] || { echo ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION; exit 1; }');
    write("pnpm-lock.yaml", "lockfileVersion: 9.0\n# fresh release\n");
    git("commit", "-am", "fresh dependency");
    const result = push("feature");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION");
    expect(result.stderr).toContain("方針の検査に通りません");
    expect(commands()).toEqual([policyCheck]);
    expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(base);
  });
  it.each([
    ["pnpm-workspace.yaml", "minimumReleaseAge: 0\n", "pnpm-workspace.yaml"],
    [".npmrc", "registry=https://registry.example.test/\n", ".npmrc"],
    [".pnpmfile.cjs", "module.exports = { hooks: {} };\n", ".pnpmfile.cjs"],
    [".pnpmfile.mjs", "export const hooks = {};\n", ".pnpmfile.mjs"],
    [
      "package.json",
      '{"type":"module","scripts":{"test:e2e:local":"true"},"dependencies":{"pdfjs-dist":"4.10.38"}}\n',
      "package.json",
    ],
    [
      "package.json",
      '{"type":"module","dependencies":{"valibot":"link:./untrusted"}}\n',
      "registry 以外",
    ],
    [
      "pnpm-lock.yaml",
      "lockfileVersion: 9.0\npackages:\n  x@1.0.0:\n    resolution: {integrity: sha512-x, tarball: https://example.test/x.tgz}\n",
      "registry 以外",
    ],
    [
      "pnpm-lock.yaml",
      "lockfileVersion: 9.0\npackages:\n  x@1.0.0:\n    engines: {node: '>=18'}\n",
      "integrity の無い",
    ],
    [
      "pnpm-lock.yaml",
      "lockfileVersion: 9.0\npackages:\n  x@1.0.0:\n    resolution: {integrity: null}\n",
      "integrity の無い",
    ],
    [
      "pnpm-lock.yaml",
      "lockfileVersion: 9.0\npackages:\n    x@1.0.0:\n        resolution: {tarball: https://example.test/x.tgz}\n",
      "registry 以外",
    ],
    [
      "pnpm-lock.yaml",
      "lockfileVersion: 9.0\npatchedDependencies:\n  minimatch@3.1.5: changed\n",
      "パッチの変更",
    ],
  ])("requires registration when a dependency change also touches %s", (file, content, message) => {
    git("update-ref", "refs/remotes/origin/main", base);
    write("pnpm-lock.yaml", "lockfileVersion: 9.0\n# dependency change\n");
    write(file, content);
    git("add", ".");
    git("commit", "-m", "dependency change with policy input");
    const result = push("feature");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(message);
    expect(result.stderr).toContain("登録済み");
    expect(commands()).toEqual([]);
    expect(git("--git-dir", remote, "rev-parse", "refs/heads/feature")).toBe(base);
  });
  it.each([
    ["pnpm-workspace.yaml", "scriptShell: /usr/bin/true\n"],
    [".npmrc", "registry=https://registry.example.test/\n"],
    [".pnpmfile.cjs", "module.exports = { hooks: {} };\n"],
  ])(
    "requires registration for %s even when the other files match origin/main",
    (file, content) => {
      git("update-ref", "refs/remotes/origin/main", base);
      write(file, content);
      git("add", file);
      git("commit", "-m", "change pnpm settings");
      const rejected = push("feature");
      expect(rejected.status).not.toBe(0);
      expect(rejected.stderr).toContain(`${file} が origin/main と異なり、登録済み`);
      expect(commands()).toEqual([]);
      expect(setup("--trust-current").status).toBe(0);
      expect(push("feature").status).toBe(0);

      fs.appendFileSync(path.join(repo, file), "# changed after registration\n");
      git("commit", "-am", "change pnpm settings again");
      const changed = push("feature");
      expect(changed.status).not.toBe(0);
      expect(changed.stderr).toContain(`${file} が origin/main と異なり、登録済み`);
    },
  );
  it("keeps only the 20 most recently registered sets", () => {
    const trusted = path.join(repo, ".git/farmille-hooks/trusted");
    const lines = () => fs.readFileSync(trusted, "utf8").trim().split("\n");
    const fixture = lines()[0];
    fs.appendFileSync(
      trusted,
      Array.from({ length: 19 }, (_, index) => `stale ${index}\n`).join(""),
    );
    write("pnpm-lock.yaml", "lockfileVersion: 9.0\n# reviewed\n");
    git("commit", "-am", "reviewed dependency");
    expect(setup("--trust-current").status).toBe(0);
    const reviewed = lines()[19];
    git("checkout", "-b", "old", base);
    const evicted = push("old");
    expect(evicted.status).not.toBe(0);
    expect(evicted.stderr).toContain("登録済み");

    expect(setup("--trust-current").status).toBe(0);
    git("checkout", "feature");
    expect(setup("--trust-current").status).toBe(0);
    expect(lines()).toHaveLength(20);
    expect(lines()[0]).toBe("stale 1");
    expect(lines().slice(-2)).toEqual([fixture, reviewed]);
  });
  it("migrates a hook with embedded hashes only when trust is requested", () => {
    fs.writeFileSync(
      path.join(repo, ".git/farmille-hooks/pre-push"),
      "#!/usr/bin/env sh\n# Farmille managed pre-push v1\nverify_hash 'old' 'package.json'\n",
    );
    fs.rmSync(path.join(repo, ".git/farmille-hooks/trusted"));
    expect(setup().status).not.toBe(0);
    expect(setup("--trust-current").status).toBe(0);
    commit("README.md");
    const result = push("feature");
    expect(result.status, result.stderr).toBe(0);
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
  it("runs every check for a new branch without a known main", () => {
    commit("README.md");
    expect(push("HEAD:refs/heads/new").status).toBe(0);
    expect(commands()).toHaveLength(3);
  });
  it("selects checks from main for the first push of a branch", () => {
    git("update-ref", "refs/remotes/origin/main", base);
    commit("README.md");
    const result = push("HEAD:refs/heads/new");
    expect(result.status, result.stderr).toBe(0);
    expect(commands()).toEqual([]);
  });
  it("keeps Storybook and skips E2E for CSS on a new branch", () => {
    git("update-ref", "refs/remotes/origin/main", base);
    commit("src/app/globals.css");
    expect(push("HEAD:refs/heads/new").status).toBe(0);
    expect(commands()).toEqual(["build-storybook", "test:storybook:responsive"]);
  });
  it("uses the merge base when main has unrelated changes", () => {
    git("checkout", "-b", "main");
    const main = commit("package.json");
    git("update-ref", "refs/remotes/origin/main", main);
    git("checkout", "feature");
    commit("README.md");
    expect(push("HEAD:refs/heads/new").status).toBe(0);
    expect(commands()).toEqual([]);
  });
  it("skips browser checks for reviewed hook-only updates", () => {
    fs.appendFileSync(path.join(repo, "tools/ci/selection.ts"), "\n");
    git("add", "tools/ci/selection.ts");
    git("commit", "-m", "hook-only change");
    expect(setup("--trust-current").status).toBe(0);
    expect(push("feature").status).toBe(0);
    expect(commands()).toEqual([]);
  });
  it("uses the outgoing diff for main updates", () => {
    git("-c", "core.hooksPath=/dev/null", "push", "origin", "HEAD:main");
    commit("README.md");
    expect(push("HEAD:main").status).toBe(0);
    expect(commands()).toEqual([]);
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
