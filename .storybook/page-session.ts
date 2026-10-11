import { mocked } from "storybook/test";
import {
  authorizeAdmin,
  authorizeGeneralUser,
  authorizeSeller,
  getAccountType,
  getSessionUser,
  requireAdmin,
  requireGeneralUser,
  requireSeller,
  type AccountType,
} from "../src/server/auth";

const userId = "11111111-1111-4111-8111-111111111111";
const sellerId = "00000000-0000-4000-8000-000000000201";

export function preparePageSession(accountType: AccountType) {
  mocked(getSessionUser).mockResolvedValue({ userId, accountType, sellerId, aal: "aal2" });
  mocked(getAccountType).mockResolvedValue(accountType);
  mocked(requireGeneralUser).mockResolvedValue(
    accountType === "general" ? { ok: true, data: { userId } } : { ok: false, error: "forbidden" },
  );
  mocked(requireSeller).mockResolvedValue(
    accountType === "seller"
      ? { ok: true, data: { userId, sellerId } }
      : { ok: false, error: "forbidden" },
  );
  mocked(requireAdmin).mockResolvedValue(
    accountType === "admin" ? { ok: true, data: { userId } } : { ok: false, error: "forbidden" },
  );
  mocked(authorizeGeneralUser).mockReturnValue(
    accountType === "general" ? { ok: true, data: { userId } } : { ok: false, error: "forbidden" },
  );
  mocked(authorizeSeller).mockReturnValue(
    accountType === "seller"
      ? { ok: true, data: { userId, sellerId } }
      : { ok: false, error: "forbidden" },
  );
  mocked(authorizeAdmin).mockReturnValue(
    accountType === "admin" ? { ok: true, data: { userId } } : { ok: false, error: "forbidden" },
  );
  return () => {
    mocked(getSessionUser).mockReset();
    mocked(getAccountType).mockReset();
    mocked(requireGeneralUser).mockReset();
    mocked(requireSeller).mockReset();
    mocked(requireAdmin).mockReset();
    mocked(authorizeGeneralUser).mockReset();
    mocked(authorizeSeller).mockReset();
    mocked(authorizeAdmin).mockReset();
  };
}
