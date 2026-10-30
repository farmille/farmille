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
| ブラウザAPIなど外部システムとの同期 | `src/lib/hooks/`の用途別カスタムフックに閉じ込める |

フォームの送信結果と入力値は所有者を分ける。TanStack Formの入力をServer Actionsへ渡し、送信結果は`useActionState`で扱う。Reactによる送信後のreset、項目エラー、先頭エラーへのフォーカス、未保存入力の復元を維持する。DOMの未制御入力をフォームの状態管理に使わない。

入力検証には既存のValibotスキーマを使う。共通`Form`の`validate`で送信前と送信後の再入力を検証し、項目エラーとフォーカスは共通の入力部品で扱う。Server Actionsでは受け取った入力を検証する。未保存の変更は、現在の入力と保存済みの入力を比較して判定する。

サーバーデータをキャッシュするためにZustandへ複製しない。Contextは単一ツリーの部品接続に使い、`useSyncExternalStore`はブラウザなど外部の値を購読するために使う。アプリが保持する状態を広く共有する場合はZustandを使い、ページ移動とログアウトでいつ破棄するかを決める。

URLには機密情報、大きなデータ、入力途中の高頻度な変更を載せない。検索の未確定文字列とIME変換中の状態は局所化し、確定した検索条件をURLへ反映する。通常のページリンクはそのまま使う。

## Effectの境界

`useState`とreact-hook-formは使わない。`useEffect`・`useLayoutEffect`を使えるのは、`src/lib/hooks/`で公開する用途別カスタムフックの内部だけとする。Reactの名前空間参照や別名importでも同じ規則を適用する。

イベントに応じた処理はイベントハンドラに置き、派生値はrender中に計算する。Effectは購読、DOM計測、タイマー、外部リソースの寿命管理などの同期に限る。汎用的にコールバックと依存配列を受け取るEffectラッパーを作らない。`useLayoutEffect`への置換で境界を迂回しない。

## 機械検査とレビュー

lintでは禁止APIとライブラリの参照、Effectを置けるパスを検査する。Story・テストを含む自前コードを対象とし、依存パッケージと生成物は対象外とする。画面に直接書く名前付き入力は、`value`・`checked`の指定漏れも検査する。入力を所有するライブラリ部品、固定のhidden値、ブラウザが所有するfile入力はこの検査から除く。

状態の重複、URLに載せる必要性、共有範囲、フックが用途を持つかはレビューで確認する。API名だけから断定できない設計判断をlintの例外リストで代用しない。

判断の参考資料はkenchandayo（2025）の[Next.js App Routerの状態管理 判断ガイド](https://zenn.dev/dev_commune/articles/nextjs-state-management-guide)。APIの用法は[TanStack Form公式ガイド](https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts)と[nuqs公式ガイド](https://nuqs.dev/docs)を参照する。
