export type E2eAdminAccount = {
  email: string;
  password: string;
};

export const E2E_ADMIN_ACCOUNTS = {
  sellerApproval: {
    email: "e2e-admin-seller@farmille.local",
    password: "Farmille-E2E-Admin-Seller-2026!",
  },
  moderation: {
    email: "e2e-admin-moderation@farmille.local",
    password: "Farmille-E2E-Admin-Moderation-2026!",
  },
} as const satisfies Record<string, E2eAdminAccount>;

export const ALL_E2E_ADMIN_ACCOUNTS = Object.values(E2E_ADMIN_ACCOUNTS);
