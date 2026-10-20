/**
 * 公開前の表現確認と、編集権付与前の確認は別の工程として案内する。
 * actor は作業の担い手、action は手順から案内する画面。
 */
export const MANUFACTURER_ONBOARDING_STEPS = [
  {
    actor: "maker",
    action: "register",
    title: "企業会員登録",
    body: "まずは企業会員登録の申請をお願いいたします。運営が法人情報を確認のうえ、ご登録のメールアドレス宛にFarmille企業会員IDとパスワード設定のご案内をお送りします。",
  },
  {
    actor: "maker",
    action: "ownerApplication",
    title: "資材オーナー権限の申請",
    body: "ログイン後、申請フォームから資材ごとに資材オーナー権限を申請します。新しく掲載する資材も、すでにFarmilleに掲載されている資材も同じフォームです。貴社名の記載箇所を含むパッケージ・ラベルの画像、または製品ページのURLを添えてください。",
  },
  {
    actor: "farmille",
    action: null,
    title: "運営が確認",
    body: "貴社が当該資材の製造元・販売元・輸入元であることを、ご提出のパッケージ画像または製品ページで確認します。ご提出資料に不足がある場合や確認事項がある場合は、担当者メールアドレス宛にご連絡します（差戻し）。ご回答をいただいた後に確認を再開します。",
  },
  {
    actor: "farmille",
    action: null,
    title: "権限の付与",
    body: "確認できた資材には資材オーナー権限をお渡しし、担当者メールアドレス宛にメールでお知らせします。掲載済みの資材は、これまでの感想口コミ・実証詳細レポートごと引き継ぎます。",
  },
  {
    actor: "maker",
    action: "dashboard",
    title: "製品情報の登録・編集",
    body: "権限をお渡しした資材について、企業会員ダッシュボードで製品説明・施用方法・資料・作用機作などを入力し、公開を申請します。下書き保存とプレビューが使えます。公開前に運営が表現を確認し、必要な場合はご連絡します。",
  },
] as const;

export type ManufacturerOnboardingActor = (typeof MANUFACTURER_ONBOARDING_STEPS)[number]["actor"];
export type ManufacturerOnboardingAction = Exclude<
  (typeof MANUFACTURER_ONBOARDING_STEPS)[number]["action"],
  null
>;

export const BS_GUIDELINE_URL = "https://www.maff.go.jp/j/press/syouan/nouan/250530.html";
export const BS_GUIDELINE_TITLE =
  "農林水産省「バイオスティミュラントの表示等に係るガイドライン」（令和7年5月30日策定）";
