# 「使用版」CTA 撤回 + マネタイズ方針ピボット 仕様

**作成日**: 2026-05-14
**対象 ADR**: ADR-0011（「使用版」CTA 撤回 + マネタイズ方針ピボット）
**作業ブランチ**: `docs/maker-admin-and-monetization-pivot`（仕様策定）/ 実装ブランチは generator 起票時に確定
**実装担当**: worker
**位置づけ**: ADR-0011 で確定した「使用版」CTA 系の v1 撤回を、コード / 仕様 / テストの cleanup として実施する。新規機能ゼロの cleanup-only spec。

---

## 0. Architecture Principles 準拠宣言

本 spec は `.claude/skills/farmille-architecture-principles/SKILL.md` の以下に準拠する。

- **§1.1 DOA 優先**: 新規スキーマなし。撤回対象の `sample_requests` は migration 未生成のため DOA 不可逆領域への影響ゼロ。既存テーブルへの ALTER も行わない
- **§1.2 ポータビリティ予算**: 本 spec は UI / テスト / spec doc のみの cleanup。Edge Functions / Railway 固有 API への新規依存追加なし
- **§1.3 責務分離**: 本 spec はフロント側のみで完結（backend / supabase 配下に「使用版」残存物は事前 grep で 0 件確認済）。BFF 経由ルールへの追加変更なし
- **§1.4 v1 スコープ厳守**: ADR-0011 が「使用版」CTA を v1 アウトに確定。本 spec は新機能を追加せず、撤回作業のみを範囲とする。マネタイズ方針ピボット（メーカー課金等）の実装は本 spec の射程外（別 spec で扱う）

§7 で本 spec の境界（マネタイズピボット系の未確定領域とのライン）を明示する。

---

## 1. ゴール / 縮退ライン

### 1.1 必達

- マイ資材ページ `/me/materials` のタブ構成を **3 タブ → 2 タブ**に縮小（「お気に入り」「候補」のみ。「問い合わせ履歴」を撤去）
- 「問い合わせ履歴」タブ用プレースホルダコンポーネント（`requests-placeholder.tsx`）の削除
- `frontend/src/` 配下の「使用版」「sample_request」関連残存物の網羅的除去（規制テストのアサートを除く）
- `backend/` `supabase/` 配下に「使用版」「sample_request」が出現しないことの再確認（事前調査で 0 件、cleanup 後も維持）
- `manufacturers-card.test.tsx` の「使用版 NOT 表示」アサートは**規制テストとして維持**（将来の誤復活を検知する役割）

### 1.2 縮退ライン（落ちても v1.5 送り可）

- なし。本 spec は cleanup-only のため全て必達。縮退対象がない

### 1.3 翌日送り（本 spec 対象外）

- マネタイズ方針ピボット（メーカー課金月 3000 円等）の実装 — ADR-0011 後段に記載されているがメモリ `project_maker_paid_v1_inclusion.md` で S2 詰め予定、本 spec の射程外
- `docs/specs/*.md` 内の「使用版 / sample_request」記述更新 — ADR-0011 でドキュメント手動更新済との前提で本 spec のコードベース cleanup と分離（受入基準 §6 で docs 配下を除外）
- メーカー側の代替リード獲得導線（M4 派生）の設計 — 本 spec はあくまで撤回、新規導線の設計は別 spec で起票

---

## 2. 画面一覧（影響を受ける既存ページ）

| パス | 種別 | 変更内容 | 認証 |
|---|---|---|---|
| `/me/materials` | Server Component | タブ定義を `["favorite","candidate","requests"]` → `["favorite","candidate"]` に縮小 / `requests` タブ UI 分岐削除 / プレースホルダコンポーネント import 削除 | reviewer ロール必須（既存） |
| `/manufacturers/[id]` 配下 | （変更なし） | 既存 spec `manufacturers-public.md` §13 で「使用版 CTA は作らない」と確定済。今回追加削除対象なし | – |
| `/products/[id]` 配下 | （変更なし） | 既存実装に「使用版」CTA は未追加。変更不要 | – |

新規ページ追加・新規ルート追加なし。

---

## 3. データ書き込み方針

**本 spec は cleanup のため新規スキーマなし。** 以下を再確認する。

