import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>ページが見つかりません</h1>
      <p>指定されたページは存在しないか、移動した可能性があります。</p>
      <Link href="/">ホームへ戻る</Link>
    </main>
  );
}
