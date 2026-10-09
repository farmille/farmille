import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css } from "../../../styled-system/css";

export const guideStyle = css({ fontSize: "sm", lineHeight: "normal", color: "text.muted" });

export const softCardStyle = css(surfaceCardRecipe.raw({ tone: "soft", padding: "cozy" }), {
  borderColor: "primary.700/22",
});