### 3.1 既存テーブルへの影響

- `sample_requests` テーブルは migration 未生成（事前確認済）。**新たに作らない**ことを確定する
- 既存テーブルへの ALTER なし
- 既存 RLS への変更なし
- 既存 Storage バケットへの変更なし

### 3.2 BFF / API への影響

- `backend/app/routers/` 配下に「使用版」関連エンドポイント未実装（事前 grep 0 件）。**新たに追加しない**ことを確定する
- 既存エンドポイントの contract 変更なし

### 3.3 フロント直叩き原則の維持

- 本 spec で `supabase.from(` / `supabase.rpc(` の出現を増やさない（既存 0 件維持）
- 本 spec で `supabase.storage.*` の出現を増やさない

---

## 4. 削除対象の網羅リスト

| # | パス | 種別 | 判断 |
|---|---|---|---|
| D-1 | `frontend/src/app/me/materials/_components/requests-placeholder.tsx` | ファイル | **削除**（撤回対象タブの専用コンポーネント） |
| D-2 | `frontend/src/app/me/materials/page.tsx` の `VALID_TABS` 配列内 `"requests"` 要素 | 変更 | **削除**（`["favorite","candidate"]` に縮小） |
| D-3 | `frontend/src/app/me/materials/page.tsx` の `RequestsPlaceholder` import 文 | 変更 | **削除**（D-1 連動） |
| D-4 | `frontend/src/app/me/materials/page.tsx` の `tab === "requests"` 条件分岐 JSX | 変更 | **削除**（D-1 連動） |
| D-5 | `frontend/src/app/me/materials/page.tsx` の `TabLink` 呼び出しのうち `target="requests"`（「問い合わせ履歴」ラベル）の行 | 変更 | **削除**（タブナビから撤去） |
| D-6 | `frontend/src/app/me/materials/page.tsx` 冒頭コメント `spec §6.1: requests タブは API 呼び出しゼロ (§13)` 等の旧 spec 参照 | 変更 | **削除 or 書き換え**（D-2〜D-5 連動。コメントの残存も「使用版」概念の痕跡となるため除去） |

### 4.1 維持対象（**削除しない**）

| # | パス | 理由 |
|---|---|---|
| K-1 | `frontend/src/app/manufacturers/_components/manufacturer-card.test.tsx` の `it("does NOT render forbidden Phase 13 placeholders (お悩み相談室 / 使用版 CTA)", ...)` | **規制テストとして維持**。将来「使用版」UI が誤復活した場合の自動検知ガード |
| K-2 | `docs/specs/*.md` 内の「使用版」「sample_request」記述 | 本 spec の射程外。docs 更新は ADR-0011 で別途完了済との前提（受入基準 §6 で `docs/specs/` 除外） |
| K-3 | `docs/decisions/0011-*.md`（ADR 本体） | ADR 本体は記録として残す |
| K-4 | `docs/requirements/*.md` 内の「使用版」記述 | 経緯記録として残す（受入基準 §6 で `docs/` 除外） |

---

## 5. テスト戦略

### 5.1 既存テストの維持確認

- `manufacturer-card.test.tsx` の **全 8 ケース**が変更なしで pass し続けること
- 特に `does NOT render forbidden Phase 13 placeholders` ケースが pass = 「使用版」UI が `<ManufacturerCard>` に混入していないことを継続検証

### 5.2 マイ資材タブのテスト

- 既存に `page.tsx` 用テストがない場合、本 spec で**追加義務は課さない**（cleanup-only のため工数最小）
- ただし、generator が必要と判断すれば最小ケース 1 つ（「`requests` タブ要素が存在しないこと」のアサート）を追加してよい。任意追加であり受入基準に含めない

### 5.3 新規規制テストの追加（任意）

- `frontend/src/app/me/materials/` 配下を対象に、「`使用版` / `sample_request` 文字列が現れないこと」を CI で検知するテストを追加してもよい（任意。受入基準 §6 の grep で代替可能）

---

## 6. Sprint 分解 + 受入基準

### Sprint 1（唯一の sprint）: `cleanup/sample-cta-withdrawal`

