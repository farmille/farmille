import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import { ALL_E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import { cleanupOwnedE2eData } from "./support/test-data";

export default async function globalSetup(): Promise<void> {
  const repositoryRoot = resolve(__dirname, "../..");
  const createAdminScript = resolve(repositoryRoot, "tools/dev/create-local-admin.ts");

  await cleanupOwnedE2eData();

  for (const admin of ALL_E2E_ADMIN_ACCOUNTS) {
    execFileSync(process.execPath, [createAdminScript, admin.email, admin.password], {
      cwd: repositoryRoot,
      env: process.env,
      stdio: "pipe",
    });
  }
}
