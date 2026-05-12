// spec §10.4: sample_requests テーブルは v1 アウト。
// このタブは API 呼び出しゼロのプレースホルダ文言のみで実装する。
// Phase 20+ (要件 §5.2.3 確定後) で UI/データソースを一括投入する。

export function RequestsPlaceholder() {
  return (
    <div className="rounded-lg border border-border bg-card p-10 text-center space-y-3">
      <p className="text-lg font-medium text-foreground">
        履歴はまだありません
      </p>
      <p className="text-sm text-muted-foreground">
        メーカーからの「使用版」案内機能は準備中です。
      </p>
    </div>
  );
}
