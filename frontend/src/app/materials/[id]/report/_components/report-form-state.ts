import { createBlankCropReport, type CropReportInput } from "@/server/usage-reports/model";

export type CropTabState = {
  selectedCropIds: string[];
  activeCropId: string | null;
  cropReports: Record<string, CropReportInput>;
};

export function createCropTabState(initialReports: CropReportInput[]): CropTabState {
  return {
    selectedCropIds: initialReports.map(({ cropId }) => cropId),
    activeCropId: initialReports[0]?.cropId ?? null,
    cropReports: Object.fromEntries(initialReports.map((report) => [report.cropId, report])),
  };
}

export function addCropTab(state: CropTabState, cropId: string): CropTabState {
  if (state.selectedCropIds.includes(cropId)) {
    return { ...state, activeCropId: cropId };
  }
  return {
    selectedCropIds: [...state.selectedCropIds, cropId],
    activeCropId: cropId,
    cropReports: {
      ...state.cropReports,
      [cropId]: createBlankCropReport(cropId),
    },
  };
}

export function removeCropTab(state: CropTabState, cropId: string): CropTabState {
  const selectedCropIds = state.selectedCropIds.filter((candidate) => candidate !== cropId);
  const cropReports = { ...state.cropReports };
  delete cropReports[cropId];
  return {
    selectedCropIds,
    cropReports,
    activeCropId: state.activeCropId === cropId ? (selectedCropIds[0] ?? null) : state.activeCropId,
  };
}

export function activateCropTab(state: CropTabState, cropId: string): CropTabState {
  if (!state.selectedCropIds.includes(cropId)) return state;
  return { ...state, activeCropId: cropId };
}

export function updateCropTabReport(state: CropTabState, input: CropReportInput): CropTabState {
  if (!state.selectedCropIds.includes(input.cropId)) return state;
  return {
    ...state,
    cropReports: { ...state.cropReports, [input.cropId]: input },
  };
}
