import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_API_KEY) {
  throw new Error("AI探索にはOPENAI_API_KEYまたはAI_GATEWAY_API_KEYが必要です。");
}
const cli = fileURLToPath(new URL("./cli/bin.js", import.meta.resolve("e2e")));
const runner = spawn(process.execPath, [cli, "run", ...process.argv.slice(2)], {
  env: { ...process.env, FARMILLE_TESTER_ARMY_AI: "1" },
  stdio: "inherit",
});
runner.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
runner.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => runner.kill(signal));
}
