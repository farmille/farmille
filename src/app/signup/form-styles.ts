import { inputRecipe } from "@/components/Input";
import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css } from "../../../styled-system/css";

export const fieldStyle = css({ mt: "5", minW: "0", _first: { mt: "0" } });

export const fieldLabelStyle = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  w: "full",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "bold",
});

export const guideStyle = css({ fontSize: "sm", lineHeight: "normal", color: "text.muted" });

export const fieldInputStyle = css(inputRecipe.raw(), {
  "&[aria-invalid=true]": { borderColor: "accent.danger" },
});

export const textLinkStyle = css({
  color: "primary.800",
  fontWeight: "semibold",
  textDecoration: "none",
});

export const softCardStyle = css(surfaceCardRecipe.raw({ tone: "soft", padding: "cozy" }), {
  borderColor: "primary.700/22",
});
