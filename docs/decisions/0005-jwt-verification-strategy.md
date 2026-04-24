# ADR-0005: JWT 検証は JWKS 経由 ES256 を第一、HS256 共有シークレットを後方互換 fallback とする

**ステータス**: Accepted
**決定日**: 2026-04-24
**決定者**: 酒井涼雅（CTO）

## コンテキスト

Supabase Auth は 2024 年後半以降、新規プロジェクトの JWT 署名方式を非対称鍵 **ES256 / JWKS** にデフォルト切替している。`farmille-dev` プロジェクトも新方式で初期化されており、access_token のヘッダは:

```json
{ "alg": "ES256", "kid": "<UUID>", "typ": "JWT" }
```

一方、Phase 1-4 の当初実装では `backend/app/auth/jwt.py:verify_jwt()` が `algorithms=["HS256"]` 固定で `SUPABASE_JWT_SECRET`（legacy HS256 共有シークレット）を使っていた。新方式で発行された token の署名検証が通らず `/v1/auth/register-role` が一律 401 になる障害が 2026-04-21 に発生。応急処置として ES256 / JWKS 対応を実装済だが、選定理由・運用影響・代替案の記録が無く累積負債化していた（Phase 7 / Phase 8 / Phase 9 の reviewer でも起票が申し送られていた）。

Phase 10 でコードローンチ前の負債返済枠として本 ADR を起票する。

## 決定

- **第一検証経路**: JWKS 経由 ES256
  - `backend/app/auth/jwt.py` がトークンヘッダの `alg` を見て分岐
  - ES256（および今後 Supabase が追加する他の非対称アルゴリズム）はプロジェクトの JWKS endpoint `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` から公開鍵を取得
  - JWKS はプロセス内 1 回取得してキャッシュ、`kid` が見つからない場合は 1 度だけ force refresh して再試行
- **第二検証経路（後方互換）**: HS256 共有シークレット
  - `alg == "HS256"` の場合に限り `settings.supabase_jwt_secret` で検証
  - Supabase が将来 HS256 を完全廃止しても問題にならないよう alg ベース分岐で隔離
- **audience は `"authenticated"` 固定**（Supabase Auth の仕様）
- BFF は検証成功した場合のみ payload を返し、どの経路でも失敗したら 401

## Consequences

**良い面**:
- 2026 年以降の Supabase Auth 標準に追従、dev / prod ともに ES256 前提で動く
- HS256 legacy トークンを発行する過去プロジェクトを移行する際も、環境変数 `SUPABASE_JWT_SECRET` が設定されていれば従来通り検証できる
- alg ベース分岐のため、今後 Supabase が EdDSA 等を追加した場合も `_resolve_key` に分岐追加するだけで済む

**悪い面 / 既知リスク**:
- **JWKS ネットワーク障害**: 起動時 1 回の HTTP GET が失敗すると、以降の全リクエストが 401 になる。httpx 同期呼び出しかつ timeout 5 秒。v1 は許容、v1.5 で非同期化 + リトライ検討
- **JWKS キャッシュ TTL なし**: プロセス寿命中キャッシュが残るため、鍵ローテーション頻度が高い場合 `kid` 未発見時の force refresh 1 回がスパイク発生源になる可能性。Supabase の鍵ローテーション実績が読めるまで TTL は入れない
- **HS256 fallback の段階的廃止タイミング未定**: Supabase が HS256 を完全撤廃したら `verify_jwt` の else 分岐を削除する必要。ADR を Superseded にして追跡

## Alternatives considered

- **B 案: HS256 のみ維持**。却下理由: 新規 Supabase プロジェクトで動かない。現状 `farmille-dev` が既に ES256 なので実質選べない
- **C 案: JWT を経由せず BFF でも Supabase JS SDK (`supabase.auth.getUser`) を使う**。却下理由: skill §1.1 で定めた「サーバ側は service_role で集約」原則を崩す。SDK は内部で HTTP 呼び出しを追加発生させるためレイテンシも悪化
- **D 案: Supabase Edge Functions 側で検証してヘッダに付け替える**。却下理由: skill §1.2 ポータビリティ予算に反する（Deno / Supabase 固有）
- **E 案: JWKS を外部ファイル / KV に事前キャッシュ**。却下理由: プロセス起動頻度が低い（Railway 常駐 FastAPI）ため、プロセス内 cache で十分。事前キャッシュは運用コストのみ増える

## 関連ドキュメント

- `backend/app/auth/jwt.py`（`verify_jwt` / `_resolve_key` / `_fetch_jwks`）
- `docs/setup-log.md` §7「バグ修正: Supabase JWT Signing Keys (ES256 / JWKS) 対応」（2026-04-21 の事後ログ）
- `docs/specs/image-edit-and-launch-ready.md` §7.1（本 ADR 起票を求めた Phase 10 spec）
