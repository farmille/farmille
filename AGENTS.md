# Farmille の作業ガイド

BS資材（生物・微生物農業資材）の農家レビュープラットフォーム。このファイルにはコードを書くときの決まりだけを置く。機能の仕様・用語・運用の記録は下の資料にあり、ここへ書き写さない。

## 資料の置き場

| 置き場 | 内容 |
|---|---|
| `docs/rebuild/*-SPEC.md` | 機能ごとの仕様 |
| `GLOSSARY.md` | ドメインの用語 |
| `docs/ui-terminology.md` | 画面の表記 |
| `docs/ops/` | 運用の記録と手順。鍵の扱いと Supabase の既知の落とし穴は `docs/ops/security-notes.md`、手元での確認は `docs/ops/local-verification.md` |

資料に無い仕様を、実装の都合で決めない（「止まって確認する条件」を参照）。

## 技術スタック

- アプリ：Next.js 16（App Router・Turbopack）／TypeScript／Panda CSS／Vercel。画面とサーバー処理を1つのアプリにまとめる
- DB・Auth・Storage：Supabase（PostgreSQL）
- UI の土台：Base UI（`@base-ui/react`）。通知は Sonner、認証コードの入力は input-otp
- 監視：Sentry ＋ GA4
- 品質ゲート：oxlint（主）＋ ESLint（補完）／oxfmt／tsc／Vitest／Storybook／Playwright／GitHub Actions

## 設計の考え方

**DOA（Data-Oriented Architecture）を最優先する。**

- データモデルは技術負債を作らない。第3正規形を守り、JSONB の濫用で正規化を逃げない
- UI は作り直せるが DB は戻せない。破壊的な ALTER より「新テーブル＋データ移行＋旧削除」
- UI もデータ層と同じ基準で作る（型安全・fail fast・トークン経由・実画面での検証）。データ設計の決定を覆す UI は作らない

## 実装規約