**目的**: ADR-0011 に従い、「使用版」CTA / `sample_requests` 関連の残存物をコードベースから除去する。

**含む作業**:
- §4 D-1〜D-6 の削除・変更を実施
- §4.1 K-1〜K-4 を変更しない（誤削除防止）
- grep ベースの受入基準（§6 受入基準）を満たす
- `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build` 全 pass
- 既存テスト `pnpm vitest` 全 pass（特に `manufacturer-card.test.tsx`）

**完了ゴール（画面で確認できる粒度）**:
- `/me/materials` を開くと「お気に入り」「候補」の 2 タブのみ表示される
- URL に `?tab=requests` を直接指定しても、`requests` は無効値として扱われ「お気に入り」タブにフォールバック表示される（既存 `parseTab` のフォールバック挙動を維持）
- `requests-placeholder.tsx` がリポジトリから消えている

#### 受入基準（測定可能・falsifiable）

- [ ] **AC-1** `frontend/src/app/me/materials/_components/requests-placeholder.tsx` が存在しない（`test -e` が exit 1）
- [ ] **AC-2** `grep -rn "sample_request\|使用版" frontend/src backend/ supabase/` の結果が **規制テスト 1 ファイル（`manufacturer-card.test.tsx`）の 2 行のみ**であること。それ以外は 0 件
  - 具体: `frontend/src/app/manufacturers/_components/manufacturer-card.test.tsx:66` と `:70` のみ残る想定
- [ ] **AC-3** `grep -rn "requests-placeholder\|RequestsPlaceholder" frontend/src` の結果が 0 件
- [ ] **AC-4** `frontend/src/app/me/materials/page.tsx` の `VALID_TABS` が `["favorite", "candidate"] as const` であり、`"requests"` を含まない
- [ ] **AC-5** `/me/materials` をブラウザ or Server Component レンダラで開いたとき、タブナビに「お気に入り」「候補」のラベルが現れ、「問い合わせ履歴」ラベルが現れない
- [ ] **AC-6** `pnpm tsc --noEmit` が exit 0
- [ ] **AC-7** `pnpm lint` で warning / error 0 件
- [ ] **AC-8** `pnpm build` 全ルート生成成功
- [ ] **AC-9** `pnpm vitest run` 全 pass。特に `manufacturer-card.test.tsx` の `does NOT render forbidden Phase 13 placeholders` ケースが pass
- [ ] **AC-10** `supabase/migrations/` に `sample_request` 系の新規 migration が追加されていない（既存 0 件維持）
- [ ] **AC-11** `backend/app/routers/` に `sample_request` 系の新規ルーターが追加されていない（既存 0 件維持）

> 注: AC-2 の grep からは `docs/` を除外する（`docs/specs/*.md` / `docs/requirements/*.md` / `docs/decisions/*.md` 内の記述は本 spec 射程外）。実行コマンドは `grep -rn "sample_request\|使用版" frontend/src backend/ supabase/` のように `docs` を渡さない形で実施する。

**想定工数**: 30 分〜1 時間（cleanup-only）

---

## 7. リスク / 既知の制約

### 7.1 規制テストの誤削除リスク

`manufacturer-card.test.tsx` の「使用版 NOT 表示」アサートを cleanup の勢いで一緒に削除してしまうと、将来「使用版」UI が誤復活した際の自動検知ガードを失う。

**対策**: §4.1 K-1 で明示的に「維持対象」とし、受入基準 AC-2 と AC-9 で残存を二重チェックする。

### 7.2 docs/specs 内の旧記述との整合

`docs/specs/my-materials.md` `docs/specs/manufacturers-public.md` `docs/specs/articles.md` 等に「使用版」「sample_requests」への参照が残っている。本 spec はこれらを更新しないため、generator がコードを cleanup したあとも docs 上では「v1 アウト」扱いの記述が残る。

**対策**: ADR-0011 起票時にドキュメント更新は手動で完了している前提を本 spec で明文化（§1.3 翌日送り）。万一未更新の場合は、別 task で docs sweep を起票する（本 spec の責務外）。

### 7.3 マネタイズピボットの未確定性

