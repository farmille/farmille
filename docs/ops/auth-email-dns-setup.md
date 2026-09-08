# Farmille認証メールのDNS設定

farmille.comのDNSを管理する担当者向けの設定依頼です。

## 変更範囲

お名前.comのfarmille.comゾーンに、以下の3レコードを追加してください。既存のWebサイト用レコード、MX、SPF、ネームサーバーは変更しません。Resendのメール受信機能は使用しません。

登録済みの同名レコードがある場合は、上書きせず内容を確認してください。追加費用が発生する契約変更は不要です。

## 目的

一般ユーザー・メーカー・運営に、アカウント確認とパスワード再設定のメールを届けます。認証メールの送信元は `noreply@auth.farmille.com` とし、Resendを利用します。

## 設定先

対象はお名前.comで管理する `farmille.com` のDNSレコード設定です。アプリのファイルやSupabaseのDBを変更する作業はありません。2026年9月8日にResendの東京リージョンで表示された設定値です。

### 1．DKIM署名用のTXTレコード

- ホスト名は `resend._domainkey.auth` とする
- 種別は `TXT` とする
- TTLは `3600` とする
- 値は以下を改行せずに入力する

```text
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDduxcAfPa930fNM8dnqKr/yXwoAjbXDF+HK7HVPrAW0xEXHn054dbvpO3uw4o6snHMLR++2oLN13vzti1citZ8rRlgTRuni6+tL4lxgISq/7ZKpCVesMCIi/qMBcGjS4aJPWKNFbvqzn17RCgQ/jt1Dmb8yv+u/xgFnZbhuaw3fwIDAQAB
```

### 2．送信用のCNAMEレコード

- ホスト名は `rsend.auth` とする
- 種別は `CNAME` とする
- 値は `rsend-apne1.forge.rmta.net` とする
- TTLは `3600` とする

### 3．送信用のCNAMEレコード

- ホスト名は `send.auth` とする
- 種別は `CNAME` とする
- 値は `send.forge.rmta.net` とする
- TTLは `3600` とする

画面がホスト名の末尾に `.farmille.com` を付ける場合は、上記の短いホスト名を入力してください。完全な名前を要求する画面では、それぞれに `.farmille.com` を付けます。

## 確認方法

保存後、設定内容を読み返して3件の値が一致していることを確認してください。DNSへの反映は次のコマンドでも確認できます。

```bash
dig +short TXT resend._domainkey.auth.farmille.com
dig +short CNAME rsend.auth.farmille.com
dig +short CNAME send.auth.farmille.com
```

設定した値が返ればDNS側の作業は終了です。アプリ担当者がResendでドメイン認証を実行し、本番でメールの受信とパスワード再設定を確認します。

## 確認が必要な場合

同名レコードの衝突、管理権限の不足、追加費用が発生する場合は変更せず、その内容をアプリ担当者に伝えてください。通常の追加であれば、3件の保存と読み返しまで進めて構いません。