- **型**：`any` を書かない。DB・API の戻り値は `database.types.ts` から派生させ、ページごとに手書きの重複型を作らない
- **境界の検証**：`response.json()`・`JSON.parse()`・フォーム入力など、実行時まで内容を保証できない値は Valibot のスキーマで検証し、`InferOutput` で型を導出する。`as`、`JsonObject`、`Record<string, unknown>`、手書きの `typeof` 判定で型の根拠を作らない
- **アイコン**：SVG アイコン・lucide・react-icons は使わない。Google Material Icons を `material-icons` パッケージのフォントから読み、共通 `Icon`（`src/components/Icon.tsx`）経由で使う。足りない glyph は `Icon` に追加する（ロゴ・グラフ・イラストの SVG は対象外）
- **anti-slop**：全ルールを `error` のまま適用する。違反は実コードの型と境界設計を直して解消し、ルールの無効化・警告化、ignore の追加、disable コメント、広い型への言い換えで回避しない
- **vendored lint**：`tools/oxlint/` は lint 実装の取り込み先として扱い、診断を通す目的で内部実装を編集しない。`tools/oxlint/anti-slop/` は [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) の commit `6d538555cb151d4121ed51a27db81890eacf8ae9` を取り込んだもの。更新時は upstream の差分をそのまま取り込み、ルールの変更が必要ならアプリ側の修正で対応できない根拠を先に示す
- **スタイル**：色・余白・角丸・タイポの生値をコンポーネントに直書きしない。すべて Panda のトークン経由。条件分岐は recipe の variant として列挙し、実行時に決まる動的値をスタイルへ渡さない。棒の長さや計測した位置のように実行時にしか決まらない値は、`style` 属性へ CSS 変数（`style={{ "--bar-width": … }}`）だけで渡し、`css()` の側で `var()` を使って受ける
- **トークンに無い値**：`panda.config.ts` の `strictTokens` により、トークンを持つプロパティ（色・余白・寸法・角丸・z-index など）へトークン以外の値を書くと tsc が止まる。1回しか出ない寸法・`calc()`・CSS のキーワードは角括弧で書き（`"[50%]"`・`"[inherit]"`）、3か所以上に出るデザインの値はトークンにする。色は角括弧で生値を書かない（`[inherit]`・`[none]` と、`token(colors.…)` を混ぜた式だけを ESLint が通す）
- **文字**：大きさと行高は `textStyle` の役割（`src/theme/textStyles.ts`、一覧は `/dev/tokens`）から選び、色は呼び出し側で足す。文字色はパレットの段（`primary.700`・`ink2` など）ではなく、置く面に合わせた役割トークン（`text.brand`・`text.brandOnSoft` など）から選ぶ。役割に無い組み合わせが3か所に出たら役割を足す
- **UI 部品**：フォーム部品・ダイアログ・通知・開閉・候補つきの入力は、`src/components` の共通部品（フォーム部品は `src/components/form`）を使う。`@base-ui/react` と `sonner` は `src/components` の中でだけ import する（外からは ESLint の `no-restricted-imports` で止まる）。足りないものは共通部品に足し、画面ごとに作らない
- **入力欄のラベル**：`Input`・`Textarea`・`Select`・`Combobox`・`Autocomplete`・`FileInput`・`OtpInput`・`CheckboxGroup`・`RadioGroup` は `label` が必須で、見出し・必須/任意・案内・エラーを部品の props で受け取る（`<Input label="ニックネーム" name="handle" requirement="required" />`）。画面に出さない名前は `hideLabel`、枠の className は `fieldClassName`。`Field`・`Fieldset` は、1つの見出しで複数の要素をまとめるときだけ使い、中の部品には `label={null}` を付ける
- **状態とデータ取得**：取得は Server Components、変更は Server Actions か Route Handlers に寄せる。クライアント側の状態は入力フォームとトグルに限る
- **fail fast**：環境変数・必須パラメータが無い場合はフォールバックせずエラーにする。`?? "http://localhost:3000"` のような既定値を書かない
- **エラー表示**：例外を握り潰さない。404・403・500 をユーザーに意味の伝わる日本語で出し分ける（`error.tsx`・`not-found.tsx` を必ず置く）
- **完了の定義**：型チェックと lint が通っただけでは完了としない。**375px の実画面で対象フローを操作し、スクリーンショットを添えて初めて完了**
- **共通化**：同じ UI パターンを3回書く前に共通コンポーネント化する。ページ内に長大なインライン JSX と業務ロジックを同居させない
- **Story の title**：画面に依存しない基礎部品は `Components/<役割>/<名前>`、画面に依存する部品は置き場のルートに沿って `Pages/<ルート>/<名前>`、複数画面で使うが基礎部品と言えないものは `Pages/Shared/<名前>`、デザイントークンは `Tokens`。ルート画面の Story（`Page`・`Error`・`NotFound`・`Loading`）は `Pages/<ルート>`。基礎部品を整えたら、`Pages/Shared` から `Components` へ移す
- **ファイル名と Story**：独自コンポーネントの `.tsx` ファイル名は PascalCase にする（例：`ProfileEditForm.tsx`）。Story は `ProfileEditForm.stories.tsx` として、すべての独自コンポーネントに置く（`pnpm check:stories` で確かめる）。`page.tsx`・`layout.tsx`・`error.tsx`・`not-found.tsx` など、App Router の予約ファイルだけは小文字のままにする

## 構造の決まり

- `src/server/` がドメインロジックと Supabase アクセスの唯一の置き場。`SUPABASE_SECRET_KEY` はここからのみ参照する
- 画面・クライアントコンポーネント・Server Actions から Supabase のテーブルと RPC（`.from()`・`.rpc()`）を直接呼ばない（`auth.*`／`storage.*` のクライアント利用のみ可）。この節の2項目と、「スタイル」「文字」の CSS 変数・文字色の決まりは `pnpm lint`（`eslint.config.mjs` の `no-restricted-syntax`）が検査する
- Route Handlers（`src/app/api/`）はフォーム POST・Webhook・外部から叩かれるものだけに絞る。画面内の読み取りは Server Components から `src/server/` を直接呼ぶ
- 環境変数は `src/env.ts` の1箇所で起動時に検証する。ホスティング固有の環境変数をコードで参照しない
- エラーレスポンスは `{ok: false, error: "<code>"}` に統一する。エラーコード → 日本語文言の辞書は `src/server/errors.ts` の1箇所に置く
- migration は適用済みファイルの編集禁止・修正は常に新規ファイル。main への push 後に CI（`.github/workflows/ci.yml` の deploy ジョブ）が dev と本番へ適用する

