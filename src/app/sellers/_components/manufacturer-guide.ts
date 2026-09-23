const relation =
  "当該資材の製造元・販売元・輸入元のいずれか、または複数に該当する企業が対象です。特定地域の販売代理店・卸・小売店は受付対象外です。";
const agreement =
  "製造・輸入・販売等に関わる他の関係会社との間で合意を得ているか、貴社の判断で申請できる立場にあり、申請する正当な権利を有することが必要です。";
const authority = "申請する担当者が、所属法人から必要な権限を付与されていることが必要です。";
const packageEvidence =
  "資材ごとのパッケージ・ラベルの画像（貴社名の記載箇所を含む）、またはパッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL";
const contact = "ご担当者の氏名・部署名・メールアドレス・電話番号（公開されません）";
const account = "法人番号（13桁）とFarmilleアカウントID";
const material = "対象資材のFarmilleページURLと資材名（パッケージ記載の正式名称）";

export const APPLICATION_GUIDANCE = {
  registration: {
    eligibility: [
      relation,
      "「販売元」とは、パッケージ上で「販売元」「発売元」等として表記され、国内の販売を代表する立場の企業を指します。",
      agreement,
      authority,
      "資材オーナー権限は1資材につき1社に付与されます。すでに別の会社が資材オーナー企業の場合は、確認のうえ当事者間での話し合いをお願いすることがあります。",
    ],
    documents: [
      account,
      contact,
      "資材名（パッケージ記載の正式名称）と、掲載済みの場合はFarmilleページURL。製品公式ページのURLは任意です。",
      packageEvidence,
    ],
  },
  removal: {
    eligibility: [relation, agreement, authority],
    documents: [material, contact, "会社概要ページのURL", packageEvidence],
  },
  transfer_out: {
    eligibility: [
      "貴社が対象資材の資材オーナー企業であることが必要です。",
      "移行先企業もFarmilleアカウントIDを持ち、権限の移行に承諾していることが必要です。未開設の場合は、先に移行先企業へアカウント開設を依頼してください。",
      "既存の編集権限の委託がある場合、移行の完了をもって解除されます。",
      authority,
    ],
    documents: [
      material,
      "移行先企業の法人名・法人番号・FarmilleアカウントID・担当者の連絡先（事前にご確認ください）",
      "移行先企業名が記載されたパッケージ・ラベルの画像または製品ページURLが必要です。記載がない場合は、契約書の写し・官報公告・プレスリリース等をご用意ください。関係のない機密情報・個人情報はマスキングできます。",
      "貴社の法人番号（13桁）とFarmilleアカウントID",
    ],
  },
  transfer_in: {
    eligibility: [
      "事業譲渡・合併等により当該資材の事業を引き継ぎ、製造元・販売元・輸入元のいずれかに該当する企業が対象です。",
      authority,
    ],
    documents: [
      material,
      "現在の資材オーナー企業の法人名と、分かる範囲で担当部署・連絡先",
      "貴社名が記載されたパッケージ・ラベルの画像、製品ページURL、またはその他の関係確認資料",
      "移行の経緯と、それを確認できる資料。現在の資材オーナー企業の同意が分かるメールの写し、官報公告、プレスリリース、契約書の写し等をできるだけ添付してください。",
      account,
    ],
  },
} as const;

export const MEMBER_ACTIONS = [
  {
    title: "新しい資材を掲載する",
    href: "/dashboard/applications/new/registration",
    guidance: APPLICATION_GUIDANCE.registration,
    body: "フォームAから新規掲載を申請します。",
  },
  {
    title: "自社資材の情報を確認・編集する",
    href: "/dashboard/materials",
    guidance: null,
    body: "仮掲載ページを含め、権限をお渡しした資材をダッシュボードから編集できます。",
  },
  {
    title: "資材を終売・非表示にする",
    href: "/company-requests/removal",
    guidance: APPLICATION_GUIDANCE.removal,
    body: "フォームDの受付へ進みます。アカウントは不要です。",
  },
  {
    title: "資材オーナー権限を別の会社に引き渡す",
    href: "/dashboard/applications/new/transfer_out",
    guidance: APPLICATION_GUIDANCE.transfer_out,
    body: "現在の資材オーナー企業から、フォームBで申請します。",
  },
  {
    title: "引き継いだ資材の資材オーナー権限を申請する",
    href: "/dashboard/applications/new/transfer_in",
    guidance: APPLICATION_GUIDANCE.transfer_in,
    body: "事業譲渡・合併などで引き継いだ企業から、フォームCで申請します。",
  },
  {
    title: "会社の情報（メーカープロフィール）を編集する",
    href: "/dashboard/profile",
    guidance: null,
    body: "会社紹介・ロゴ・公式サイトを編集できます。",
  },
  {
    title: "担当者・連絡先を変更する",
    href: "mailto:contact@farmille.com",
    guidance: null,
    body: "法人名と変更内容を添えて、運営へメールでご連絡ください。",
  },
  {
    title: "各種お手続きの一覧を見る",
    href: "/dashboard/applications",
    guidance: null,
    body: "申請の入口と、提出済みの受付票を確認できます。",
  },
] as const;

