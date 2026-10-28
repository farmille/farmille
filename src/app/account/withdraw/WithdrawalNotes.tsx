import { css } from "../../../../styled-system/css";

const listStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  mb: "6",
  pl: "5",
  listStyleType: "disc",
  textStyle: "body",
  color: "text.default",
});

const strongStyle = css({ fontWeight: "bold" });

/** 「退会する」を押す前に読む、退会したあとの扱い。 */
export function WithdrawalNotes() {
  return (
    <ul className={listStyle} aria-label="退会するとどうなるか">
      <li>
        本名・メールアドレス・電話番号・住所・パスワード・パスキーを削除します。このアカウントにはログインできなくなります。
      </li>
      <li>
        投稿した実証詳細レポートと感想口コミは削除されません。投稿者名は「退会済みユーザー」と表示され、プロフィールは表示されなくなります。投稿を消したいときは、退会の前にご自身で削除してください。
      </li>
      <li>お気に入りと保存した投稿は削除されます。</li>
      <li>同じメールアドレスで、新しく会員登録できます。以前の投稿は引き継がれません。</li>
      <li className={strongStyle}>退会は取り消せません。</li>
    </ul>
  );
}
