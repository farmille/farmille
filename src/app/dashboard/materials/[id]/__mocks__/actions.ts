import { fn } from "storybook/test";

type Actions = typeof import("../actions");

const success = { status: "success", message: "Storybook 上で保存しました。" } as const;

export const updatePrimaryInformationAction = fn<Actions["updatePrimaryInformationAction"]>(
  async () => success,
);
export const addEvidenceAction = fn<Actions["addEvidenceAction"]>(async () => success);
export const deleteEvidenceAction = fn<Actions["deleteEvidenceAction"]>(async () => success);
export const submitEditRequestAction = fn<Actions["submitEditRequestAction"]>(async () => success);
