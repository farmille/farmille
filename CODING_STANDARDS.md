# Farmilleのコーディング規約

「共通」を読み、DB・サーバー処理・UI・lint・依存・設定・テストのうち、作業に該当する節を読む。検証コマンドとpush前の検査は[CIとpush前の検査](docs/ops/ci.md)、起動・DB操作は[ローカル検証手順](docs/ops/local-verification.md)に従う。

## 共通

- データ設計を最優先する（DOA）。データモデルは第3正規形を守り、JSONBで正規化を省略しない。UIもデータ設計に合わせる。
- DB・APIの戻り値は`src/types/database.types.ts`から派生させる。`any`やページごとの重複型を作らない。
- JSON・フォーム入力など実行時まで内容が保証できない値はValibotで検証し、`InferOutput`から型を導出する。`as`、`JsonObject`、`Record<string, unknown>`、手書きの`typeof`判定を型の根拠にしない。
- 必須の環境変数・パラメータが欠けたらエラーにする。暗黙の既定値へフォールバックしない。環境変数は`src/env.ts`で起動時に検証し、ホスティング固有の環境変数を直接参照しない。
- anti-slopは全ルールを`error`のまま適用する。違反は型と境界の設計で解消する。ルール無効化・警告化・ignore・disableコメント・広い型への言い換えで回避しない。

## サーバー処理を変更する

- ドメインロジック・Supabaseのテーブル/RPCアクセス・`SUPABASE_SECRET_KEY`の参照は`src/server/`に置く。画面・クライアント部品・Server Actionsから`.from()`・`.rpc()`を直接呼ばない。クライアントからの`auth.*`・`storage.*`利用は可。
- 画面の読み取りはServer Componentsから`src/server/`を呼ぶ。画面からの書き込みはServer Actionsで行い、送信結果は`useActionState`で扱う。Webhookなど外部からのHTTP要求はRoute Handlersで受ける。クライアントの状態は[状態管理規約](docs/state-management.md)に沿って局所化する。
- `src/app/api/`のRoute HandlersはフォームPOST・Webhook・外部からの呼び出しに使う。
- エラーレスポンスは`{ok: false, error: "<code>"}`に揃え、日本語文言は`src/server/errors.ts`で管理する。例外は握り潰さず、画面では404・403・500を出し分ける。`error.tsx`・`not-found.tsx`を置く。

## DB・migrationを変更する

- 破壊的なALTERより、新テーブルへのデータ移行を経て旧テーブルを削除する方法を選ぶ。スキーマ変更を伴うタスクは単独のPRに分ける。
- 適用済みmigrationは維持し、修正は`supabase/migrations/`へ新規ファイルで追加する。`supabase/config.toml`も併せてコミットする。
- migrationの版（ファイル名の先頭14桁）は、mainにある最新の版より後にする。本番の`supabase db push`は、適用済みの最新より古い未適用の版があると止まる。PRの間にmainへ新しいmigrationが入ったら、mainを取り込み、PRで足したmigrationの版を付け直す。dev・本番に当たる前なので、ファイル名を変えてよい。PRで作り直した関数・ビューをmain側のmigrationも作り直していたら、後から当たる側が先の変更を消すので、mainの定義に重ねて作り直す。
- devへのmigration適用、マスタデータのseed変更、カラムの追加・削除・型変更の直後に`pnpm gen:types`を実行する。migrationを含むPRには`src/types/database.types.ts`の生成差分を含める。型チェックの成功だけではDB実体との一致を確認できない。
- ローカルDBの起動・適用・E2Eによる再作成と停止の条件は、[ローカル検証手順](docs/ops/local-verification.md)に従う。dev・本番への適用経路は[CIとpush前の検査](docs/ops/ci.md)を参照する。

## UIを変更する

