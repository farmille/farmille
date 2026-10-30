export const CONTACT_EMAIL = "contact@farmille.com";
export const REMOVAL_CONTACT_SENTENCE = `終売表示や資材ページの非公開のご依頼は ${CONTACT_EMAIL} で受け付けます。`;
export const OWNER_APPLICATION_HREF = "/dashboard/applications/new/registration";

export type ProcedureSlug = "owner" | "transfer-out" | "transfer-in";

type ProcedureStep = {
  title: string;
  body: string;
};

export type Procedure = {
  slug: ProcedureSlug;
  title: string;
  listTitle: string;
  lead: string;
  needId: boolean;
  formHref: string;
  formLabel: string;
  steps: ReadonlyArray<ProcedureStep>;
  conds: ReadonlyArray<string>;
  prep: ReadonlyArray<readonly [string, string]>;
};

export const PROCEDURES = {
  owner: {
    slug: "owner",
    title: "資材オーナー権限の申請",
    listTitle: "資材オーナー権限を申請する（新規掲載・掲載済み資材）",
    lead: "貴社の資材について、資材オーナー権限（資材ごとに1社に設定する権限で、製品情報を編集できます）を申請します。新しく掲載する資材も、すでにFarmilleに掲載されている資材も同じ申請です。",
    needId: true,
    formHref: OWNER_APPLICATION_HREF,
    formLabel: "資材オーナー権限の申請フォームへ",
    steps: [
      {
        title: "ログインし、「各種お手続き」から申請フォームにご記入ください",
        body: "資材ごとに、申請内容（新規掲載／掲載済み資材の資材オーナー権限）、資材名、当該資材との関係（製造元・販売元・輸入元）、パッケージが確認できる資料を記入します。",
      },
      {
        title: "運営が内容を確認後、資材ごとに資材オーナー権限をお渡しいたします",
        body: "完了した場合、またご提出資料に不足がある場合は、担当者メールアドレス宛にメールでご連絡いたします。",
      },
    ],
    conds: [
      "申請するすべての資材について、当該資材の製造元・販売元・輸入元のいずれか、または複数に該当すること。特定地域の販売代理店・卸・小売店は受付対象外です。",
      "「販売元」とは、当該資材のパッケージ上で「販売元」「発売元」等として表記され、国内における販売を代表する立場にある企業を指します。",
      "当該資材の製造・輸入・販売等に関わる他の関係会社との間で合意を得ているか、または貴社の判断で申請できる立場にあり、本申請を行う正当な権利を有していること。",
      "資材オーナー権限は、1資材につき1社に付与されます。すでに別の会社が資材オーナー企業になっている資材に申請している場合は、確認のうえ当事者間での話し合いをお願いすることがあります。",
    ],
    prep: [
      ["法人番号（13桁）とFarmille企業会員ID", ""],
      ["ご担当者の氏名・部署名・メールアドレス・電話番号", ""],
      ["資材名（パッケージ記載の正式名称）", ""],
      ["掲載済み資材の場合：FarmilleページのURL", "製品公式ページのURLは任意です"],
      [
        "資材ごとのパッケージ・ラベルの画像（貴社名の記載箇所を含む）",
        "または、パッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL",
      ],
    ],
  },
  "transfer-out": {
    slug: "transfer-out",
    title: "資材オーナー権限を別の会社に引き渡す",
    listTitle: "資材オーナー権限を別の会社に引き渡す",
    lead: "貴社が資材オーナー企業になっている資材について、資材オーナー権限を別の会社に移す申請です。現在の資材オーナー企業から申請します。",
    needId: true,
    formHref: "/dashboard/applications/new/transfer_out",
    formLabel: "資材オーナー権限の移行申請フォームへ",
    steps: [
      {
        title: "ログインし、「各種お手続き」から申請フォームにご記入ください",
        body: "対象資材ごとに、FarmilleページURLと資材名、移行先企業の法人名・法人番号・Farmille企業会員ID・ご担当者の連絡先を記入します。あわせて、移行先企業名が当該資材のパッケージに記載されていることが分かる資料（パッケージ・ラベルの画像、または製品ページURL）を添えます。",
      },
      {
        title: "運営が、移行先企業の関与をパッケージで確認します",
        body: "移行先企業名が当該資材のパッケージ・ラベルに記載されていることを、ご提出の画像または製品ページURLで確認します。パッケージに記載がない場合に限り、契約書の写し・官報公告・プレスリリース等の資料で確認します。いずれでも確認できない場合は、両社の合意があっても移行できません。あわせて、移行先企業が企業会員として登録済みであることを確認します。",
      },
      {
        title: "確認後、資材オーナー権限を移行先企業に移し、両社にメールでご連絡いたします",
        body: "貴社の資材オーナー権限は解除されます。資材ページと感想口コミ・実証詳細レポートは、移行後もそのまま引き継がれます。",
      },
    ],
    conds: [
      "貴社が、対象資材の資材オーナー企業であること。",
      "移行先企業もFarmille企業会員IDを持っていること。未開設の場合は、先に移行先企業にアカウント開設を依頼してください。",
      "資材オーナー権限を移行することについて、移行先企業から承諾を得ていること。",
      "既存の編集権限の委託がある場合、移行の完了をもって解除されること。",
      "本申請を行う担当者が、所属法人から必要な権限を付与されていること。",
    ],
    prep: [
      ["対象資材のFarmilleページURLと資材名", ""],
      [
        "移行先企業の法人名・法人番号・Farmille企業会員ID・ご担当者の連絡先",
        "事前に移行先企業へご確認ください",
      ],
      [
        "移行先企業の関与を確認できる資料",
        "移行先企業名が記載されたパッケージ・ラベルの画像 or 製品ページURL（必須）。パッケージに記載がない場合は、契約書の写し・官報公告・プレスリリース等（関係のない機密情報・個人情報はマスキング可）",
      ],
      ["貴社の法人番号（13桁）とFarmille企業会員ID", ""],
    ],
  },
  "transfer-in": {
    slug: "transfer-in",
    title: "別の会社から資材の事業を引き継いだ",
    listTitle: "別の会社から資材の事業を引き継いだ",
    lead: "事業譲渡・合併等により資材に関する事業を引き継いだ会社が、資材オーナー権限の移行を申請します。",
    needId: true,
    formHref: "/dashboard/applications/new/transfer_in",
    formLabel: "資材オーナー権限の移行申請フォーム（引き継ぎ先）へ",
    steps: [
      {
        title: "ログインし、「各種お手続き」から申請フォームにご記入ください",
        body: "対象資材ごとに、FarmilleページURLと資材名、現在の資材オーナー企業の法人名、貴社の関与を確認できる資料を記入します。あわせて、移行の経緯と、経緯を確認できる資料（現在の資材オーナー企業の同意がわかるメールの写し、官報公告、プレスリリース、契約書の写し等）を添えます。",
      },
      {
        title: "運営が、現在の資材オーナー企業に本申請を通知し、14日間の確認期間をとります",
        body: "期間内に異議があった場合は、お手続きを保留し、当事者間での協議をお願いします。現在の資材オーナー企業に連絡がつかない場合は、ご提出の承継資料をもとに判断します。",
      },
      {
        title: "運営が、貴社の関与と移行の経緯を資料で確認します",
        body: "14日以内に異議がない場合でも、自動では移行しません。貴社名のパッケージ記載、または承継資料で確認できない場合は、移行をお受けできないことがあります。",
      },
      {
        title: "確認後、資材オーナー権限を貴社に移し、両社にメールでご連絡いたします",
        body: "現在の資材オーナー企業の資材オーナー権限は解除されます。資材ページと感想口コミ・実証詳細レポートは、移行後もそのまま引き継がれます。",
      },
    ],
    conds: [
      "事業譲渡・合併等により、当該資材に関する事業を引き継いだ企業であること。",
      "当該資材の製造元・販売元・輸入元のいずれかに該当すること。",
      "本申請を行う担当者が、所属法人から必要な権限を付与されていること。",
    ],
    prep: [
      ["対象資材のFarmilleページURLと資材名", ""],
      ["現在の資材オーナー企業の法人名", "分かる範囲で担当部署・連絡先も"],
      [
        "貴社の関与を確認できる資料",
        "貴社名が記載されたパッケージ・ラベルの画像 or 製品ページURL、またはその他の関係確認資料",
      ],
      [
        "移行の経緯と、経緯を確認できる資料",
        "現在の資材オーナー企業の同意がわかるメールの写し、官報公告、プレスリリース、契約書の写し等。できるだけ添付してください",
      ],
      ["法人番号（13桁）とFarmille企業会員ID", ""],
    ],
  },
} as const satisfies Record<ProcedureSlug, Procedure>;

