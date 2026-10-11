import { fn } from "storybook/test";
import { ownProfile } from "@/app/me/_components/story-fixtures";
export const getOwnProfile = fn<typeof import("@/server/queries/profiles").getOwnProfile>(
  async () => ({ ok: true, data: ownProfile }),
).mockName("getOwnProfile");
export const uploadOwnAvatar = fn<typeof import("@/server/queries/profiles").uploadOwnAvatar>(
  async () => ({ ok: true, data: "" }),
).mockName("uploadOwnAvatar");
