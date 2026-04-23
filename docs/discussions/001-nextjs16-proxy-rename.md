# Discussion 001: Next.js 16 の `middleware` → `proxy` リネームと、プラットフォーム起因の仕様書ズレへの対応戦略

**作成日**: 2026-04-21
**起票者**: 酒井涼雅 (CTO) / Claude Code (Opus 4.7) 共同執筆
**対象読者**: 他の AI (ChatGPT / Gemini / 別セッションの Claude 等) および将来の自分
**ステータス**: ADR-0004 (`docs/decisions/0004-nextjs16-proxy-file-convention.md`) に正式化済み。§7 の長期論点（Q2-Q6）はローンチ後レトロに持ち越し

---

## 0. この文書の目的

**短期**: Next.js 16 で発生している `middleware.ts` → `proxy.ts` の命名変更にどう対応するかの、**単発判断はすでに済んでいる**（後述 §3）。この文書はそれを報告するだけでなく、**「今後同種の事象が繰り返し起きるのをどう捌くか」** の戦略を他の AI と議論するための土台。

**長期**: AI 協業で作るプロジェクトにおける **仕様書とプラットフォームの主従関係** を整理し、Farmille v1 以降の運用 SOP を立ち上げる。

この文書を受け取る AI へ: 末尾 §7 の「問いかけ」に対する見解を返してほしい。可能なら、各問いに対する複数の選択肢と、あなたが推す案を理由付きで示してほしい。

---

## 1. プロジェクト前提（他 AI 向けの最低限のコンテキスト）

Farmille は BS 資材（生物・微生物農業資材）の農家レビュープラットフォーム。

- **スタック**: Next.js 16.2.4 + React 19 + TypeScript + Tailwind 4 / FastAPI + Python 3.12 / Supabase (PostgreSQL + Auth + Storage)
- **デプロイ**: Vercel (frontend) / Railway (backend)
- **開発体制**: ソロ（CTO の酒井が主）+ Claude Code による実装代行
- **フェーズ**: v1 ローンチ前。4/21〜4/30 スプリントで認証フロー実装中
- **設計哲学**: DOA (Data-Oriented Architecture) 最優先。データ層は技術負債ゼロ、UI はバイブコーディングで爆速
- **4ロール権限体系**: `farmer` / `ja_staff` / `researcher` / `maker` / `unassigned`
- **仕様書の扱い**: `docs/specs/*.md` を「実装の唯一の正」とする。Claude Code は曖昧点・矛盾を見つけたら止めて質問する運用

関連ドキュメント:
- `CLAUDE.md` — プロジェクト全体方針
- `docs/architecture.md` — BFF パターン・4 ロール体系
- `docs/specs/auth-flow.md` — 今回問題が発覚した認証フロー仕様書
- `docs/decisions/` — ADR 群（0001: Railway 採用、0002: レビュー投稿 3 ロール、0003: Storage RLS パス強制）
- `frontend/AGENTS.md` — 「This is NOT the Next.js you know」という Claude 向け警告

---

## 2. 発生した事象の事実記述

### 2.1 一次事実（検証済み）

| 項目 | 内容 | 出典 |
|---|---|---|
| Next.js バージョン | 16.2.4 | `frontend/package.json:17` |
| 旧ファイル慣習 | `middleware.ts` を project root（or `src/`）に配置、`export async function middleware(req)` | Next.js 15 以前の公式ドキュメント |
| 新ファイル慣習 | `proxy.ts` を project root（or `src/`）に配置、`export function proxy(req)` | `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:11-39` |
| 非推奨宣言 | 「The `middleware` file convention is deprecated and has been renamed to `proxy`」 | 同ファイル L11 |
| 変更バージョン | v16.0.0 | 同ファイル L770 |
| 移行ツール | `npx @next/codemod@canary middleware-to-proxy .` | 同ファイル L754 |
| 命名変更の理由（Next.js チーム公式） | Express.js の middleware と混同されやすい／ミドルウェアへの過度な依存を抑えたい | 同ファイル L735-749 |

### 2.2 仕様書との矛盾箇所

`docs/specs/auth-flow.md` の下記記述が Next.js 16 で破綻する可能性がある：

- L278「**7.3 middleware.ts 骨格**」— ファイル名・関数名の指定
- L280「`import { createServerClient } from '@supabase/ssr'`」を `middleware.ts` 内で使う前提
- L288「`export async function middleware(request: NextRequest)`」
- L483「`frontend/src/middleware.ts`」— 関連ファイル一覧に列挙

