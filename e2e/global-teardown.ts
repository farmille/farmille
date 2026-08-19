import { cleanupOwnedE2eData } from "./support/test-data";

export default async function globalTeardown(): Promise<void> {
  await cleanupOwnedE2eData();
}
