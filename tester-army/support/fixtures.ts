import { test } from "@e2e-dev/web";
import {
  createGeneralUser,
  createApprovedSeller,
  createMaterial,
  cleanupSellerByLoginId,
  deleteAuthUsersByEmail,
  deleteMaterial,
  type GeneralUser,
  type Material,
  type SellerAccount,
} from "../../e2e/support/test-data";

export const memberTest = test.extend<{ member: GeneralUser }>({
  member: async (_fixtures, provide) => {
    const member = await createGeneralUser("army-member");
    try {
      await provide(member);
    } finally {
      await deleteAuthUsersByEmail(member.email);
    }
  },
});

export const materialTest = memberTest.extend<{ material: Material; secondMaterial: Material }>({
  material: async (_fixtures, provide) => {
    const material = await createMaterial("army-material");
    try {
      await provide(material);
    } finally {
      await deleteMaterial(material.id);
    }
  },
  secondMaterial: async (_fixtures, provide) => {
    const material = await createMaterial("army-second");
    try {
      await provide(material);
    } finally {
      await deleteMaterial(material.id);
    }
  },
});

export const sellerTest = test.extend<{ seller: SellerAccount }>({
  seller: async (_fixtures, provide) => {
    const seller = await createApprovedSeller("army-seller");
    try {
      await provide(seller);
    } finally {
      await cleanupSellerByLoginId(seller.loginId);
    }
  },
});
