import { describe, expect, it } from "vitest";

import { postAuthor, publicProfileLabel } from "./public-profile-label";

const member = {
  user_id: "00000000-0000-4000-8000-000000000901",
  withdrawn: false,
  handle: "北のトマト農家",
  avatar_url: "https://example.test/avatar.png",
  standpoint: "farmer",
  prefecture_code: 1,
};

describe("投稿者の表示", () => {
  it("在籍中の会員は、ニックネーム・アイコン・肩書き・プロフィールへのリンクを出す", () => {
    expect(postAuthor(member)).toEqual({
      name: "北のトマト農家",
      avatarUrl: "https://example.test/avatar.png",
      label: "生産者 ・ 北海道",
      href: "/users/00000000-0000-4000-8000-000000000901",
    });
  });

  it("退会済みの会員は「退会済みユーザー」にし、アイコン・肩書き・リンクを出さない", () => {
    expect(
      postAuthor({
        user_id: member.user_id,
        withdrawn: true,
        handle: null,
        avatar_url: null,
        standpoint: null,
        prefecture_code: null,
      }),
    ).toEqual({ name: "退会済みユーザー", avatarUrl: null, label: "", href: null });
  });

  it("取得しなかった項目は肩書きとアイコンに出さない", () => {
    expect(
      postAuthor({
        user_id: member.user_id,
        withdrawn: false,
        handle: "北のトマト農家",
        standpoint: "farmer",
      }),
    ).toEqual({
      name: "北のトマト農家",
      avatarUrl: null,
      label: "生産者",
      href: "/users/00000000-0000-4000-8000-000000000901",
    });
  });

  it("結び付きの欠落や、在籍中なのにニックネームの無い行は null を返す", () => {
    expect(postAuthor(null)).toBeNull();
    expect(postAuthor({ ...member, user_id: null })).toBeNull();
    expect(postAuthor({ ...member, withdrawn: null })).toBeNull();
    expect(postAuthor({ ...member, handle: null })).toBeNull();
  });

  it("肩書きは立場と都道府県を中黒でつなぐ", () => {
    expect(publicProfileLabel({ standpoint: "farmer", prefecture_code: 13 })).toBe(
      "生産者 ・ 東京都",
    );
    expect(publicProfileLabel(null)).toBe("");
  });
});
