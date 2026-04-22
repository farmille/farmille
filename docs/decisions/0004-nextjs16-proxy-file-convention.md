# ADR-0004: Next.js 16 の `proxy.ts` ファイル規約を採用する

**ステータス**: Accepted
**決定日**: 2026-04-21
**決定者**: 酒井涼雅（CTO）

## コンテキスト
`docs/specs/auth-flow.md` §7 は `frontend/src/middleware.ts` に認証ロジックを実装する前提で書かれていた。しかし v1 スプリントで採用している Next.js 16.2.4 では `middleware` ファイル規約が `proxy` にリネームされ、非推奨 deprecation 警告が出る（`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:11` で確認）。関数シグネチャも `export async function middleware(req)` → `export function proxy(req)` に変更。v16 のどこかのマイナーで非互換化する可能性があり、仕様書の字面と実際のプラットフォーム規約が乖離していた。

## 決定
- 認証ロジックは `frontend/src/proxy.ts` として実装し、関数名も `proxy` とする。
- 仕様書 §7 の `middleware.ts` / `middleware()` 記述は「Next.js 16 系では proxy.ts / proxy() として読み替える」ことを §7 冒頭の注記で明示する（本スプリント中に追記済）。
- ロジック・挙動・`config.matcher` は仕様書記載のものと同一とする（ファイル名と関数名のみの mechanical rename）。

## Consequences
- 仕様書の意図（Next.js のリクエスト横断で認証を挟む）は完全に保たれる。受け入れ条件 §11.5 は機能要件のみのため影響なし。
- Next.js 16 の deprecation 警告を回避でき、将来のマイナー更新への追従コストが下がる。
- 仕様書の字面と実装ファイル名が乖離するため、新規参加者が混乱する可能性はある。§7 冒頭の注記と本 ADR がその補償。
- 将来 Next.js 17 以降で `proxy` 規約が再度変更された場合、本 ADR を Superseded にして後継 ADR を起票する。
- 同種のプラットフォーム起因ズレへの SOP は v1 ローンチ後のレトロ（2026-08〜09）で整理する（`docs/discussions/001-nextjs16-proxy-rename.md` §7 の Q2-Q6 を持ち越し）。

## Alternatives considered
- **B 案: `middleware.ts` のまま据え置く**（deprecation 警告を許容）。却下理由: v16 マイナーで非互換化する可能性があり、`frontend/AGENTS.md` の「Heed deprecation notices」方針にも反する。
- **C 案: 仕様書を先に更新してから実装**。却下理由: スプリント中の仕様書改訂は「仕様書 = 唯一の正」契約を揺らがせる。§7 冒頭の注記＋ ADR 化で事後整理する方が運用コストが低い。

## 関連ドキュメント
- `docs/discussions/001-nextjs16-proxy-rename.md`（本 ADR に正式化）
- `docs/specs/auth-flow.md` §7 冒頭の Next.js 16 読み替え注記
- `frontend/AGENTS.md`（Next.js 16 破壊的変更への追従方針）
