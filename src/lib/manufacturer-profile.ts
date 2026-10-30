import * as v from "valibot";

const optionalUrl = v.union([
  v.literal(""),
  v.pipe(v.string(), v.trim(), v.url(), v.regex(/^https?:\/\//), v.maxLength(4000)),
]);

export const ManufacturerProfileSchema = v.object({
  profileText: v.pipe(v.string(), v.maxLength(20000)),
  logoUrl: optionalUrl,
  websiteUrl: optionalUrl,
});

export type ManufacturerProfileContent = v.InferOutput<typeof ManufacturerProfileSchema>;

export const SaveManufacturerProfileSchema = v.object({
  content: ManufacturerProfileSchema,
  expectedVersion: v.nullable(v.pipe(v.string(), v.uuid())),
  submit: v.boolean(),
});
