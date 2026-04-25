"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { ReviewForm } from "./review-form";
import { FarmerProfileGateForm } from "./farmer-profile-gate-form";
import type {
  CategoryL1,
  CategoryL2,
  Crop,
} from "@/app/onboarding/farmer/_components/crop-picker";

type Props = {
  productId: string;
  initialProfileComplete: boolean;
  crops: Crop[];
  categoriesL1: CategoryL1[];
  categoriesL2: CategoryL2[];
};

export function ReviewWithProfileGate({
  productId,
  initialProfileComplete,
  crops,
  categoriesL1,
  categoriesL2,
}: Props) {
  const [profileComplete, setProfileComplete] = useState(
    initialProfileComplete,
  );
  const gateShownLoggedRef = useRef(false);

  useEffect(() => {
    if (!profileComplete && !gateShownLoggedRef.current) {
      gateShownLoggedRef.current = true;
      trackEvent({
        name: "profile_gate_shown",
        params: { product_id: productId },
      });
    }
  }, [profileComplete, productId]);

  if (profileComplete) {
    return <ReviewForm productId={productId} />;
  }

  return (
    <div className="rounded-md border border-border bg-card p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">
          まずはプロフィールを登録
        </h3>
        <p className="text-sm text-muted-foreground">
          レビュー投稿には、都道府県・市町村と栽培作目（1 件以上）の登録が必要です。
        </p>
      </div>
      <FarmerProfileGateForm
        crops={crops}
        categoriesL1={categoriesL1}
        categoriesL2={categoriesL2}
        onComplete={() => {
          trackEvent({
            name: "profile_gate_completed",
            params: { product_id: productId },
          });
          setProfileComplete(true);
        }}
      />
    </div>
  );
}
