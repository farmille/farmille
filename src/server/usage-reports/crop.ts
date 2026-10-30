export type ReportCrop = {
  /** 作物マスタのID。「その他」に自由記入した作目はnull。 */
  id: string | null;
  name: string;
};

type ReportCropFields = {
  crop: { id?: string; name: string } | null;
  crop_name_other: string | null;
};

/** 作物マスタの作目か「その他」の自由記入を、表示用の作目にまとめる。どちらも無ければnull。 */
export function reportCrop(row: ReportCropFields): ReportCrop | null {
  if (row.crop !== null) return { id: row.crop.id ?? null, name: row.crop.name };

  return row.crop_name_other === null ? null : { id: null, name: row.crop_name_other };
}