export const PROCEDURE_ORDER: ReadonlyArray<ProcedureSlug> = [
  "owner",
  "transfer-out",
  "transfer-in",
];

export function isProcedureSlug(value: string): value is ProcedureSlug {
  return PROCEDURE_ORDER.some((slug) => slug === value);
}

type MemberAction = {
  title: string;
  href: string;
  note?: string;
  procedure?: ProcedureSlug;
};

export const MEMBER_ACTIONS: ReadonlyArray<MemberAction> = [
  { title: "新しい資材を掲載する", href: OWNER_APPLICATION_HREF, procedure: "owner" },
  {
    title: "自社資材の情報を確認・編集する",
    href: "/dashboard/materials",
    note: "（企業会員ダッシュボードから）",
  },
  {
    title: "資材を終売・非公開にする",
    href: `mailto:${CONTACT_EMAIL}`,
    note: `（${CONTACT_EMAIL} で受け付けます）`,
  },
  {
    title: "資材オーナー権限を別の会社に引き渡す",
    href: "/dashboard/applications/new/transfer_out",
    procedure: "transfer-out",
  },
  {
    title: "引き継いだ資材の資材オーナー権限を申請する",
    href: "/dashboard/applications/new/transfer_in",
    procedure: "transfer-in",
  },
  { title: "会社の情報（メーカープロフィール）を編集する", href: "/dashboard/profile" },
  { title: "各種お手続きの一覧を見る", href: "/dashboard/applications" },
];

