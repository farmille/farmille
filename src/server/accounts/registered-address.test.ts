import { describe, expect, it } from "vitest";

import { fail, succeed } from "@/server/result";

import {
  loadRegisteredAddress,
  loadRegisteredContact,
  saveRegisteredContact,
  validateRegisteredContact,
  type RegisteredAddress,
  type RegisteredAddressStore,
  type RegisteredContact,
  type RegisteredContactInput,
  type RegisteredContactStore,
} from "./registered-address";

function memoryStore(rows: Record<string, RegisteredAddress>) {
  const reads: string[] = [];
  const store: RegisteredAddressStore = {
    async findByUserId(userId) {
      reads.push(userId);
      return succeed(rows[userId] ?? null);
    },
  };
  return { store, reads };
}

const rows = {
  self: { prefectureCode: 8 },
  other: { prefectureCode: 13 },
};

describe("loadRegisteredAddress", () => {
  it("セッションの本人の都道府県だけを返す", async () => {
    const { store, reads } = memoryStore(rows);

    expect(await loadRegisteredAddress(succeed({ userId: "self" }), store)).toEqual({
      ok: true,
      data: { prefectureCode: 8 },
    });
    expect(reads).toEqual(["self"]);
  });

  it("未ログインでは読みに行かずに失敗を返す", async () => {
    const { store, reads } = memoryStore(rows);

    expect(await loadRegisteredAddress(fail("unauthorized"), store)).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(reads).toEqual([]);
  });

  it("プロフィールが無ければ not_found を返す", async () => {
    const { store } = memoryStore(rows);

    expect(await loadRegisteredAddress(succeed({ userId: "missing" }), store)).toEqual({
      ok: false,
      error: "not_found",
    });
  });

  it("読み取りの失敗はそのまま返す", async () => {
    const store: RegisteredAddressStore = { findByUserId: async () => fail("internal") };

    expect(await loadRegisteredAddress(succeed({ userId: "self" }), store)).toEqual({
      ok: false,
      error: "internal",
    });
  });
});

function contactStore(rows: Record<string, RegisteredContact>) {
  const reads: string[] = [];
  const saves: { userId: string; input: RegisteredContactInput }[] = [];
  const store: RegisteredContactStore = {
    async findByUserId(userId) {
      reads.push(userId);
      return succeed(rows[userId] ?? null);
    },
    async save(userId, input) {
      saves.push({ userId, input });
      return userId in rows ? succeed(null) : fail("not_found");
    },
  };
  return { store, reads, saves };
}

const contactRows = {
  self: { prefectureCode: 8, contact: null },
  other: {
    prefectureCode: 13,
    contact: {
      family_name: "佐藤",
      given_name: "花子",
      phone: null,
      postal_code: "1000001",
      city_street: "千代田区千代田1-1",
      building_name: null,
    },
  },
} satisfies Record<string, RegisteredContact>;

const validContactRaw = {
  familyName: " 山田 ",
  givenName: "太郎",
  phone: "090-1234-5678",
  postalCode: "310-0011",
  prefectureCode: "8",
  cityStreet: "水戸市三の丸1-1",
  buildingName: "",
};

describe("validateRegisteredContact", () => {
  it("会員登録と同じ形に整える", () => {
    expect(validateRegisteredContact(validContactRaw)).toEqual({
      ok: true,
      input: {
        familyName: "山田",
        givenName: "太郎",
        phone: "09012345678",
        postalCode: "3100011",
        prefectureCode: 8,
        cityStreet: "水戸市三の丸1-1",
        buildingName: "",
      },
    });
  });

  it("誤りを欄ごとに返す", () => {
    expect(
      validateRegisteredContact({
        ...validContactRaw,
        postalCode: "12",
        prefectureCode: "48",
        cityStreet: " ",
      }),
    ).toEqual({
      ok: false,
      fieldErrors: {
        postalCode: "郵便番号を7桁で入力してください。",
        prefectureCode: "都道府県を選択してください。",
        cityStreet: "市区町村・番地を入力してください。",
      },
    });
  });
});

describe("loadRegisteredContact", () => {
  it("連絡先の行が無い本人も都道府県と空の連絡先で返す", async () => {
    const { store, reads } = contactStore(contactRows);

    expect(await loadRegisteredContact(succeed({ userId: "self" }), store)).toEqual({
      ok: true,
      data: { prefectureCode: 8, contact: null },
    });
    expect(reads).toEqual(["self"]);
  });

  it("未ログインでは読みに行かない", async () => {
    const { store, reads } = contactStore(contactRows);

    expect(await loadRegisteredContact(fail("unauthorized"), store)).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(reads).toEqual([]);
  });

  it("プロフィールが無ければ not_found を返す", async () => {
    const { store } = contactStore(contactRows);

    expect(await loadRegisteredContact(succeed({ userId: "missing" }), store)).toEqual({
      ok: false,
      error: "not_found",
    });
  });
});

describe("saveRegisteredContact", () => {
  const validation = validateRegisteredContact(validContactRaw);
  if (!validation.ok) throw new Error("見本の入力が検証を通りません。");
  const input = validation.input;

  it("セッションの本人の id だけで保存する", async () => {
    const { store, saves } = contactStore(contactRows);

    expect(await saveRegisteredContact(succeed({ userId: "self" }), input, store)).toEqual({
      ok: true,
      data: null,
    });
    expect(saves).toEqual([{ userId: "self", input }]);
  });

  it("未ログイン・権限なしでは保存しない", async () => {
    const { store, saves } = contactStore(contactRows);

    expect(await saveRegisteredContact(fail("unauthorized"), input, store)).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(await saveRegisteredContact(fail("forbidden"), input, store)).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(saves).toEqual([]);
  });

  it("保存の失敗はそのまま返す", async () => {
    const { store } = contactStore(contactRows);

    expect(await saveRegisteredContact(succeed({ userId: "missing" }), input, store)).toEqual({
      ok: false,
      error: "not_found",
    });
  });
});
