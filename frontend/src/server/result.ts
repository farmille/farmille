import type { ErrorCode } from "@/server/errors";

type Success<T> = {
  ok: true;
  data: T;
};

type Failure = {
  ok: false;
  error: ErrorCode;
};

export type Result<T> = Success<T> | Failure;

const errorStatus = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  invalid_body: 400,
  conflict: 409,
  aal2_required: 403,
  internal: 500,
} satisfies Record<ErrorCode, number>;

export function succeed<T>(data: T): Success<T> {
  return { ok: true, data };
}

export function fail(code: ErrorCode): Failure {
  return { ok: false, error: code };
}

export function toResponse<T>(result: Result<T>, status?: number): Response {
  const responseStatus = status ?? (result.ok ? 200 : errorStatus[result.error]);

  return Response.json(result, { status: responseStatus });
}
