import Link from "next/link";

type MockAppBarProps = {
  title: string;
  /** 戻る先。ブラウザ履歴に頼らず、画面ごとに決めた親画面へ戻す。 */
  backHref: string;
  /** 見本 appbar(title, { share: true }) の共有アイコン。共有先がある画面だけ渡す。 */
  shareHref?: string;
};

/** 見本の appbar(title) — 戻る・画面名・（共有）の帯。 */
export function MockAppBar({ title, backHref, shareHref }: MockAppBarProps) {
  return (
    <div className="appbar" data-ui="mock-app-bar">
      <Link href={backHref} className="ic" aria-label="戻る">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div className="ttl">{title}</div>
      {shareHref ? (
        <Link href={shareHref} className="ic" aria-label="共有">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M4 12v8a1 1 0 001 1h14a1 1 0 001-1v-8M16 6l-4-4-4 4M12 2v14" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}
