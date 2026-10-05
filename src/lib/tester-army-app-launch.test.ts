import { spawnSync } from "node:child_process";
import {
  closeSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { localApplicationEnvironment } from "../../tester-army/support/environment";

const fixtureRoots: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true });
});

function launch(buildExit: number, startExit: number) {
  const root = mkdtempSync(path.join(tmpdir(), "farmille-app-launch-"));
  fixtureRoots.push(root);
  mkdirSync(path.join(root, "scripts"));
  copyFileSync(
    path.resolve("scripts/start-tester-army-app.mjs"),
    path.join(root, "scripts/start-tester-army-app.mjs"),
  );
  const nextRoot = path.join(root, "node_modules/next");
  mkdirSync(path.join(nextRoot, "dist/bin"), { recursive: true });
  writeFileSync(path.join(nextRoot, "package.json"), JSON.stringify({ name: "next" }));
  writeFileSync(
    path.join(nextRoot, "dist/bin/next"),
    `process.stdout.write(JSON.stringify({
      args: process.argv.slice(2),
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL,
      openai: Boolean(process.env.OPENAI_API_KEY),
      gateway: Boolean(process.env.AI_GATEWAY_API_KEY),
      ci: Boolean(process.env.CI),
      pnpmHome: Boolean(process.env.PNPM_HOME)
    }) + "\\n");
    process.exitCode = process.argv[2] === "build" ? ${buildExit} : ${startExit};`,
  );
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable",
    SUPABASE_SECRET_KEY: "test-service-role",
    SMTP_URL: "smtp://127.0.0.1:54325",
    MAIL_FROM: "test@example.test",
    AUTH_EMAIL_HOOK_SECRET: "test-hook",
    OPENAI_API_KEY: "test-runner-openai",
    AI_GATEWAY_API_KEY: "test-runner-gateway",
    CI: "true",
    PNPM_HOME: "/test-runner-pnpm-home",
  })) {
    vi.stubEnv(key, value);
  }
  const stdoutPath = path.join(root, "stdout.log");
  const stderrPath = path.join(root, "stderr.log");
  const stdoutFd = openSync(stdoutPath, "w");
  const stderrFd = openSync(stderrPath, "w");
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/start-tester-army-app.mjs")],
    {
      cwd: root,
      env: { NODE_ENV: "production", PATH: "", ...localApplicationEnvironment() },
      stdio: ["ignore", stdoutFd, stderrFd],
      timeout: 5_000,
    },
  );
  closeSync(stdoutFd);
  closeSync(stderrFd);
  return {
    status: result.status,
    error: result.error,
    stdout: readFileSync(stdoutPath, "utf8"),
    stderr: readFileSync(stderrPath, "utf8"),
  };
}

describe("Tester Army application launch", () => {
  it("builds and starts with the filtered app environment and no package manager in PATH", () => {
    const result = launch(0, 0);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const common = {
      supabase: "http://127.0.0.1:54321",
      openai: false,
      gateway: false,
      ci: false,
      pnpmHome: false,
    };
    expect(result.stdout.trim().split("\n")).toEqual([
      JSON.stringify({ args: ["build"], ...common }),
      JSON.stringify({ args: ["start", "--port", "3007"], ...common }),
    ]);
  });

  it("preserves a build failure and does not start the application", () => {
    const result = launch(7, 0);
    expect(result.status).toBe(7);
    expect(result.stdout).toContain('"args":["build"]');
    expect(result.stdout).not.toContain('"start"');
  });

  it("preserves the application start failure", () => {
    const result = launch(0, 9);
    expect(result.status).toBe(9);
    expect(result.stdout).toContain('"args":["start","--port","3007"]');
  });
});
