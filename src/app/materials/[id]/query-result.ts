import { errorMessageJa } from "@/server/errors";
import type { Result } from "@/server/result";

export function unwrapQueryResult<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  return result.data;
}
