import { spawn } from "node:child_process";

const build = spawn("pnpm", ["build"], { stdio: "inherit" });
let activeProcess = build;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => activeProcess.kill(signal));
}

build.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
build.on("exit", (code) => {
  if (code !== 0) {
    process.exitCode = code ?? 1;
    return;
  }
  activeProcess = spawn("pnpm", ["start", "--port", "3007"], { stdio: "inherit" });
  activeProcess.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  activeProcess.on("exit", (exitCode) => {
    process.exitCode = exitCode ?? 1;
  });
});
