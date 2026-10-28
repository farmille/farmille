import { describe, expect, it } from "vitest";

import { fail, succeed } from "@/server/result";

import {
  loadRegisteredDetails,
  validateRegisteredDetails,
  type RegisteredDetailsStore,
} from "./registered-details";

const valid = {
  familyName: " 山田 ",
  givenName: "花子",
  phone: "０９０－１２３４－５６７８",
  postalCode: "310-0011",
  prefectureCode: "8",
  cityStreet: "水戸市三の丸1-2-3",
  buildingName: "",
};

describe("登録情報の入力の検証", () => {
  it("登録時と同じ規則で整え、郵便番号は7桁、電話番号は数字だけにする", () => {
    expect(validateRegisteredDetails(valid)).toEqual({
      ok: true,
      input: {
        familyName: "山田",
        givenName: "花子",
        phone: "09012345678",
        postalCode: "3100011",
        prefectureCode: 8,
        cityStreet: "水戸市三の丸1-2-3",
        buildingName: "",
      },
    });
  });

  it("電話番号と建物名・部屋番号は空のままでよい", () => {
    const result = validateRegisteredDetails({ ...valid, phone: "", buildingName: "" });
    expect(result.ok).toBe(true);
  });

  it("空欄・形式・文字数の誤りを欄ごとに返す", () => {
    expect(
      validateRegisteredDetails({
        familyName: "　",
        givenName: "名".repeat(81),
        phone: "123",
        postalCode: "abc",
        prefectureCode: "",
        cityStreet: "",
        buildingName: "建".repeat(201),
      }),
    ).toEqual({
      ok: false,
      fieldErrors: {
        familyName: "姓を入力してください。",
        givenName: "名は80文字以内で入力してください。",
        phone: "電話番号を正しく入力してください。",
        postalCode: "郵便番号を7桁で入力してください。",
        prefectureCode: "都道府県を選択してください。",
        cityStreet: "市区町村・番地を入力してください。",
        buildingName: "200文字以内で入力してください。",
      },
    });
  });

  it("欄が送られてこなければ、その欄のエラーにする", () => {
    const result = validateRegisteredDetails({ ...valid, prefectureCode: null });
    expect(result).toEqual({
      ok: false,
      fieldErrors: { prefectureCode: "都道府県を選択してください。" },
    });
  });
});

describe("登録情報の読み取り", () => {
  const account = { userId: "self", email: "farmer@example.test" };
  const stored = {
    familyName: "山田",
    givenName: "花子",
    phone: "",
    postalCode: "3100011",
    prefectureCode: 8,
    cityStreet: "水戸市三の丸1-2-3",
    buildingName: "",
  };

  function store(found: Awaited<ReturnType<RegisteredDetailsStore["find"]>>) {
    const reads: string[] = [];
    const value: RegisteredDetailsStore = {
      async find(userId) {
        reads.push(userId);
        return found;
      },
      async save() {
        return succeed(null);
      },
    };
    return { value, reads };
  }

  it("本人の登録情報に、Auth サーバーで確かめたメールアドレスを添える", async () => {
    const { value, reads } = store(succeed(stored));
    expect(await loadRegisteredDetails(account, value)).toEqual(
      succeed({ email: "farmer@example.test", ...stored }),
    );
    expect(reads).toEqual(["self"]);
  });

  it("退会済みなどでプロフィールが無ければ not_found を返す", async () => {
    expect(await loadRegisteredDetails(account, store(succeed(null)).value)).toEqual(
      fail("not_found"),
    );
  });

  it("取得の失敗はそのまま返す", async () => {
    expect(await loadRegisteredDetails(account, store(fail("internal")).value)).toEqual(
      fail("internal"),
    );
  });
});