export const GUIDE_FAQS = [
  {
    question: "申請から掲載まではどのくらいかかりますか？",
    answer:
      "企業会員登録・資材オーナー権限の申請とも、運営が内容を確認し、結果をメールでご連絡します。権限の申請は確認にお時間をいただくことがあります。資料の不足や確認事項がある場合は担当者メールアドレスへご連絡し、ご回答後に確認を再開します。",
    links: [],
  },
  {
    question: "登録した覚えがないのに、自社の資材が掲載されています。",
    answer:
      "運営が公開情報をもとに作成した仮掲載ページです。貴社で管理する場合は、企業会員登録後に掲載済み資材のオーナー権限をご申請ください。蓄積された感想口コミ・実証詳細レポートはそのまま引き継がれます。",
    links: [
      { label: "資材オーナー権限を申請する", href: "/dashboard/applications/new/registration" },
    ],
  },
  {
    question: "資材ページを削除してもらえますか？",
    answer:
      "販売を終了した資材には「終売・廃盤」を表示し、事情により掲載を控えたい場合は「非表示」にします。フォームDからお手続きください。資材ページそのものや、感想口コミ・実証詳細レポートなどのデータは削除しません。",
    links: [{ label: "終売・非表示を申請する", href: "/company-requests/removal" }],
  },
  {
    question: "販売代理店や卸売業者でも申請できますか？",
    answer:
      "特定地域の販売代理店・卸・小売店からのお手続きは受け付けていません。パッケージ上で「販売元」「発売元」等と表記され、国内の販売を代表する企業は「販売元」として申請できます。",
    links: [],
  },
  {
    question: "資材オーナー権限を別の会社に移せますか？",
    answer:
      "可能です。現在の資材オーナー企業からはフォームB、事業譲渡・合併などで引き継いだ企業からはフォームCで申請します。運営が確認したうえで移行します。",
    links: [
      {
        label: "現在の資材オーナー企業から引き渡す",
        href: "/dashboard/applications/new/transfer_out",
      },
      { label: "引き継いだ企業から申請する", href: "/dashboard/applications/new/transfer_in" },
    ],
  },
  {
    question: "終売や非表示の申請にFarmilleアカウントは必要ですか？",
    answer:
      "不要です。受付フォームに法人名・担当者名・メールアドレスを入力すると、申請フォームへ進む確認用URLをメールでお送りします。",
    links: [{ label: "終売・非表示を申請する", href: "/company-requests/removal" }],
  },
  {
    question: "メーカーが記入した情報はどのように表示されますか？",
    answer:
      "「メーカー記入」と表示します。公式認証や製品の効果を保証するマークではありません。記入内容の責任はメーカーにあり、公開前に運営が表現を確認します。",
    links: [],
  },
  {
    question: "生産者の感想口コミや実証詳細レポートを削除してもらえますか？",
    answer:
      "メーカーの希望を理由に生産者の投稿を削除することは基本的に行いません。明らかな事実誤認、法令違反、誹謗中傷に該当すると思われる場合は、運営へお問い合わせください。",
    links: [],
  },
  {
    question: "申請の結果はどのように連絡されますか？",
    answer:
      "運営からご担当者のメールアドレスへご連絡します。提出資料に不足がある場合もメールでご連絡します。受付控えの発行は、承認や権限付与を意味するものではありません。",
    links: [],
  },
  {
    question: "非表示にした後、再び掲載できますか？",
    answer:
      "可能です。関係する会社間で掲載について合意いただいたうえで、あらためてフォームAから資材オーナー権限をご申請ください。",
    links: [
      { label: "資材オーナー権限を申請する", href: "/dashboard/applications/new/registration" },
    ],
  },
] as const;
