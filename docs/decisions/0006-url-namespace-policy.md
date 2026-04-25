# ADR-0006: URL 名前空間は /maker/* (ロール固有) / /me/* (個人データ) / root (公開デフォルト) の 3 層に分類する

**ステータス**: Accepted
**決定日**: 2026-04-25
**決定者**: 酒井涼雅（CTO）

## コンテキスト

Phase 11 の検討中、onboarding 完了後 / login 後の着地点として `/home` を維持するか削除するかが議論になった。`/home` は v0 期に「ログイン成功を伝える placeholder ページ」として作られた経緯があり、現状ロールラベルと "近日公開予定" 文言だけを表示する空セッション。Phase 11b で薄い redirect ラッパに変えるか、完全削除するかを Ryoga 判断で確定する必要があった。

検討中に、より深い問題として **「farmille プロジェクトに URL 名前空間の方針が言語化されていない」** ことが浮かび上がった。既存 URL を観察すると、暗黙的に以下の 3 層が形成されている:

- `/maker/products`（maker 固有の自社資材管理画面）
- `/products`、`/products/[id]`（公開 / 全 user 共通のデフォルトビュー）
- `/me/reviews`（Phase 12 計画、ログイン user の自分のデータ）

この暗黙パターンを言語化しないまま `/home` の去就を判断すると、以下のような誤判断が将来発生しうる:

- 「`/home` を将来 dashboard URL として予約しておく」→ ロールごとの dashboard は本来 `/maker/dashboard` や `/me/dashboard` が自然で、ロール非依存の `/home` という概念自体が不要
- 「`/home` を残しておけば後で何か入れられる」→ 何も入れる予定がないなら残す理由が無い、孤児 URL の永続化
- 「とりあえず `/home` に何か便利機能を足す」→ 既存 3 層パターンを乱す、設計の一貫性が失われる

`/home` の去就を 1 件の判断として処理するのではなく、URL 設計の原則を確立してその系として `/home` を扱う必要がある。

## 決定

Farmille の URL 名前空間を以下の 3 層に分類する:

### 層 1: `/maker/*` — ロール固有 UI

特定ロール（現状は maker のみ）専用の管理画面。**当該ロールの視点でのみ意味を持つドメイン操作** に使う。

例:
- `/maker/products` — 自社資材一覧（既存）
- `/maker/insights`（将来）— 自社資材へのレビュー分析
- `/maker/dashboard`（将来）— maker 向けダッシュボード

判断基準: そのページの存在意義が「ユーザーが maker である」ことに依存するなら `/maker/*`。

将来 farmer-only の機能ができた場合は `/farmer/*` を新設する（例: `/farmer/recommendations`）。ja_staff / researcher 向けに限定機能を作る場合も同パターン。

### 層 2: `/me/*` — ログイン user の個人データビュー

ロールに関わらず「ログイン user の自分のデータ」を扱う UI。**user_id でフィルタしたビュー** に使う。

例:
- `/me/reviews`（Phase 12 計画）— 自分の投稿レビュー
- `/me/profile`（将来）— プロフィール編集
- `/me/recent`（将来）— 最近見た資材

判断基準: そのページの中身が「ログイン user による絞り込み（user_id）」で決まるなら `/me/*`。ロール固有のドメイン操作なら層 1。

### 層 3: root path — 公開 / デフォルトビュー

`/`、`/products`、`/products/[id]`、`/signup`、`/login` 等。**ログイン状態に関わらず到達可能** または **全 user 共通のエントリポイント** に使う。

例:
- `/products` — 全資材一覧（公開、reviewer 系のデフォルト着地でもある）
- `/products/[id]` — 資材詳細（公開）
- `/signup` / `/login` — 認証 UI

判断基準: 公開ページ or auth 関連 or 全 user 共通の入り口。

### `/home` の扱い

`/home` は上記 3 層のいずれにも属さない **孤児 URL**。Farmille は道具型サービス（Twitter / Slack 型）であり、Salesforce 型のハブ dashboard は v1 スコープ外（CLAUDE.md / skill §1.4）。よって `/home` を維持する設計上の動機は存在しない。

**最終形は `/home` を完全削除**。実施は段階分け:

