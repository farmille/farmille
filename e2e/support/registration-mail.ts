import { expect } from "@playwright/test";
import * as v from "valibot";
const MailList = v.object({
  messages: v.array(
    v.object({
      ID: v.string(),
      Subject: v.string(),
      To: v.array(v.object({ Address: v.string() })),
    }),
  ),
});
const Mail = v.object({
  Text: v.string(),
  Subject: v.string(),
  From: v.object({ Address: v.string() }),
});

export async function registrationMail(email: string, subject: string, excludedId = "") {
  let id = "";
  await expect
    .poll(
      async () => {
        const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
        const data = v.parse(MailList, await response.json());
        id =
          data.messages.find(
            (mail) =>
              mail.ID !== excludedId &&
              mail.Subject === subject &&
              mail.To.some((to) => to.Address === email),
          )?.ID ?? "";
        return id;
      },
      { timeout: 20_000 },
    )
    .not.toBe("");
  const response = await fetch(`http://127.0.0.1:54324/api/v1/message/${id}`);
  return { id, ...v.parse(Mail, await response.json()) };
}

export function registrationLink(text: string): string {
  const link = text.match(/http:\/\/localhost:3007\/auth\/confirm\?[^\s<>]+/)?.[0];
  if (!link) throw new Error("認証メールに登録用リンクがありません。");
  return link.replaceAll("&amp;", "&");
}
