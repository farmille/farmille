import * as v from "valibot";

const name = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100));
const link = v.pipe(v.string(), v.trim(), v.maxLength(2000), v.url(), v.regex(/^https?:\/\//));
export const ProfileDetailsInputSchema = v.object({
  handle: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(30)),
  bio: v.pipe(v.string(), v.trim(), v.maxLength(2000)),
  affiliations: v.pipe(v.array(name), v.maxLength(20)),
  cropIds: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.maxLength(50)),
  links: v.pipe(v.array(link), v.maxLength(10)),
});
export type ProfileDetailsInput = v.InferOutput<typeof ProfileDetailsInputSchema>;
