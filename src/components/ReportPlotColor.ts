import { css } from "../../styled-system/css";

const colors = [
  css({ fill: "text.subtle", color: "text.subtle" }),
  css({ fill: "brand.primary", color: "brand.primary" }),
  css({ fill: "tag.effect", color: "tag.effect" }),
  css({ fill: "tag.type", color: "tag.type" }),
  css({ fill: "tag.concern", color: "tag.concern" }),
];

export function reportPlotColor(index: number) {
  return colors[index < 2 ? index : 2 + ((index - 2) % (colors.length - 2))];
}
