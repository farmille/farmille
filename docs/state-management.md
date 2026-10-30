# 状態管理規約

状態を追加する前に、propsから計算できる値か、コンポーネント分割や合成で局所化できる値かを確認する。既存の値から求められる値を別のstateに複製しない。

## 状態の所有者を決める

| 対象 | 管理方法 |
| --- | --- |
| DBなどに保存されたデータの読み取り | Server Componentsから`src/server/`を呼ぶ |
| サーバーへの書き込みと送信結果 | Server Actionsと`useActionState`を使う |
| フォームの入力値 | TanStack Formを使う |
| 共有・履歴・復元が必要なURLクエリ | nuqsを使い、URLを正とする |
| 複数の独立したコンポーネントから広く参照するクライアント状態 | Zustandを使う。まずpropsとコンポジションで局所化できるか確かめる |
| 開閉・選択・表示モードなどの局所的なUI状態 | `useReducer`を使う。関連する遷移は同じreducerにまとめる |
| ブラウザAPIなど外部システムとの同期 | マウント時の同期は`useMountEffect`、外部の値の購読は`useSyncExternalStore`を使う |

フォームの送信結果と入力値は所有者を分ける。TanStack Formの入力をServer Actionsへ渡し、送信結果は`useActionState`で扱う。Reactによる送信後のreset、項目エラー、先頭エラーへのフォーカス、未保存入力の復元を維持する。DOMの未制御入力をフォームの状態管理に使わない。

入力検証には既存のValibotスキーマを使う。共通`Form`の`validate`で送信前と送信後の再入力を検証し、項目エラーとフォーカスは共通の入力部品で扱う。Server Actionsでは受け取った入力を検証する。未保存の変更は、現在の入力と保存済みの入力を比較して判定する。

サーバーデータをキャッシュするためにZustandへ複製しない。Contextは単一ツリーの部品接続に使い、`useSyncExternalStore`はブラウザなど外部の値を購読するために使う。アプリが保持する状態を広く共有する場合はZustandを使い、ページ移動とログアウトでいつ破棄するかを決める。

URLには機密情報、大きなデータ、入力途中の高頻度な変更を載せない。検索の未確定文字列とIME変換中の状態は局所化し、確定した検索条件をURLへ反映する。通常のページリンクはそのまま使う。

## Effectを使わない

`useState`とreact-hook-formは使わない。`useEffect`・`useLayoutEffect`・`useInsertionEffect`は直接呼ばない。Reactの名前空間参照や別名importでも同じ規則を適用する。マウント時に外部システムと同期する処理だけ、`src/lib/hooks/use-mount-effect.ts`の`useMountEffect`を使う。`useMountEffect`は依存配列を受け取らず、マウント時に一度だけ実行して、アンマウント時に後片付けする。

依存配列で再実行を組み立てると、無関係に見える変更で実行条件が変わり、無限ループや競合が起きやすい。Effectで書きたくなったら、次の順に置き換えを検討する。

1. 派生値はrender中に計算する。propsや別のstateをなぞるだけのstateを作らない。`useEffect(() => setX(f(y)), [y])`と書きたくなったら、`const x = f(y)`にする。
2. サーバーデータはServer ComponentsとServer Actionsで読み書きする。Effectで取得してstateに入れない。
3. 利用者の操作に応じた処理は、イベントハンドラかactionを待った直後に書く。stateをフラグにして、Effectで実処理を動かさない。送信結果に応じた遷移・再取得・計測・後片付けも、送信した処理の続きに書く。
4. 外部システムとの同期は`useMountEffect`で書く。前提条件がそろってから子コンポーネントをマウントし、Effectの中で条件分岐しない。DOM要素に付ける購読は、cleanupを返すref callbackでもよい。
5. IDやpropsが変わったら作り直す処理は、`key`で再マウントする。依存配列で状態をリセットしない。

`useMountEffect`のコールバックが最新のpropsを読む必要があるときは`useEffectEvent`で包む。`useMountEffect`を包んで依存配列を受け取るフックを作らない。

## 機械検査とレビュー

lintでは禁止APIとライブラリの参照を検査し、Effectの直接呼び出しは`useMountEffect`の実装だけに認める。Story・テストを含む自前コードを対象とし、依存パッケージと生成物は対象外とする。画面に直接書く名前付き入力は、`value`・`checked`の指定漏れも検査する。入力を所有するライブラリ部品、固定のhidden値、ブラウザが所有するfile入力はこの検査から除く。

状態の重複、URLに載せる必要性、共有範囲、`useMountEffect`の前提条件をマウントの条件で表しているかはレビューで確認する。API名だけから断定できない設計判断をlintの例外リストで代用しない。

判断の参考資料はkenchandayo（2025）の[Next.js App Routerの状態管理 判断ガイド](https://zenn.dev/dev_commune/articles/nextjs-state-management-guide)と、Alvin Sng（2026）の[Why we banned React's useEffect](https://x.com/alvinsng/status/2033969062834045089)。Effectの置き換えはReact公式の[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)を参照する。APIの用法は[TanStack Form公式ガイド](https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts)と[nuqs公式ガイド](https://nuqs.dev/docs)を参照する。
