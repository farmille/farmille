import { fn } from "storybook/test";

import type { ReportActionState } from "@/server/actions/reports";

// Storybook 専用モック。送信すると成功状態を返す。
export const createReportAction = fn(
  async (
    _targetType: string,
    _targetId: string,
    _currentPath: string,
    _previousState: ReportActionState,
    _formData: FormData,
  ): Promise<ReportActionState> => ({ status: "success" }),
).mockName("createReportAction");
