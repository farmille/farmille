# パスキー認証

## 導入状況

通常ログイン用パスキーは本番Supabaseで有効化済み（2026-09-10）。一般・メーカー・運営が任意で利用する。運営の追加認証にはTOTPを使用する。

## 本番設定

Supabase Authのログイン用パスキーを利用する。SDKの実験的APIを明示的に有効化する。運営の追加認証は認証アプリによるTOTPを必須とする。

- RP表示名：Farmille
- RP ID：`farmille.com`
- 許可Origin：`https://www.farmille.com`、`https://farmille.com`
- Auth設定：`passkey_enabled`を有効にする。WebAuthn MFAは無効のままにする
- Previewの別ドメインは本番のRPに登録しない。動作検証はローカル専用RPまたは本番ドメインで行う

RP IDを変更すると既存パスキーが利用できなくなるため、運用開始後は変更しない。

ローカルのパスキー検証は`http://localhost:3007`で行う。IPアドレスはRP IDに指定しない。

## 利用手順

1. パスワードでログインする。運営は認証アプリで2要素認証も完了する。
2. 一般会員はマイページの「設定」、メーカーはダッシュボード、運営は運営管理から「パスキーを管理」を開く。
3. 「パスキーを登録する」を選び、端末側の指紋・顔認証・PIN操作を本人が行う。
4. 次回からログイン画面の「パスキーでログイン」を利用する。運営はその後に認証アプリのコードを入力する。

パスワードによるログインも引き続き利用できる。運営の認証アプリは削除しない。パスワード再設定でも認証アプリのコードを使う。パスキーだけでAAL2を満たすとは判定せず、運営のアクセス制御は常にサーバーとRLSで検証する。

## 参照

- [Supabase Passkeys](https://supabase.com/docs/guides/auth/passkeys)
- [Auth設定API](https://supabase.com/docs/reference/api/v1-update-auth-service-config)
