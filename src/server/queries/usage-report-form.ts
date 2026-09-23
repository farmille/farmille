export type CropOption = {
  id: string;
  name: string;
  aliases: string[];
  groupName: string;
};

export type SubmittedUsageReport = {
  id: string;
  cropName: string;
  status: "pending";
  updatedAt: string;
};
