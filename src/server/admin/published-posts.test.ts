import type { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";
import { expect, it, vi } from "vitest";
import { removePublishedPostWithSupabase } from "./published-posts";

function form(type = "review") {
  const data = new FormData();
  data.set("id", "00000000-0000-4000-8000-000000000401");
  data.set("type", type);
  data.set("confirmed", "on");

  return data;
}

function client(fetch: typeof globalThis.fetch) {
  return createClient<Database>("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: crypto.randomUUID() },
    global: { fetch },
  });
}

it("未確認・不正ID・未知の投稿種別ではDBへ送信しない", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  const supabase = client(fetch);
  const unconfirmed = form();
  unconfirmed.delete("confirmed");
  const invalid = form();
  invalid.set("id", "invalid");

  for (const input of [unconfirmed, invalid, form("article")]) {
    expect(await removePublishedPostWithSupabase(input, supabase)).toEqual({
      ok: false,
      error: "invalid_body",
    });
  }

  expect(fetch).not.toHaveBeenCalled();
});

it.each(["review", "usage_report"])(
  "%sは公開状態だけを非公開化し、既存本文・メモ・添付を保持する",
  async (type) => {
    const requests: Request[] = [];

    const supabase = client(async (input, init) => {
      requests.push(new Request(input, init));

      return new Response(JSON.stringify([{ material_id: "material", author_user_id: "author" }]));
    });

    expect((await removePublishedPostWithSupabase(form(type), supabase)).ok).toBe(true);
    expect(requests).toHaveLength(1);
    const request = requests[0];
    expect(request.method).toBe("PATCH");
    expect(new URL(request.url).searchParams.get("status")).toBe("eq.published");
    expect(new URL(request.url).searchParams.get("id")).toBe(
      "eq.00000000-0000-4000-8000-000000000401",
    );
    expect(await request.text()).toBe(
      JSON.stringify(
        type === "review" ? { status: "hidden" } : { status: "declined", published_at: null },
      ),
    );
  },
);

it("すでに非公開または存在しない対象を成功扱いにしない", async () => {
  const supabase = client(async () => new Response("[]"));
  expect(await removePublishedPostWithSupabase(form(), supabase)).toEqual({
    ok: false,
    error: "conflict",
  });
});
