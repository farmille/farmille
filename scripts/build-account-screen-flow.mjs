import { readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// 同じ画面を複数の経路で参照し、役割による分岐を経路の見出しで示す。
/** @type {Array<[string, string, string]>} */
const screens = [
  ["/", "ホーム", "08-home"],
  ["/signup", "登録方法を選択", "01-account-choice"],
  ["/signup/general", "一般ユーザー登録", "02-general-signup"],
  ["/signup/done", "登録完了", "07-general-signup-done"],
  ["/login", "一般・運営ログイン", "06-general-login"],
  ["/me", "マイページ", "09-mypage"],
  ["/sellers", "メーカー向け案内", "33-manufacturer-landing"],
  ["/sellers/apply", "メーカー申請", "03-seller-apply"],
  ["/sellers/apply/done", "申請受付完了", "04-seller-apply-done"],
  ["/sellers/login", "メーカーログイン", "05-seller-login"],
  ["/dashboard", "メーカーダッシュボード", "10-dashboard"],
  ["/admin/sellers", "メーカー審査一覧", "11-admin-sellers-list"],
  ["/admin/sellers/[id]", "メーカー審査・紐づけ", "12-admin-seller-detail"],
  ["/dashboard/materials", "自社資材・申請一覧", "13-seller-materials"],
  [
    "/dashboard/materials/[id]",
    "資材の確認・編集・非公開申請",
    "14-seller-material-detail-unverified",
  ],
  ["/dashboard/materials/requests/[id]", "自社の申請詳細", "16-seller-update-request"],
  ["/admin/materials/requests/[id]", "資材変更申請の審査", "17-admin-update-request"],
  ["/dashboard/materials/new", "資材の新規登録申請", "18-seller-material-new"],
  ["/admin/materials/requests", "資材変更申請一覧", "20-admin-material-requests"],
  ["/admin/materials", "運営の資材一覧", "25-admin-materials"],
  ["/admin/materials/new", "運営による資材登録", "26-admin-material-new"],
  ["/users/[id]", "一般ユーザーの公開ページ", "32-general-user-page"],
  ["/search", "資材検索", "34-search"],
  ["/articles", "記事・使用レポート一覧", "35-articles"],
  ["/password-reset", "再設定メールの送信", "36-password-reset"],
  ["/account/password", "現在のパスワードから変更", "62-password-change-general"],
  ["/sellers/password-reset", "メーカーの再設定メール送信", "63-seller-password-reset"],
  ["/materials/[id]", "公開資材詳細", "37-material"],
  ["/materials/[id]/reviews", "資材のレビュー一覧", "38-reviews"],
  ["/materials/[id]/articles", "資材の関連記事", "39-material-articles"],
  ["/sellers/[id]", "メーカーの公開ページ", "40-public-seller"],
  ["/me/edit", "ハンドル・アバター編集", "41-profile-edit"],
  ["/me/saved", "検討リスト", "42-saved"],
  ["/me/saved/compare", "資材の比較", "43-compare"],
  ["/post", "投稿する資材を選択", "44-post"],
  ["/password-reset/update", "新しいパスワード", "45-password-update"],
  ["/materials/[id]/review/new", "レビュー投稿", "46-review-new"],
  ["/materials/[id]/review/[reviewId]/edit", "自分のレビュー編集", "47-review-edit"],
  ["/materials/[id]/report/new", "使用レポート投稿", "48-report-new"],
  ["/dashboard/articles", "自社記事一覧", "49-seller-articles"],
  ["/dashboard/articles/new", "記事作成", "50-article-new"],
  ["/dashboard/articles/[id]/edit", "記事編集", "51-article-edit"],
  ["/articles/[id]", "公開記事詳細", "52-public-article"],
  ["/admin", "運営ホーム", "53-admin-home"],
  ["/admin/tags", "検索タグ・作物管理", "54-admin-tags"],
  ["/admin/reports", "通報管理", "55-admin-reports"],
  ["/admin/usage-reports", "使用レポート編集局", "56-admin-usage-reports"],
  ["/admin/usage-reports/[id]", "使用レポート審査・編集", "57-admin-report-edit"],
  ["/admin/materials/[id]", "運営の資材詳細・編集", "58-admin-material-edit"],
  ["/reports/[id]", "公開使用レポート", "59-public-report"],
  ["/admin/mfa", "運営の2要素認証", "60-admin-mfa"],
];
/** @type {Array<[string, string, string, Array<[string, string[]]>]>} */
const groups = [
  [
    "general",
    "一般ユーザー",
    "閲覧は未ログインでも可能。投稿・保存・参考になったは一般ユーザーのログインが必要。",
    [
      [
        "資材を探してレビューを読む",
        ["/", "/search", "/materials/[id]", "/materials/[id]/reviews"],
      ],
      [
        "登録からマイページへ（確認メールからの認証を含む）",
        ["/signup", "/signup/general", "/signup/done", "/login", "/me"],
      ],
      ["プロフィールと検討リスト", ["/me", "/me/edit"]],
      ["現在のパスワードから変更し、再ログイン", ["/me", "/account/password", "/login"]],
      ["保存した資材を比較", ["/me", "/me/saved", "/me/saved/compare"]],
      [
        "資材を選んでレビュー投稿。投稿後は資材詳細から自分のレビューを編集",
        [
          "/post",
          "/materials/[id]/review/new",
          "/materials/[id]",
          "/materials/[id]/review/[reviewId]/edit",
        ],
      ],
      [
        "使用レポートの提出後、運営の編集・承認を経て公開",
        ["/materials/[id]", "/materials/[id]/report/new", "/reports/[id]"],
      ],
      ["資材の関連記事", ["/materials/[id]", "/materials/[id]/articles", "/articles/[id]"]],
      ["記事・使用レポートの一覧から読む", ["/articles", "/reports/[id]"]],
      ["資材詳細から投稿者を確認", ["/materials/[id]", "/users/[id]"]],
      ["資材詳細からメーカーを確認", ["/materials/[id]", "/sellers/[id]"]],
      [
        "ログインできないとき（再設定メールのリンクを経由）",
        ["/login", "/password-reset", "/password-reset/update"],
      ],
    ],
  ],
  [
    "manufacturer",
    "メーカー",
    "農業資材メーカーのみ利用可能。運営がメーカーを紐づけて承認すると、自社資材を操作できる。",
    [
      [
        "メーカー用の入口から申請",
        ["/signup", "/sellers", "/sellers/apply", "/sellers/apply/done"],
      ],
      [
        "運営承認・共有ログイン発行後に利用開始",
        ["/admin/sellers/[id]", "/sellers/login", "/dashboard"],
      ],
      [
        "共有アカウントのパスワードを変更し、再ログイン",
        ["/dashboard", "/account/password", "/sellers/login"],
      ],
      [
        "パスワードを忘れたとき（登録済み連絡先に届くメールを経由）",
        ["/sellers/login", "/sellers/password-reset", "/password-reset/update", "/sellers/login"],
      ],
      [
        "既存資材を確認・編集・非公開申請",
        [
          "/dashboard",
          "/dashboard/materials",
          "/dashboard/materials/[id]",
          "/dashboard/materials/requests/[id]",
        ],
      ],
      [
        "新規資材も運営承認後に公開",
        ["/dashboard/materials", "/dashboard/materials/new", "/dashboard/materials/requests/[id]"],
      ],
      [
        "自社記事を作成し、保存後に編集",
        [
          "/dashboard",
          "/dashboard/articles",
          "/dashboard/articles/new",
          "/dashboard/articles/[id]/edit",
        ],
      ],
      [
        "記事はメーカー自身が公開・下書きを管理",
        ["/dashboard/articles/[id]/edit", "/articles/[id]"],
      ],
    ],
  ],
  [
    "admin",
    "運営",
    "運営アカウントは2要素認証が必須。資材の正本とメーカー申請の承認を管理する。",
    [
      ["運営としてログイン", ["/login", "/admin/mfa", "/admin"]],
      ["2要素認証済みの状態でパスワードを変更", ["/admin", "/account/password", "/login"]],
      [
        "メールと認証アプリでパスワードを再設定",
        ["/login", "/password-reset", "/password-reset/update", "/login", "/admin/mfa"],
      ],
      [
        "メーカー審査：既存メーカーを選択。候補がなければ同じ画面で追加",
        ["/admin", "/admin/sellers", "/admin/sellers/[id]"],
      ],
      [
        "メーカー操作を待たずに資材を登録",
        ["/admin", "/admin/materials", "/admin/materials/new", "/admin/materials/[id]"],
      ],
      [
        "メーカーからの追加・変更・非公開申請を審査",
        ["/admin", "/admin/materials/requests", "/admin/materials/requests/[id]"],
      ],
      ["検索分類を管理", ["/admin", "/admin/tags"]],
      ["通報を確認し、対象コンテンツを非公開化", ["/admin", "/admin/reports"]],
      [
        "使用レポートを編集・公開",
        ["/admin", "/admin/usage-reports", "/admin/usage-reports/[id]", "/reports/[id]"],
      ],
    ],
  ],
];
const root = "docs/rebuild/assets/account-flow";
const screenMap = new Map(screens.map((entry) => [entry[0], entry]));
function pages(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? pages(join(directory, entry.name))
      : entry.name === "page.tsx"
        ? [
            join(directory, entry.name)
              .replace(/^src\/app/, "")
              .replace(/\/page.tsx$/, "") || "/",
          ]
        : [],
  );
}
const missing = pages("src/app").filter(
  (path) => !path.startsWith("/dev/") && !screenMap.has(path),
);
if (missing.length) throw new Error(`資料にない画面：${missing.join(", ")}`);
const escape = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
function card(path, account) {
  const screen = screenMap.get(path);
  if (!screen) throw new Error(`画面が未定義：${path}`);
  const [, label, defaultFile] = screen;
  const file =
    path === "/account/password"
      ? `62-password-change-${account === "manufacturer" ? "seller" : account}`
      : defaultFile;
  if (!existsSync(`${root}/screens/${file}.png`)) throw new Error(`未撮影：${file}`);
  if (!existsSync(`${root}/screens/pc/${file}.png`)) throw new Error(`PC未撮影：${file}`);
  return `<figure><div class="captures"><a href="screens/${file}.png" target="_blank" rel="noopener"><span>SP・375px</span><img src="screens/${file}.png" alt="${escape(label)}のSP実画面" loading="lazy"></a><a href="screens/pc/${file}.png" target="_blank" rel="noopener"><span>PC・1280px</span><img src="screens/pc/${file}.png" alt="${escape(label)}のPC実画面" loading="lazy"></a></div><figcaption><strong>${label}</strong><small>${escape(path)}</small></figcaption></figure>`;
}
const arrow =
  '<svg class="arrow" viewBox="0 0 40 30" aria-label="遷移"><path d="M2 15H34M25 6L34 15L25 24" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const body = groups
  .map(
    ([id, title, note, flows]) =>
      `<section id="${id}"><h2>${title}</h2><p>${note}</p>${flows.map(([label, paths]) => `<article><h3>${label}</h3><div class="flow">${paths.map((path) => card(path, id)).join(arrow)}</div></article>`).join("")}</section>`,
  )
  .join("");
