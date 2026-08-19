import { fn } from "storybook/test";

type Events = typeof import("../events");

export const trackReviewSubmitted = fn<Events["trackReviewSubmitted"]>();
export const trackUsageReportSubmitted = fn<Events["trackUsageReportSubmitted"]>();
export const trackSearchPerformed = fn<Events["trackSearchPerformed"]>();
export const trackMaterialSaved = fn<Events["trackMaterialSaved"]>();
