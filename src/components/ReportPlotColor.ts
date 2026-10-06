import { css } from "../../styled-system/css";

const colors = [
  css({ fill: "chart.1", color: "chart.1" }),
  css({ fill: "chart.2", color: "chart.2" }),
  css({ fill: "chart.3", color: "chart.3" }),
  css({ fill: "chart.4", color: "chart.4" }),
  css({ fill: "chart.5", color: "chart.5" }),
];

export function reportPlotColor(index: number) {
  return colors[index < 2 ? index : 2 + ((index - 2) % (colors.length - 2))];
}