仕様書の**意図**（Next.js のリクエスト横断で認証ロジックを挟む）は Next.js 16 でも達成可能。ただし**ファイル名と関数名**は `proxy.ts` / `proxy` に変更が必要。

### 2.3 発見経緯

- 2026-04-21 午後、Claude Code が `docs/specs/auth-flow.md` に基づき認証フロー実装の Phase 2 に着手
- `frontend/AGENTS.md` の警告「This is NOT the Next.js you know — Read the relevant guide in `node_modules/next/dist/docs/` before writing any code」に従い、`node_modules/next/dist/docs/` 内の middleware 関連ドキュメントを検索
- `proxy.md` を発見、冒頭の非推奨通知で矛盾を認識
- 実装を止めて CTO に照会

---

## 3. 即時判断（本スプリント内の対応）

**A 案採用**: Next.js 16 公式に従い `frontend/src/proxy.ts` で実装する。関数名も `proxy` とする。

**理由**:
1. 仕様書の**意図**はファイル名ではなく「Next.js のエッジ/Node 層で認証ロジックを挟む」こと。これは proxy.ts で完全に達成可能
2. 受け入れ条件（`auth-flow.md` §11.5）は機能要件のみで、ファイル名を規定していない
3. `middleware.ts` は deprecated 扱い。動作する可能性はあるが、Next.js 16.x のどこかで警告や非互換が発生しうる
4. `frontend/AGENTS.md` が明示的に Next.js 16 の breaking change への追従を求めている

**ADR 化**: 本スプリント終了時に ADR-0004 として `docs/decisions/0004-nextjs16-proxy-file-convention.md` 起草予定。本 discussion → ADR 昇格の流れ。

**仕様書への追記**: `auth-flow.md` は本スプリント中は更新しない（Claude Code との契約「仕様書 = 唯一の正」を維持するため、途中改訂より事後メモのほうが安全）。スプリント終了後に diff として整理する。

---

## 4. 事象の階層化（何が問題の本体か）

この件は単なる「ファイル名変更」ではない。少なくとも 3 つの層が重なっている。

### 4.1 戦術層: 個別の breaking change への追従

Next.js 16 は 2025 年末〜2026 年初リリース。大型メジャーバージョンで、以下のような breaking change を含む（確認済み／疑い含む）：

| 変更 | 仕様書への影響 | 現時点の把握 |
|---|---|---|
| `middleware.ts` → `proxy.ts` | あり（今回発覚） | ✅ 確認済 |
| `cookies()` の async 化 | あり（`server.ts` は既に対応済） | ✅ 対応済 |
| Server Actions の API 変更 | 可能性あり | 🔍 未確認（Phase 2 の `actions.ts` 実装時に確認予定） |
| Route Handlers の変更 | 可能性あり | 🔍 未確認 |
| React 19 の挙動変化（`use` フック等） | 可能性あり | 🔍 未確認 |
| App Router の conventions | 可能性あり | 🔍 未確認 |

**Claude Code が**今後も実装のたびに `node_modules/next/dist/docs/` を grep し続けるのは効率が悪い。

### 4.2 戦略層: 仕様書とプラットフォームの主従関係

仕様書 `auth-flow.md` は Section 0 で「実装の唯一の正」と宣言している。しかし：

- **仕様書は人間（CTO）が書いた**時点の前提を凍結している
- **プラットフォーム（Next.js/Supabase/FastAPI）は**独立に進化する
- 両者が矛盾したとき、**どちらが優先**されるべきか？

現在の運用: 「仕様書 > プラットフォーム。ただし矛盾を見つけたら Claude Code が止めて質問、CTO が都度判断」

これで回るのは今回のような**明白な命名変更**まで。もっと微妙なケース（API 引数の追加、推奨パターンの変化、パフォーマンス上の新しい best practice）では「矛盾」と気づかず実装が進んでしまうリスクがある。

### 4.3 プロセス層: AI 協業時の検知・通知・意思決定フロー

- **検知**: 現状は Claude Code が実装中に偶然発見する運用。体系的な事前検知はない
- **通知**: 発見時の判断形式は「A 案 / B 案 を提示して CTO 決裁」という型が運用されている（今回の挙動は型通り）
- **記録**: 決定は ADR に昇格、単発事象は setup-log.md に残す、中間状態は本 `discussions/` に溜める、という **3 層運用** を暫定採用。ただし境界が曖昧
- **仕様書のメンテ**: 「スプリント中は凍結、終了時に diff 反映」という運用。ただし反映漏れ時のガードがない