type FaqLink = { href: string; label: string };

type Faq = { question: string; answer: string; links: ReadonlyArray<FaqLink> };

export const GUIDE_FAQS: ReadonlyArray<Faq> = [
  {
    question: "申請から掲載まではどのくらいかかりますか？",
    answer:
      "企業会員登録・資材オーナー権限の申請とも、運営が内容を確認のうえ、結果をメールでご連絡します。特に資材オーナー権限の申請は、確認にお時間をいただくことがあります。ご提出資料に不足がある場合や確認事項が発生した場合は、担当者メールアドレス宛にご連絡し、ご回答をいただいた後に確認作業を再開します。",
    links: [],
  },
  {
    question: "Farmilleに登録した覚えがないのに、自社の資材が掲載されています。",
    answer:
      "Farmille運営が公開情報をもとに作成した仮掲載ページです。貴社で情報を管理したい場合は、企業会員登録のうえ、掲載済み資材の資材オーナー権限をお申し込みください。ページに蓄積された感想口コミ・実証詳細レポートはそのまま引き継がれます。",
    links: [{ href: "#lpGuideNew", label: "資材オーナー権限の申請について" }],
  },
  {
    question: "資材ページを削除してもらえますか？",
    answer: `販売を終了した資材には「終売」の表示を反映し、事情により掲載を控えたい場合は資材ページを「非公開」にします。${REMOVAL_CONTACT_SENTENCE}なお、資材ページそのものの削除は行っておらず、これに伴ってFarmille上の感想口コミ・実証詳細レポートなどのデータを削除することもありません。`,
    links: [{ href: "#lpGuideDelist", label: "終売・非公開のご依頼について" }],
  },
  {
    question: "販売代理店や卸売業者でも申請できますか？",
    answer:
      "特定地域の販売代理店・卸・小売店の皆様からのお手続きは受け付けておりません。パッケージ上で「販売元」「発売元」等として表記され、国内の販売を代表する立場の企業様は「販売元」としてお申し込みいただけます。",
    links: [],
  },
  {
    question: "資材オーナー権限を別の会社に移せますか？",
    answer:
      "資材オーナー権限を移行することは可能です。現在の資材オーナー企業から申請する場合と、事業譲渡・合併などで引き継いだ会社から申請する場合で、手続きが異なります。",
    links: [{ href: "#lpGuideMore", label: "権限の引き渡し・引き継ぎについて" }],
  },
  {
    question: "生産者の感想口コミや実証詳細レポートを削除してもらえますか？",
    answer:
      "生産者の投稿を、メーカー様のご希望を理由に削除することは基本的に行いません。明らかな事実誤認、法令違反、誹謗中傷に該当すると思われる場合は、運営にお問い合わせください。",
    links: [],
  },
  {
    question: "申請の結果はどのように連絡されますか？",
    answer:
      "運営から、ご記入いただいたご担当者様のメールアドレス宛にご連絡いたします。ご提出資料に不足がある場合も、同じくメールでご連絡します。",
    links: [],
  },
  {
    question: "非公開にした後、再び掲載できますか？",
    answer:
      "可能です。関係する会社間で掲載についての合意をいただいたうえで、あらためて資材オーナー権限をご申請ください。",
    links: [{ href: "#lpGuideNew", label: "資材オーナー権限の申請について" }],
  },
];

