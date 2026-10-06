/** 見本の `.badge.req` ／ `.badge.opt` */
export function Badge({ required = false }: { required?: boolean }) {
  return <span className={required ? "badge req" : "badge opt"}>{required ? "必須" : "任意"}</span>;
}

/** 見本の `.need-msg`（未入力の項目の見出しの横に出す赤い注意書き） */
export function Need({ message, block = false }: { message?: string; block?: boolean }) {
  return message ? (
    <span className={block ? "need-msg block" : "need-msg"} role="alert">
      {message}
    </span>
  ) : null;
}

/** 見本の `.example`（記入例） */
export function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="example">
      <b>記入例</b>
      {children}
    </div>
  );
}

/** 見本の区の色。1つ目は灰色、2つ目以降は --s1〜--s5 を順に使う（report-form-extra.css の .pc0〜.pc5） */
export function plotColorClass(index: number) {
  return `pc${index === 0 ? 0 : ((index - 1) % 5) + 1}`;
}