---

## 5. プロジェクト当事者として把握している制約

他の AI が提案を投げるにあたり、以下の **Farmille 固有の制約** を踏まえてほしい。

### 5.1 フェーズ制約
- **v1 ローンチが 2026-04-30（もしくは直後）**。本スプリントは「綺麗さより機能」
- ローンチ後 3 ヶ月でレトロ（2026 年 8〜9 月想定）
- レトロまでは「運用で回す」、レトロで「SOP 化・自動化」という 2 段ロケット

### 5.2 人的リソース制約
- **ソロ開発**。CTO が設計・実装・レビューを兼ねる
- 仕様書維持コストを下げたい（書き直しが発生するなら最小限で）
- Claude Code（Opus 4.7）を実装代行として継続使用する前提

### 5.3 技術負債の容認レベル
- **データ層**（Supabase migration / RLS / Pydantic スキーマ）: 負債ゼロ（DOA 原則）
- **UI 層**: バイブコーディング許容。後で差し替え前提
- **プロセス/運用層**: 現フェーズは最小。ローンチ後に強化

### 5.4 AI 協業の現実
- 仕様書は CTO が書いているが、**起草段階で AI を使う**ケースもある
- 実装は Claude Code がメイン
- 将来「別の AI（ChatGPT/Gemini 等）」からのセカンドオピニオンも想定
- セッション間でコンテキストが切れるため、文書の自己完結性が重要

---

## 6. 候補となる対応方針（Claude Code 視点の初期案）

以下は Claude Code の初期見解。他 AI への叩き台として提示する。

### 6.1 仕様書構造の改訂案

**案 α**: 仕様書冒頭に「Platform Assumptions」セクションを追加
```markdown
## 0.5 Platform Assumptions (at time of writing)
- Next.js 16.2.4 (proxy.ts convention, async cookies())
- React 19.2.4
- @supabase/ssr 0.10.2
- Python 3.12, FastAPI 0.xxx
- 仕様書の記述がこれらバージョンの慣習と矛盾した場合、
  プラットフォーム側を優先する。仕様書は事後アップデート対象。
```
- **pros**: 仕様書自身が「自分はこの時点のスナップショット」と明示する
- **cons**: 起草者が毎回バージョンを拾う手間。後から乖離する

**案 β**: 仕様書は意図だけ書き、実装詳細（ファイル名・関数シグネチャ等）は書かない
- **pros**: プラットフォーム変更に強い
- **cons**: Claude Code への指示が曖昧になり、実装のブレが増える

**案 γ**: 仕様書の「実装詳細」セクションにタイムスタンプを付け、`auth-flow.md` を pre-implementation / post-implementation の 2 層で管理
- **pros**: 凍結と追従の両立
- **cons**: 文書が冗長

### 6.2 検知プロセスの改善案

**案 A**: 仕様書起草時に Claude Code へ「該当バージョンの公式 docs を参照してから書け」を徹底する pre-spec-drafting skill
- 本件は auth-flow.md 起草時に `node_modules/next/dist/docs/` を参照していれば防げた可能性が高い

**案 B**: スプリント開始時に「仕様書 × 現在バージョン」の妥当性チェックを Claude Code に走らせる（spec-validator agent）
- CI 化できれば定期実行可能

**案 C**: Breaking change の情報源（Next.js blog / Supabase changelog / Pydantic release notes）を継続監視する bot を立てる
- オーバースペック気味。v2 以降に検討

### 6.3 記録先の整理案

現在:
- ADR (`docs/decisions/`): 意思決定が確定したもの
- Spec (`docs/specs/`): 実装契約
- Setup log (`docs/setup-log.md`): 環境構築ログ
- Discussions (`docs/discussions/`): 本件。中間議論 **← 新規追加**

提案: この 4 層を明示化し、`docs/README.md` に「どこに何を書くか」のルールを追記する。

---

## 7. 他の AI に問いかけたいこと

### Q1. 今回の判断（A 案）の妥当性
Next.js 16 の `proxy.ts` 規約を採用したことについて、スプリント中の現実解として妥当か？他に見落としている観点があれば指摘してほしい。

### Q2. 仕様書の主従関係
「仕様書は実装の唯一の正」という原則と「プラットフォームの破壊的変更にはファイル名レベルで追従」という挙動は両立可能か？両立するとしたら、どのような書式上の工夫で明示できるか？§6.1 の α/β/γ 以外にもっと良い案はあるか？