## 型生成（`pnpm gen:types`）

Supabase の DB スキーマから `src/types/database.types.ts` を再生成する。migration を dev プロジェクトへ適用した直後、マスタデータの seed を変えた直後、カラムの追加・削除・型変更の直後に流す。流し忘れると `Database` 型が古いまま残り、`tsc --noEmit` が通っても実体と型がずれる。migration を含む PR には必ず `pnpm gen:types` の差分を含める。

## 検証

新しい worktree では、最初に `pnpm setup:worktree` を流す（`.env.local` の写し・install・migration の遅れの確認。中身は `docs/ops/local-verification.md`）。

```bash
pnpm lint && pnpm format:check && pnpm exec tsc --noEmit && pnpm exec vitest run && pnpm check:stories && pnpm build
```

UI を変えたときは、Storybook のレスポンシブ検査（全 Story を 320〜1440px の 13 幅で横にはみ出さないこと）と E2E も流す。

```bash
pnpm build-storybook && pnpm test:storybook:responsive
pnpm test:e2e:local
```

レスポンシブ検査は `storybook-static/` を 6106 番で配信して検査する。6106 番を別のプロセス（dev Storybook や別 worktree の検査）が使っていると `is already used` のエラーで止まるので、そのプロセスが終わってから流す。dev Storybook は `pnpm storybook`（6076 番）で起動する。

`pnpm test:e2e:local` は、54321 のローカル Supabase の起動の確認・CI の E2E ジョブ（`.github/workflows/ci.yml`）と同じ環境変数・migration の突き合わせ・資材マスタの投入をまとめて行ってから E2E を流す（中身は `docs/ops/local-verification.md`）。Supabase の起動と migration の適用はユーザーに確認してから行う。CI はこれらに加えて `pnpm audit --audit-level=high` を回す。すべて緑になっても完了ではない（実装規約の「完了の定義」を参照）。

## 依存の監査

CI が `pnpm audit --audit-level=high` で止める。`npm audit` は使わない（pnpm に揃える）。`critical`／`high` は hotfix で先に塞ぐか、別 PR で固定する。`moderate` 以下は起票する。

## ディレクトリ

- `styled-system/`：Panda の生成物。gitignore し、`pnpm install` と CI で codegen する
- `supabase/migrations/`：v2 系の migration（`config.toml` も併せてコミットする）
- `tools/migration/`：資材マスタの移行スクリプト。`legacy/` は旧実装の参照実装と退避した旧 migration（移行の検証用）
- `docs/email-templates/`：Supabase Auth のメールテンプレート

## 止まって確認する条件

- 実装中に仕様との矛盾・不明点が出たら、コードで勝手に解釈せず止まって確認する
- 仕様を変える必要が出たら、先に該当する資料を直す
- 1タスク＝1ブランチ＝1 worktree＝1エージェント。同じファイルを触るタスクを並行させない
- スキーマ変更を伴うタスクは単独の PR に分ける
- 完了報告は「変更点・実行した検証（成功／失敗／skip）・未確認事項」の3点。検証を通していないものを完了と呼ばない

## トラブルシューティング

- **型エラーが出る** … migration 適用後に `pnpm gen:types` を流したか確認する。解消しない場合は migration ファイル自体を確認する
- **Panda のスタイルが効かない** … `panda.config.ts` を変更したら codegen の手動再実行が必要（CI は codegen → tsc の順）。動的値をスタイルへ渡していると静的解析で生成漏れになる
- **環境変数が無いと言われる** … `src/env.ts` は意図的に fail fast。既定値で逃げず `.env.local` に値を入れる
- **ホームが「internal」で落ちる** … `pnpm check:migrations` でローカル DB の migration の遅れを確かめる。DB は worktree 間で共有しているので、適用はユーザーに確認してから
- **lint の指摘が二重に出る** … oxlint と ESLint の役割分担（`eslint-plugin-oxlint` で oxlint 実装済みルールを off）を確認する
