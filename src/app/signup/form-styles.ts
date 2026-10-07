import { buttonRecipe } from "@/components/Button";
import { inputRecipe } from "@/components/Input";
import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css } from "../../../styled-system/css";

const focusRing = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary.700",
  outlineOffset: "2px",
} as const;

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
  fontFamily: "inherit",
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

const fmButton = { fontFamily: "inherit", lineHeight: "normal", _focusVisible: focusRing } as const;

export const primaryLinkButtonStyle = css(
  buttonRecipe.raw({ variant: "primary", size: "md" }),
  fmButton,
  { py: "3.5" },
);

export const ghostLinkButtonStyle = css(
  buttonRecipe.raw({ variant: "ghost", size: "md" }),
  fmButton,
  { py: "3.5" },
);

export const smallGhostButtonStyle = css(
  buttonRecipe.raw({ variant: "ghost", size: "sm" }),
  fmButton,
  { flex: "0 0 auto", minW: "0", px: "4" },
);