- **Phase 11b ホットフィックス（実施済み）**: 既存 `redirect("/home")` 7 箇所 + signIn action を `landingPathForRole` 経由に書き換え、`/home` は外部リンク・bookmark 互換のための薄いラッパとして残置（内部フローは bypass）。これにより 2 段 redirect の UX 遅延を即時解消
- **Phase 12（予定）**: `/home/page.tsx` 自体の削除 + `<Link href="/home">` 残箇所 1 件 + `proxy.ts` の `/home` 参照削除 + 互換 redirect ルートの整理（必要なら `auth/callback` 既存処理に委譲）

### `landingPathForRole(role)` helper

`/home` bypass / 削除に伴い、点在していた「ロール別デフォルト着地ロジック」を 1 箇所に集約する:

```typescript
// frontend/src/lib/auth/landing.ts
export function landingPathForRole(role: string | null | undefined): string {
  if (isMakerRole(role)) return "/maker/products";
  if (isReviewerRole(role)) return "/products";
  return "/onboarding"; // unassigned 含む
}
```

このヘルパは以下の場面で利用される:
- `signIn` action 後の redirect
- `/onboarding/complete` の「はじめる」ボタンの href（実装は `isMakerRole` / `isReviewerRole` 直接判定）
- 各 Server Component の認可チェック失敗時のフォールバック redirect（旧 `redirect("/home")` 箇所）
- `/home` ラッパ自身の最終 redirect（薄ラッパが残っている間）

将来「maker は `/maker/products` ではなく `/maker/dashboard` を default にする」等の変更が起こっても、このヘルパ 1 行修正で全箇所に反映される。

## Consequences

**良い面**:
- URL 設計の判断基準が言語化され、今後の Phase で「これどこに置く？」の議論が即決できる
- `/home` のような孤児 URL が発生しなくなる
- 「ロール別デフォルト着地」が単一概念として helper に集約され、点在する redirect の重複が解消
- 将来 `/farmer/*` 等を追加する際も同パターンの拡張で済む（フレームワーク化）
- skill §1.4「v1 スコープ厳守」の補強：ハブ dashboard を作りたくなる誘惑を URL 設計レベルで防ぐ

**悪い面 / 既知リスク**:
- Phase 11b で 8 箇所の `redirect("/home")` 書き換えが発生（+0.5 日相当）。本 ADR 採用に伴う一時コスト
- 3 層分類は経験則であり、将来「どの層にも分類しにくい」ページが現れる可能性。その場合は本 ADR を Update して 4 層目を定義するか、設計を見直す

## Alternatives considered

- **B 案: `/home` を薄い server redirect ラッパとして永続化する**
  最終形としては却下。ただし Phase 11b ホットフィックスでは「外部リンク・bookmark 互換のため一時的にラッパとして残置 + 内部遷移は bypass」という移行期形態を採用、Phase 12 で完全削除に進む。helper による集約は Phase 11b 時点で達成済

- **C 案: `/home` を将来 dashboard 用に予約**
  却下理由: ロール非依存の dashboard は Farmille の道具型方針（CLAUDE.md / skill §1.4）に反する。ロール別 dashboard を作る場合は `/maker/dashboard` や `/me/dashboard` が 3 層分類で自然な配置になる。`/home` を予約しても使われない

- **D 案: URL 名前空間ポリシーを ADR 化せず、case-by-case で判断**
  却下理由: 暗黙パターンを言語化しないと、将来の Phase で「`/home` をどうするか」と同じ判断ミスが繰り返される。明文化すれば worker / 次の自分が判断に迷わない

- **E 案: ロール別に root URL を分ける（`/farmer/`, `/maker/`, `/researcher/` 全部）**
  却下理由: 全 role で UI が異なる場合は妥当だが、Farmille では reviewer 系 3 ロール（farmer / researcher / ja_staff）は基本的に同じ UI を共有する。過剰な分割は重複を生む

## 関連ドキュメント

- `docs/specs/launch-polish.md` §4.1（本 ADR を実装する Phase 11b の作業範囲）
- `frontend/src/lib/auth/landing.ts`（Phase 11b で新設する helper）
- `frontend/src/app/maker/products/page.tsx`（層 1 の現存例）
- `frontend/src/app/products/page.tsx`（層 3 の現存例）
- `.claude/skills/farmille-architecture-principles/SKILL.md` §1.4（v1 スコープ厳守、ハブページ不要の根拠）
- `CLAUDE.md`（4 ロール権限体系、道具型サービスのドメイン定義）
