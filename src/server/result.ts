import * as v from "valibot";

import { ErrorCodeSchema, type ErrorCode } from "@/server/errors";

function successSchema<TSchema extends v.GenericSchema>(dataSchema: TSchema) {
  return v.strictObject({ ok: v.literal(true), data: dataSchema });
}

export const FailureSchema = v.strictObject({
  ok: v.literal(false),
  error: ErrorCodeSchema,
});
type Failure = v.InferOutput<typeof FailureSchema>;

export function resultSchema<TSchema extends v.GenericSchema>(dataSchema: TSchema) {
  return v.variant("ok", [successSchema(dataSchema), FailureSchema]);
}

type Success<T> = v.InferOutput<ReturnType<typeof successSchema<v.GenericSchema<T>>>>;
export type Result<T> = v.InferOutput<ReturnType<typeof resultSchema<v.GenericSchema<T>>>>;

const errorStatus = {
  passkey_failed: 400,
  passkey_unavailable: 503,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  invalid_body: 400,
  conflict: 409,
  active_report_exists: 409,
  aal2_required: 403,
  internal: 500,
  handle_taken: 409,
  email_unavailable: 409,
  invalid_credentials: 401,
  seller_invalid_credentials: 401,
  weak_password: 400,
  rate_limited: 429,
  expired_link: 400,
  already_reported: 409,
  login_id_taken: 409,
  invalid_invite_code: 400,
  pdf_reading_limit: 429,
  captcha_failed: 400,
  pdf_invalid: 400,
  pdf_too_large: 413,
  pdf_too_many_pages: 422,
  pdf_reading_failed: 502,
  pdf_reading_no_match: 422,
  pdf_reading_incomplete: 422,
  pdf_reading_material_changed: 409,
  pdf_reading_unrecorded: 500,
} satisfies Record<ErrorCode, number>;

export function succeed<T>(data: T): Success<T> {
  return { ok: true, data };
}

export function fail(code: ErrorCode): Failure {
  return { ok: false, error: code };
}

export function toResponse<TSchema extends v.GenericSchema>(
  result: Result<v.InferOutput<TSchema>>,
  dataSchema: TSchema,
  status?: number,
): Response {
  const parsed = v.safeParse(resultSchema(dataSchema), result);
  if (!parsed.success) {
    throw new Error(`HTTPレスポンスが Result 契約に一致しません：${v.summarize(parsed.issues)}`);
  }
  const responseStatus = status ?? (result.ok ? 200 : errorStatus[result.error]);

  return Response.json(parsed.output, { status: responseStatus });
}