export const PROCEDURE_FAQS: ReadonlyArray<Faq> = [
  {
    question: "資材ページを削除してもらえますか？",
    answer: `販売を終了した資材には「終売」の表示を反映し、事情により掲載を控えたい場合は資材ページを「非公開」にします。${REMOVAL_CONTACT_SENTENCE}なお、資材ページそのものの削除は行っておらず、これに伴ってFarmille上の感想口コミ・実証詳細レポートなどのデータを削除することもありません。`,
    links: [],
  },
  {
    question: "Farmilleに登録した覚えがないのに、自社の資材が掲載されています。",
    answer:
      "Farmille運営が公開情報をもとに登録した資材ページです。貴社で情報を管理したい場合は、企業会員登録のうえ、掲載済み資材の資材オーナー権限をお申し込みください。ページに蓄積されたレビューはそのまま引き継がれます。",
    links: [{ href: "/sellers/procedures/owner", label: "資材オーナー権限の申請" }],
  },
  {
    question: "資材オーナー権限とは何ですか？",
    answer:
      "Farmilleに掲載される資材ごとに1社に設定する権限で、製品情報を編集できます。製造元・販売元・輸入元の企業様に、資材ごとにお渡しします。編集権限だけを代理店等に委託することもできます。",
    links: [{ href: "/sellers/procedures/owner", label: "申請の流れ・条件" }],
  },
  {
    question: "販売代理店や卸売業者でも申請できますか？",
    answer:
      "特定地域の販売代理店・卸・小売店の皆様からのお手続きは受け付けておりません。パッケージ上で「販売元」「発売元」等として表記され、国内の販売を代表する立場の企業様は「販売元」としてお申し込みいただけます。",
    links: [],
  },
  {
    question: "資材オーナー権限を別の会社に移せますか？",
    answer:
      "資材オーナー権限を移行することは可能です。現在の資材オーナー企業から申請する場合と、事業譲渡・合併などで引き継いだ会社から申請する場合で、手続きが異なります。",
    links: [
      { href: "/sellers/procedures/transfer-out", label: "引き渡す（現在の資材オーナー企業）" },
      { href: "/sellers/procedures/transfer-in", label: "引き継いだ会社から申請する" },
    ],
  },
  {
    question: "申請の結果はどのように連絡されますか？",
    answer:
      "運営から、ご記入いただいたご担当者様のメールアドレス宛にご連絡いたします。ご提出資料に不足がある場合も、同じくメールでご連絡します。",
    links: [],
  },
  {
    question: "非公開にした後、再び掲載できますか？",
    answer:
      "可能です。関係する会社間で掲載についての合意をいただいたうえで、あらためて資材オーナー権限をご申請ください。",
    links: [{ href: "/sellers/procedures/owner", label: "資材オーナー権限の申請" }],
  },
];
