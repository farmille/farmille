import { inputRecipe } from "@/components/Input";
import { textareaRecipe } from "@/components/Textarea";

import { css } from "../../../../styled-system/css";

const invalidControl = {
  "&[aria-invalid=true]": { borderColor: "accent.danger" },
};

export const sellerFieldStyle = css({ mt: "5", _first: { mt: "0" } });

export const sellerLabelStyle = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "bold",
});

export const sellerInputStyle = css(inputRecipe.raw(), invalidControl);

export const sellerTextareaStyle = css(textareaRecipe.raw(), invalidControl);

export const sellerGuideStyle = css({
  mt: "1.5",
  fontSize: "sm",
  lineHeight: "normal",
  color: "text.muted",
});

export const sellerActionsStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  mt: "6",
});

export const sellerLeadStyle = css({ fontSize: "sm", color: "text.subtle" });

export const greenTextLinkStyle = css({
  color: "primary.800",
  fontWeight: "bold",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
});