### Q3. AI の独断可否ライン
「ファイル名のリネーム」は Claude Code 独断で追従してよい粒度か？それとも都度確認が必要か？もし独断可とするなら、どこまでを独断可、どこからを人間決裁とする線引きが妥当か？具体的には下記のうち:

- (a) ファイル名変更・関数名変更の mechanical rename
- (b) API 引数の追加（既存が動き続ける後方互換ある変更）
- (c) API 引数の破壊的変更（呼び出し側書き換え必須）
- (d) 推奨パターンの変化（実装方針が変わる）
- (e) アーキテクチャ方針の変化（BFF パターンの再構築など）

どこまで Claude Code が**勝手に追従して事後報告**でよいか？

### Q4. Breaking Change 検知の現実解
ソロ開発 + AI 協業で、毎回 `node_modules/.../docs/` を Claude Code に grep させる運用は持続可能か？持続しないならコストの割に効果がある打ち手は何か？§6.2 の A/B/C 以外の案は？

### Q5. 仕様書の寿命設計
`auth-flow.md` は 2026-04-21 起草、2026-04-30 実装完了予定。Next.js 16 のマイナーバージョンが上がる頻度を考えると、3 ヶ月後には何箇所か古くなる。**仕様書を「永続文書」として保つべきか、「実装ログ（一度実装したら凍結）」として扱うべきか**？

### Q6. ADR との関係
今回のような「プラットフォーム起因のファイル名追従」を ADR にすべきか？ ADR にするほどの戦略決定ではない気もするが、記録しないと将来の AI が `middleware.ts` を復活させる危険がある。**軽量な「追従ログ」**のようなカテゴリを増やすべきか、それとも ADR で十分軽く書けるか？

### Q7. 将来の AI への引き継ぎ
本文書を別の AI（ChatGPT / Gemini / 次セッションの Claude）が読んだ時、必要な情報は揃っているか？不足している情報（文脈・意思決定の経緯・制約）があれば列挙してほしい。

---

## 8. 考えるべき観点（未整理のメモ）

ここは結論を急がず、他 AI への議論材料として残す。

- **Next.js 16 の寿命**: v16 が次の大型アップデートまで何ヶ月か？ v17 で `proxy.ts` が再度変わる可能性は？ Vercel の過去のリネーム履歴を見ると短命化リスクがある
- **Supabase SDK の変化**: `@supabase/ssr` 0.10 系は cookies API の破壊的変更が頻発。同種の事件が再発する可能性が高い。Supabase に特化した監視を組むべきか
- **FastAPI / Pydantic v2**: 現在 v2 系だが、v3 移行時に Pydantic モデルの書き方が変わる可能性
- **React 19 の影響**: Server Components / Server Actions / `use` フック等、React 19 固有の挙動に仕様書が言及していない
- **docs/design-tokens.md との整合**: 別途 shadcn/ui 前提で書かれているが、shadcn/ui 自体のバージョン更新追従も同じ問題を孕む
- **メーカー向け UI (v2)** 実装時に再発する確度は高い。仕様書起草プロセスに Next.js docs 参照を組み込むのが筋か
- **Claude Code のコンテキスト cost**: 毎セッション `node_modules/next/dist/docs/` を読み直すのはトークン消費大。キャッシュ or skill 化で軽減可能

---

## 9. 次のアクション（暫定）

本件の短期フロー:

1. [即時] A 案で `proxy.ts` として実装（本スプリント内）
2. [スプリント終了時] `setup-log.md` に「Next.js 16 proxy 規約を採用」を記録
3. [本文書への反応待ち] 他 AI の見解を集める（Q1-Q7）
4. [ローンチ前] ADR-0004 起草（`proxy.ts` 採用の正式決定）
5. [ローンチ後レトロ（2026 年 8〜9 月）] Q2/Q3/Q4/Q6 への回答をもとに「仕様書 × プラットフォーム追従 SOP」を起草

---

## 10. 他 AI への依頼テンプレ（コピペ用）

以下は CTO が他 AI セッションを開始するときに貼るテンプレ:

> Farmille プロジェクトの技術判断について相談したい。
> `docs/discussions/001-nextjs16-proxy-rename.md` を読んでから、
> §7 の Q1-Q7 それぞれに対する見解を述べてほしい。
> 各 Q に対し:
>   - あなたの結論（1 行）
>   - 選択肢が複数ある場合は比較
>   - Farmille 固有の制約（§5）を踏まえた推奨
>   - 見落としている観点があれば指摘
> の形式で返してほしい。簡潔に、ただし遠慮なく。

---

**以上**
