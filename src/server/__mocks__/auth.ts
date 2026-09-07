import { fn } from "storybook/test";
import type { JwtPayload } from "@supabase/supabase-js";

import type {
  AccountType,
  AdminSession,
  GeneralSession,
  SellerSession,
  SessionUser,
} from "@/server/auth";
import { fail, type Result } from "@/server/result";

// Storybook 専用モック。実モジュールと同じ runtime export を揃える（欠けると
// 推移 import しているモジュールの評価が落ちる）。既定は「非ログイン」。
// ストーリー側で mocked(getSessionUser).mockResolvedValue(...) して上書きする。
// 注意：モッカーはこの内容を元モジュールの id（src/server/auth.ts）のまま配信する
// ため、runtime import は相対パスではなく必ず @ エイリアスで書く。
export const ACCOUNT_TYPES = ["general", "seller", "admin"] as const;

export const getSessionUser = fn(async (): Promise<SessionUser | null> => null).mockName(
  "getSessionUser",
);

export const getAccountType = fn(async (): Promise<AccountType | null> => null).mockName(
  "getAccountType",
);

export const toSessionUser = fn((_claims: JwtPayload): SessionUser | null => null).mockName(
  "toSessionUser",
);

export const authorizeGeneralUser = fn(
  (_user: SessionUser | null): Result<GeneralSession> => fail("unauthorized"),
).mockName("authorizeGeneralUser");

export const authorizeSeller = fn(
  (_user: SessionUser | null): Result<SellerSession> => fail("unauthorized"),
).mockName("authorizeSeller");

export const authorizeAdmin = fn(
  (_user: SessionUser | null): Result<AdminSession> => fail("unauthorized"),
).mockName("authorizeAdmin");

export const requireGeneralUser = fn(
  async (): Promise<Result<GeneralSession>> => fail("unauthorized"),
).mockName("requireGeneralUser");

export const requireSeller = fn(
  async (): Promise<Result<SellerSession>> => fail("unauthorized"),
).mockName("requireSeller");

export const requireAdmin = fn(
  async (): Promise<Result<AdminSession>> => fail("unauthorized"),
).mockName("requireAdmin");
