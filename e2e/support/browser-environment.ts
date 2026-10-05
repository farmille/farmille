import { accessSync, constants, statSync } from "node:fs";
import { isAbsolute } from "node:path";

export function localChromiumLaunchOptions() {
  const executablePath = process.env.FARMILLE_E2E_CHROMIUM_EXECUTABLE_PATH;
  const sandboxSetting = process.env.FARMILLE_E2E_CHROMIUM_NO_SANDBOX;
  if (sandboxSetting !== undefined && sandboxSetting !== "1") {
    throw new Error("FARMILLE_E2E_CHROMIUM_NO_SANDBOXは指定する場合に1を使ってください。");
  }
  if (executablePath === undefined) {
    if (sandboxSetting !== undefined) {
      throw new Error("sandboxの解除には明示的なローカルChromiumの実行パスが必要です。");
    }
    return undefined;
  }
  if (!isAbsolute(executablePath)) {
    throw new Error("FARMILLE_E2E_CHROMIUM_EXECUTABLE_PATHには絶対パスを指定してください。");
  }
  try {
    accessSync(executablePath, constants.X_OK);
    if (!statSync(executablePath).isFile()) throw new Error("not a file");
  } catch {
    throw new Error("指定したローカルChromiumのファイルを実行できません。");
  }
  if (sandboxSetting === "1" && (process.env.CI || process.getuid?.() !== 0)) {
    throw new Error("sandboxの解除はCI以外のローカルroot実行に限ります。");
  }
  return {
    executablePath,
    args: sandboxSetting === "1" ? ["--no-sandbox"] : undefined,
  };
}

export function localChromiumCdpEndpoint(): string | undefined {
  const endpoint = process.env.FARMILLE_TESTER_ARMY_CDP_ENDPOINT;
  if (endpoint === undefined) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error("FARMILLE_TESTER_ARMY_CDP_ENDPOINTにはローカルCDPのURLを指定してください。");
  }
  if (
    !["http:", "ws:"].includes(parsed.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("CDP接続は認証情報を含まないloopbackのhttpまたはws URLに限ります。");
  }
  return parsed.href;
}
