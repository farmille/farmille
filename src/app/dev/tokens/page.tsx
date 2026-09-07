import { notFound } from "next/navigation";

import { TokenCatalog } from "./TokenCatalog";

export default function TokensPage() {
  // 開発用カタログを本番アプリの経路には公開しない。
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <TokenCatalog />;
}
