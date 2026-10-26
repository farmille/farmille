import { cva } from "../../styled-system/css";

/** 区の系列色。series は `reportPlotLayout`（src/lib/usage-report-plots.ts）が区ごとに決める。 */
export const reportPlotColor = cva({
  variants: {
    series: {
      "1": { fill: "chart.1", color: "chart.1" },
      "2": { fill: "chart.2", color: "chart.2" },
      "3": { fill: "chart.3", color: "chart.3" },
      "4": { fill: "chart.4", color: "chart.4" },
      "5": { fill: "chart.5", color: "chart.5" },
    },
  },
});
