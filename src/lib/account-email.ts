/** 会員登録・退会・パスワード再設定・企業会員の案内で送るメールの件名と本文。送信元アドレスは送信専用。 */
export type AccountEmail = { subject: string; text: string };

const CONTACT_EMAIL = "contact@farmille.com";
const LINK_LIFETIME = "1時間";

function subject(title: string): string {
  return `【Farmille】${title}`;
}

function footer(siteUrl: string): string {
  return [
    "※本メールは送信専用のアドレスからお送りしています。",
    "ご質問・お問い合わせは下記までお願いいたします。",
    CONTACT_EMAIL,
    "",
    "――――――――",
    "Farmille（ファーミル）",
    "運営：ファーミル株式会社",
    new URL(siteUrl).origin,
  ].join("\n");
}

function body(siteUrl: string, ...sections: string[][]): string {
  return `${[...sections.map((lines) => lines.join("\n")), footer(siteUrl)].join("\n\n")}\n`;
}

/** 申し込んでいない人に届いたときの案内。その人に向けた案内が続くときは more に渡す。 */
export function strangerNotice(...more: string[]): string[] {
  return [
    "■このメールに心当たりがない場合",
    "ほかの方がメールアドレスを間違えて入力した可能性があります。リンクは開かずに、このメールを削除してください。",
    ...more,
  ];
}

export function registrationVerificationEmail(link: string, siteUrl: string): AccountEmail {
  return {
    subject: subject("メールアドレスの確認（会員登録はまだ完了していません）"),
    text: body(
      siteUrl,
      ["Farmille運営事務局です。", "Farmilleへの会員登録のお申し込み、ありがとうございます。"],
      [
        "※まだ会員登録は完了していません。",
        "下記のリンクからメールアドレスを確認し、登録情報を入力してください。",
      ],
      ["▼登録情報の入力へ進む", link, `※リンクの有効期限は${LINK_LIFETIME}です。`],
      [
        "有効期限が切れた場合は、お手数ですが下記から再度お手続きください。",
        new URL("/signup", siteUrl).toString(),
      ],
      strangerNotice(),
    ),
  };
}

export function registrationCompleteEmail(siteUrl: string): AccountEmail {
  return {
    subject: subject("会員登録が完了しました"),
    text: body(
      siteUrl,
      [
        "Farmille運営事務局です。",
        "Farmilleへの会員登録が完了しました。ご登録いただき、ありがとうございます。",
      ],
      ["▼ログインはこちら", new URL("/login", siteUrl).toString()],
      [
        "ログイン後、マイページから栽培作目・所属・自己紹介などを設定できます。",
        "作物や悩みから資材を探せるほか、使った資材の体験を感想口コミや実証詳細レポートとして投稿できます。",
        "ぜひ、ご自身の体験を共有してください。",
      ],
      strangerNotice(
        "このメールアドレスで登録した覚えがない場合は、下記のお問い合わせ先にご連絡ください。",
      ),
    ),
  };
}

export function withdrawalCompleteEmail(siteUrl: string): AccountEmail {
  return {
    subject: subject("退会手続きが完了しました"),
    text: body(
      siteUrl,
      [
        "Farmille運営事務局です。",
        "Farmilleの退会手続きが完了しました。これまでご利用いただき、ありがとうございました。",
      ],
      [
        "■削除した情報",
        "本名・メールアドレス・電話番号・住所・パスワード・パスキーを削除しました。お気に入りと保存した投稿も削除しました。",
        "これまでのメールアドレスとパスワードでは、ログインできません。",
      ],
      [
        "■掲載を続ける投稿",
        "投稿した実証詳細レポートと感想口コミは削除していません。投稿者名は「退会済みユーザー」と表示されます。",
      ],
      [
        "■もう一度使う場合",
        "同じメールアドレスで、新しく会員登録できます。以前の投稿は引き継がれません。",
        new URL("/signup", siteUrl).toString(),
      ],
      [
        "■この手続きに心当たりがない場合",
        "ほかの人があなたのパスワードを使って退会した可能性があります。下記のお問い合わせ先にご連絡ください。",
      ],
    ),
  };
}

export function alreadyRegisteredEmail(siteUrl: string): AccountEmail {
  return {
    subject: subject("このメールアドレスは登録済みです"),
    text: body(
      siteUrl,
      [
        "Farmille運営事務局です。",
        "このメールアドレスで、会員登録のお申し込みがありました。",
        "このメールアドレスは、すでにFarmilleに登録されています。新しく登録する必要はありません。",
      ],
      ["▼ログインはこちら", new URL("/login", siteUrl).toString()],
      [
        "パスワードを忘れた場合は、下記からパスワードを再設定してください。",
        new URL("/password-reset", siteUrl).toString(),
      ],
      strangerNotice(),
    ),
  };
}

export function passwordResetEmail(link: string, siteUrl: string): AccountEmail {
  return {
    subject: subject("パスワード再設定のご案内"),
    text: body(
      siteUrl,
      ["Farmille運営事務局です。", "パスワード再設定のお申し込みを受け付けました。"],
      ["下記のリンクから、新しいパスワードを設定してください。"],
      ["▼新しいパスワードを設定する", link, `※リンクの有効期限は${LINK_LIFETIME}です。`],
      [
        "有効期限が切れた場合は、お手数ですがログイン画面の「パスワードをお忘れの方」から再度お手続きください。",
      ],
      strangerNotice("リンクを開かなければ、パスワードは変わりません。"),
    ),
  };
}

export function sellerWelcomeEmail(
  loginId: string,
  passwordSetupUrl: string,
  siteUrl: string,
): AccountEmail {
  return {
    subject: subject("企業会員登録のご案内（ログイン情報）"),
    text: body(
      siteUrl,
      [
        "Farmille運営事務局です。",
        "このたびはFarmilleの企業会員登録をお申し込みいただき、ありがとうございます。",
        "申請内容を確認し、企業会員登録を承認いたしましたので、ログイン情報をご案内いたします。",
      ],
      ["■ログイン情報", `Farmille企業会員ID：${loginId}`],
      ["下記のリンクから、パスワードを設定してください。"],
      ["▼パスワードを設定する", passwordSetupUrl, `※リンクの有効期限は${LINK_LIFETIME}です。`],
      [
        "有効期限が切れた場合は、お手数ですが下記から再発行してください。",
        new URL("/sellers/password-reset", siteUrl).toString(),
      ],
      ["▼メーカーログイン画面", new URL("/sellers/login", siteUrl).toString()],
      ["資材オーナー権限については、運営から別途ご案内いたします。"],
    ),
  };
}
