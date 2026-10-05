export type E2eAdminAccount = {
  email: string;
  password: string;
};

export const E2E_ADMIN_ACCOUNTS = {
  sellerNewApproval: {
    email: "e2e-admin-seller-new@farmille.local",
    password: "Farmille-E2E-Admin-Seller-New-2026!",
  },
  screenInventory: {
    email: "e2e-admin-screens@farmille.local",
    password: "Farmille-E2E-Admin-Screens-2026!",
  },
  sellerApproval: {
    email: "e2e-admin-seller@farmille.local",
    password: "Farmille-E2E-Admin-Seller-2026!",
  },
  moderation: {
    email: "e2e-admin-moderation@farmille.local",
    password: "Farmille-E2E-Admin-Moderation-2026!",
  },
  publishedPostModeration: {
    email: "e2e-admin-published-posts@farmille.local",
    password: "Farmille-E2E-Admin-Published-Posts-2026!",
  },
  materialGovernance: {
    email: "e2e-admin-materials@farmille.local",
    password: "Farmille-E2E-Admin-Materials-2026!",
  },
  notFoundVisibility: {
    email: "e2e-admin-not-found@farmille.local",
    password: "Farmille-E2E-Admin-Not-Found-2026!",
  },
} as const satisfies Record<string, E2eAdminAccount>;

export const ALL_E2E_ADMIN_ACCOUNTS = Object.values(E2E_ADMIN_ACCOUNTS);