画面のデータ取得・更新、状態、エラー表示を変える場合は、[サーバー処理](#サーバー処理を変更する)も読む。

### 状態管理

[状態管理規約](docs/state-management.md)に従い、状態の所有者と破棄するタイミングを決める。フォーム入力はTanStack Form、局所的なUI状態は`useReducer`で扱う。`useState`は使わない。`useEffect`系のフックは直接呼ばず、マウント時の外部同期だけ`useMountEffect`を使う。Story・テストにも同じ規則を適用する。

### 共通部品

- フォーム・ダイアログ・通知・開閉・候補つき入力は`src/components`の共通部品（フォームは`src/components/form`）を使い、不足する機能はそこへ追加する。`@base-ui/react`・`sonner`のimportは`src/components`内に限る。
- 同じUIパターンを3回書く前に共通部品へまとめる。ページ内で長大なJSXと業務ロジックを混在させない。
- `Chip`は選んだ項目と外せる項目に使う。見るだけの作物・効果・資材ジャンルはチップにせず文字で並べる。カードで項目名を付けずに出す作物は`CropLine`、実証詳細レポートの見出しの要点は`ReportFacts`、資材名に添える資材ジャンルは`MaterialGenres`を使う。「栽培作目」「対象作物」のように項目名が付く行や表では、アイコンを付けずに名前だけを並べる。
- アイコンは`@tabler/icons-react`を共通`Icon`（`src/components/Icon.tsx`）経由で使う。不足するアイコンは`Icon`へ追加する。文字記号によるアイコンや他のアイコンライブラリは使わない。ロゴ・グラフ・イラストのSVGは可。
- `Input`・`Textarea`・`Select`・`Combobox`・`Autocomplete`・`FileInput`・`OtpInput`・`CheckboxGroup`・`RadioGroup`は`label`を必須とし、必須/任意・案内・エラーも部品のpropsへ渡す。ラベルを隠す場合は`hideLabel`、枠には`fieldClassName`を使う。
- `Field`・`Fieldset`は1つの見出しで複数要素をまとめる場合に使い、中の部品は`label={null}`にする。

### スタイルと文字

- 色・余白・角丸・タイポはPandaのトークンを使う。条件分岐はrecipeのvariantで列挙する。棒の長さや計測位置など実行時にしか決まらない値は、`style`属性のCSS変数だけで渡し、`css()`側の`var()`で受ける。
- 1回だけ使う寸法・`calc()`・CSSキーワードは角括弧で指定する。3か所以上に現れるデザイン値はトークンにする。色の生値は角括弧にも書かない。色の角括弧指定は`[inherit]`・`[none]`と`token(colors.…)`を使う式に限る。
- 文字の大きさ・行高は`src/theme/textStyles.ts`の`textStyle`を使う。色は呼び出し側から、置く面に対応した役割トークンで指定する。パレットの段を直接指定しない。役割にない組み合わせが3か所に現れたら役割を足す。役割の一覧は`/dev/tokens`で確認する。
- `panda.config.ts`を変更したらcodegenを再実行する。`styled-system/`は生成物として扱う。

### コンポーネントとStory

独自コンポーネントの`.tsx`ファイル名はPascalCaseとし、すべてに同名の`.stories.tsx`を置く。App Routerの予約ファイルだけは小文字のままにする。Storyのtitleは次に揃える。

| 対象                                       | title                      |
| ------------------------------------------ | -------------------------- |
| 画面に依存しない基礎部品                   | `Components/<役割>/<名前>` |
| 画面に依存する部品                         | `Pages/<ルート>/<名前>`    |
| 複数画面で使う、基礎部品以外の部品         | `Pages/Shared/<名前>`      |
| デザイントークン                           | `Tokens`                   |
| ルート画面のPage・Error・NotFound・Loading | `Pages/<ルート>`           |

基礎部品として整えたものは`Pages/Shared`から`Components`へ移す。

375pxの実画面で対象フローを操作し、スクリーンショットを添える。型チェック・lintの成功だけではUIの検証を終えない。

## lint・依存・設定・テストを変更する

Pandaの設定を変更する場合は、[スタイルと文字](#スタイルと文字)も読む。

- `tools/oxlint/anti-slop/`は取り込んだlint実装として扱い、診断を通すために編集しない。基準にしたupstreamのcommitは`tools/oxlint/anti-slop/UPSTREAM.md`に記録し、更新はupstreamの差分をそのまま取り込む。ルール変更が必要な場合は、アプリ側で修正できない根拠を先に示す。
- 自前のlintルールは`tools/oxlint/farmille/`のoxlintプラグインに書き、`pnpm test:lint-rules`で検証する。
- 依存の監査はpnpmを使う。`critical`・`high`はhotfixで先に塞ぐか別PRで固定し、`moderate`以下は起票する。

lintのルールは`.oxlintrc.json`に置く。ESLintには、React Compiler系の`react-hooks`ルールなどoxlintに無いものだけを残す。`eslint.config.mjs`は`.oxlintrc.json`で有効にしたルールをESLint側で無効にする。

## PRを作成・更新する

- PRタイトルは[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)に準じ、原則として`type(scope): 説明`にする。区切りのコロン・括弧は半角とし、コロンの後に半角スペースを置く。
- typeは変更の目的に合わせる。機能追加は`feat`、不具合修正は`fix`、文書は`docs`、動作を変えない構造整理は`refactor`、検証は`test`、CIは`ci`、ビルド・依存は`build`、その他の保守は`chore`を使う。scopeは`reports`・`search`・`agents`・`hooks`のように、変更対象の機能や領域を表す短い英語名にする。リポジトリ全体にまたがり対象を絞れない場合だけscopeを省略し、`type: 説明`にする。
- 説明は日本語で、PR全体の変更を具体的に表す。例は`feat(reports): 実証詳細レポートの区に品種を持たせる`、`fix(hooks): macOSでのhook登録エラーを解消する`。互換性を壊す変更にはコロンの直前に`!`を付け、影響と移行方法をPR本文へ書く。
