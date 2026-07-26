"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function Error({ unstable_retry }: ErrorProps) {
  return (
    <main>
      <h1>エラーが発生しました</h1>
      <p>時間をおいて、もう一度お試しください。</p>
      <button type="button" onClick={unstable_retry}>
        もう一度試す
      </button>
    </main>
  );
}