writeFileSync(
  `${root}/20260908-account-screen-flow.html`,
  `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Farmille アカウント別画面遷移図</title><style>
:root{--ink:#1b271e;--muted:#626d66;--line:#d8ded9;--bg:#f7faf7;--green:#22612f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,sans-serif;line-height:1.7}main{max-width:1400px;margin:auto;padding:40px 24px}h1{font-size:30px}h2{font-size:26px;border-bottom:2px solid var(--green);padding-bottom:12px}h3{font-size:17px}p{max-width:900px;color:var(--muted)}nav{display:flex;gap:24px;flex-wrap:wrap;margin:28px 0}a{color:var(--green)}section{margin-top:64px}article{margin:36px 0 56px}.flow{display:flex;align-items:center;gap:10px}figure{flex:1;min-width:0;margin:0;background:white;border:1px solid var(--line);border-radius:12px;overflow:hidden}figure img{width:100%;height:320px;object-fit:cover;object-position:top;display:block;border-bottom:1px solid var(--line)}figure a:focus{outline:3px solid var(--green)}figcaption{padding:12px;font-size:14px;min-height:100px}small{display:block;overflow-wrap:anywhere;font-size:11px;color:var(--muted)}.arrow{flex:0 0 30px;width:30px;height:30px;color:var(--green)}.note{border-left:4px solid var(--green);padding:12px 20px;background:white}footer{border-top:1px solid var(--line);padding-top:24px}@media(max-width:700px){main{padding:24px 16px}h1{font-size:24px}.flow{flex-direction:column}figure{width:min(100%,375px);flex:auto}figure img{height:420px}.arrow{transform:rotate(90deg)}figcaption{min-height:0}section{margin-top:40px}}
.captures{display:grid;gap:12px;padding:10px}.captures a{display:block;text-decoration:none;min-width:0}.captures span{display:block;font-size:12px;padding:4px}.captures img{height:260px;object-fit:cover;background:#f4f6f4;border:1px solid var(--line)}.captures a:nth-child(2) img{height:180px}@media(max-width:700px){.captures img{height:380px}.captures a:nth-child(2) img{height:230px}}
</style></head><body><main><h1>Farmille アカウント別画面遷移図</h1><p>一般・メーカー・運営の${screens.length}画面を、2026年9月8日のローカル本番ビルドでSP（375px）・PC（1280px）の両方で撮影。各カードの上にSP、下にPCを掲載している。画像を押すと画面全体を拡大できる。矢印は各見出しに記した操作・審査を経た遷移を示す。</p><nav aria-label="アカウント別目次"><a href="#general">一般ユーザー</a><a href="#manufacturer">メーカー</a><a href="#admin">運営</a></nav><p class="note">メーカーの資材追加・変更・非公開化は運営の承認後に反映。非公開資材は一般ユーザーに表示せず、担当メーカーと運営は管理画面で参照できる。メーカー確認済みマークはアカウント承認だけでは付かない。</p>${body}<footer><p>開発専用の /dev/tokens と /dev/ui は利用者向け遷移の対象外。認証確認・ログアウト・画像・サイトマップは画面を持たない処理ルート。未ログインで投稿・保存へ進むとログインへ、メーカー・一般アカウントで運営画面へ進むとアクセス拒否になる。</p><p>この図の画像はローカル本番ビルドで撮影した。2026年9月8日に本番DB移行とデプロイを実施し、本番URLで一般・メーカー・運営のログイン、メーカー紐づけ、資材変更・掲載終了の承認、SP・PC表示を検証済み。</p></footer></main></body></html>`,
);
console.log(`${screens.length}画面の遷移図を作成しました。`);
