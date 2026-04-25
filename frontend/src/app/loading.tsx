import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm"
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="sr-only">読み込み中</span>
    </div>
  );
}