ADR-0011 はマネタイズ方針ピボット（メーカー課金月 3000 円・協力ベース等）を含むが、メモリ `project_maker_paid_v1_inclusion.md` で S2 で詳細を詰める予定。本 spec の cleanup はマネタイズピボットの実装に依存しない（純粋な撤回作業）ため、S2 議論結果に関わらず先行可能。

**対策**: 本 spec は cleanup-only に限定し、マネタイズピボット実装は別 spec で扱う。本 spec の完了は S2 議論の前段で問題ない。

---

## 8. 完了の定義（DoD）

以下を全て満たしたとき本 spec を完了とする。

- [ ] §6 受入基準 AC-1 〜 AC-11 すべて pass
- [ ] §4 削除対象 D-1 〜 D-6 すべて実施
- [ ] §4.1 維持対象 K-1 〜 K-4 すべて変更されていない
- [ ] commit message が Conventional Commits 形式（`chore:` または `refactor:` プレフィックス推奨）
- [ ] PR description に ADR-0011 へのリンクと §4 削除対象の表を貼付

---

## 9. 触らないファイル / 触るファイル

### 9.1 触らないファイル

- `supabase/migrations/*`（全件、既存 migration への変更ゼロ）
- `backend/app/routers/*`（全件、新規追加・既存変更ゼロ）
- `backend/app/models/schemas.py`（変更ゼロ）
- `frontend/src/app/manufacturers/_components/manufacturer-card.test.tsx`（規制テスト維持、§4.1 K-1）
- `frontend/src/app/manufacturers/_components/manufacturer-card.tsx`（既存に「使用版」UI なし、変更不要）
- `frontend/src/app/products/[id]/*`（既存に「使用版」CTA なし、変更不要）
- `frontend/src/lib/auth/*` `frontend/src/lib/supabase/*`
- `frontend/src/proxy.ts`
- `docs/specs/*.md`（本 spec 自身を除く、§1.3 翌日送り）
- `docs/requirements/*.md`
- `docs/decisions/*.md`（ADR-0011 含め、決定記録は不可逆）
- `.claude/` 配下

### 9.2 触るファイル

#### 削除

- `frontend/src/app/me/materials/_components/requests-placeholder.tsx`

#### 変更

- `frontend/src/app/me/materials/page.tsx`（§4 D-2〜D-6）

#### 新規

- なし

---

## 10. Generator への申し送り

### 10.1 skill `farmille-architecture-principles` 発動推奨タイミング

- 本 spec は cleanup-only のため §1.1 DOA / §1.4 v1 スコープへの追加適合チェックは不要
- ただし「使用版」関連の残存物を誤って残した場合に §4.4 アンチパターン #9「ついで実装」逆方向の汚れが残るため、§6 受入基準 AC-2 / AC-3 の grep を必ず実行すること

### 10.2 既存パターン参考

- マイ資材タブの構造は `frontend/src/app/me/materials/page.tsx` の現状そのものが参考。`VALID_TABS` 配列と `parseTab` フォールバック関数の構造は維持しつつ、`"requests"` だけ抜く

### 10.3 想定アンチパターン（先回り警告）

- ❌ `parseTab` の挙動を「無効な tab を弾く」ことを理由に struct を再設計しないこと。本 spec は等価変更（要素 1 つ削除）に限定。memory `feedback_lint_workaround_must_match_spec_intent.md` 参照
- ❌ 規制テスト `manufacturer-card.test.tsx` の「使用版 NOT 表示」アサートを「もう必要ない」として削除しないこと。これは将来の誤復活検知用の正規アサート
- ❌ docs/specs/*.md の更新を本 spec 内で行わないこと。本 spec の射程外（§1.3 翌日送り）
- ❌ Next.js 16 の破壊的変更を理由に本 spec の範囲を超える書き換えを行わないこと。本 cleanup は単純な要素削除のみで、Next.js 16 固有 API の追加導入はない

### 10.4 Next.js 16 関連

`frontend/AGENTS.md` の通り Next.js 16 は破壊的変更を含むが、本 spec の触る範囲（`me/materials/page.tsx` の既存 Server Component / `requests-placeholder.tsx` の削除）はいずれも Next.js 16 固有 API（`searchParams` の Promise 化等）に既に対応済の既存コードを縮小するだけ。追加対応不要。

---

**以上**
