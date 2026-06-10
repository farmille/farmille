# Git 運用ルール

Farmille プロジェクトでの Git 運用指針。ソロ開発〜小規模チーム移行までを想定。

---

## 1. ブランチ戦略

### 基本構成

| ブランチ | 役割 | push権限 |
|---|---|---|
| `main` | 本番デプロイ対象。常にデプロイ可能な状態を保つ | **直接pushしない**（初期スキャフォールディング後） |
| `feat/*` | 新機能開発 | 本人 |
| `fix/*` | バグ修正 | 本人 |
| `chore/*` | ビルド/設定/依存関係などコード外の変更 | 本人 |
| `docs/*` | ドキュメントのみの変更 | 本人 |
| `refactor/*` | 挙動を変えないリファクタリング | 本人 |

### ブランチ命名例

```
feat/review-post-form
feat/maker-product-register
fix/auth-jwt-expiry
chore/upgrade-next-16
docs/update-adr-railway
refactor/split-auth-router
```

**ルール:**
- 英小文字・ハイフン区切り
- 課題内容が一目でわかる短い名前
- プレフィックスは必ず付ける（後述のコミット種別と揃える）

### なぜ `develop` ブランチを使わないか

ソロ〜小規模開発では `main` + feature ブランチの **GitHub Flow** で十分。`develop` を挟む **Git Flow** はリリースサイクルが長い大規模開発向け。v1 スコープでは不要。将来リリースブランチが必要になった段階で再検討。

---

## 2. コミットメッセージ規約

### フォーマット（Conventional Commits 準拠）

```
<type>: <subject>

[optional body]

[optional footer]
```

### type 一覧

| type | 用途 |
|---|---|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `chore` | ビルド/設定/依存更新/.gitignore など |
| `docs` | ドキュメント変更のみ |
| `refactor` | 挙動を変えないリファクタリング |
| `test` | テスト追加/修正 |
| `style` | フォーマット・typoなど（機能影響なし） |
| `perf` | パフォーマンス改善 |

### subject のルール

- **命令形・現在形**（"added" ではなく "add"）
- 末尾にピリオドを付けない
- 50文字以内を目安
- 日本語でも英語でもOK（プロジェクト内で統一）

### コミット例

```
feat: add review post form with image upload

- Implement POST /v1/reviews endpoint
- Add image upload to Supabase Storage
- Add Zod validation schema

Refs: FARM-123
```

```
fix: handle expired JWT in BFF auth middleware
```

```
chore: ignore .claude/ local state files
```

```
docs: update architecture.md with 4-role diagram
```

### コミット粒度

- **1コミット = 1論理変更**
- "WIP" や "work in progress" を含むコミットを main に残さない（PR merge時に squash推奨）
- 複数の変更を1コミットに詰め込まない（レビュー不能・revert困難になる）

---

## 3. Pull Request 運用

### PRを立てるタイミング

| 状況 | PR 必須？ |
|---|---|
| 新機能・バグ修正 | ✅ 必須 |
| 依存パッケージの更新 | ✅ 必須 |
| `.env.example` の変更 | ✅ 必須（漏れ防止） |
| ドキュメントのみ | 任意（セルフmerge可） |
| 初期スキャフォールディング | 不要（履歴に残るだけ無駄） |

**`main` への直接 push は厳禁（Vercel 連携済）。** 誤 push が即本番フロントデプロイに繋がる。

### PR タイトル / 本文

- **タイトル:** コミットメッセージと同じ規約（`feat: xxx`）
- **本文テンプレ:**

```markdown
## 概要
<何をやったか1〜3行>

## 変更点
- <箇条書きで主要変更>
- <DBスキーマ変更があれば明記>

## 動作確認
- [ ] ローカルで `make dev` 起動確認
- [ ] 該当画面/APIの手動動作確認
- [ ] 型チェック (`pnpm tsc --noEmit`) 通過
- [ ] 関連する既存機能に影響なし

## スクリーンショット
<UI変更時のみ>

## 関連
- Issue #XXX
- ADR #NNNN
```

### レビュー・マージ方針

- **ソロ期間:** セルフレビュー後マージ（ただし最低1晩寝かせると判断ミスに気付きやすい）
- **チーム化後:** レビュアー 1名以上の approve 必須
- **マージ方式:** **Squash and merge** を基本とする（main の履歴を論理変更単位で綺麗に保つ）
- **マージ後:** ブランチは削除（GitHub の "Automatically delete head branches" を有効化）

### ブランチ保護ルール（`main`、ADR-0016 で有効化）

引き継ぎ開発フェーズに入ったため、以下を `main` に適用する:

- [x] Require a pull request before merging
- [x] Require approvals（1 名以上）
- [x] Require review from Code Owners（`.github/CODEOWNERS` の sensitive パス）
- [x] Require status checks to pass before merging（必須: `frontend (lint / typecheck / test)`）
- [x] Require conversation resolution before merging
- [ ] Do not allow bypassing — **CTO 単独運用の間は administrators バイパスを許可**（CTO が自分の sensitive PR を merge できるようにするため）。新規 dev は非管理者なので PR・承認・CODEOWNERS で完全にゲートされる。reviewer 増員後にバイパス禁止へ。

PR テンプレ（`.github/PULL_REQUEST_TEMPLATE.md`）と CI（`.github/workflows/`）も同 ADR で導入済み。
backend の status check は当面 advisory（既存腐敗のため、ADR-0016）。

---

## 4. デプロイとの相互作用

### Vercel (フロント) / Cloud Run (バック) のデプロイ

| ブランチ | Vercel (frontend) | Cloud Run (backend) |
|---|---|---|
| `main` | Production に自動デプロイ | **自動デプロイなし**。`bash backend/deploy-prod.sh` で手動（ADR-0013） |
| `feat/*` 等 | Preview URL を自動生成 | デプロイされない |
| PR | Preview URL が PR に自動コメント | — |

> 注: `railway.toml` は ADR-0013 で退役済み。backend は Cloud Run（`asia-northeast1`）で手動デプロイ。
> 本番への自動導線は **Vercel(`main` merge) のみ**である点が、本番フリーズ運用（§10）の前提。

### 事故を防ぐために

1. **main への push は merge 経由のみ**。`git push origin main` を手動実行しない
2. **env var の変更は .env.example の PR と、Vercel（frontend）/ Cloud Run `deploy-prod.sh`・Secret Manager（backend）の手動更新をセットで**行う
3. **DBスキーマ変更** は migration ファイル追加 → PR → merge 後に `supabase db push` を手動実行（自動化しない）
4. **破壊的変更**（RLS変更、カラム削除、ロール変更）は Slack で事前告知

---

## 5. 機密・ローカル専用ファイル

以下は `.gitignore` 済。コミットしようとすると事故になるので注意。

| パス | 理由 |
|---|---|
| `.env`, `.env.local`, `.env.*.local` | 認証情報が含まれる |
| `node_modules/` | ビルド成果物 |
| `.next/`, `out/` | Next.js ビルドキャッシュ |
| `.venv/`, `__pycache__/` | Python仮想環境・バイトコード |
| `.claude/` | Claude Code のローカル状態（スケジュール・設定） |
| `supabase/.temp/` | Supabase CLI の一時ファイル |
| `.DS_Store` | macOS メタデータ |

### 誤ってコミットしてしまった場合

```bash
# まだ push していない場合
git rm --cached <file>
git commit --amend --no-edit

# 既に push してしまった場合（認証情報ならキーをローテート + 以下）
git rm --cached <file>
git commit -m "chore: untrack <file>"
git push

# 履歴からも消したい場合 (git-filter-repo 推奨、force push 必須 → 事前にチームに周知)
```

**認証情報を push してしまったら、まずキーローテーション、次に履歴削除。** 順番を間違えると間に合わない。

---

## 6. 日常的な操作チートシート

### 作業開始

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/new-feature
```

### 作業中の PR 向け push

```bash
git add -p  # 変更を確認しながら部分add
git commit -m "feat: xxx"
git push -u origin feat/new-feature
gh pr create --web   # または GitHub Web でPR作成
```

### 他人の PR をローカルで動作確認

```bash
gh pr checkout 123
make dev
```

### main の最新を自ブランチに取り込み（コンフリクト解消前）

```bash
git switch feat/my-branch
git fetch origin
git rebase origin/main   # 線形履歴を保ちたい場合
# または
git merge origin/main    # merge commit を残してもよい場合
```

**ルール:** `rebase` は自分のブランチのみ。共有ブランチ (`main`) は rebase しない。

### 直前のコミットを取り消し（未 push）

```bash
git reset --soft HEAD~1   # 変更は残したままコミットだけ戻す
git reset --hard HEAD~1   # 変更ごと破棄（慎重に）
```

### push 済みコミットの取り消し

```bash
git revert <commit-hash>   # 打ち消しコミットを新規作成（推奨）
# force push は main では絶対にしない
```

---

## 7. タグ・リリース

### タグ付け（v1 リリース以降）

- **Semantic Versioning** (`vMAJOR.MINOR.PATCH`) を採用
- リリース時に `main` に対してタグを付ける

```bash
git switch main
git pull
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### GitHub Release

- タグに対して GitHub Release を作成
- Release note には変更内容サマリ・DBマイグレーション有無・環境変数変更の有無を明記

---

## 8. 例外運用

### hotfix

本番障害時の緊急修正:

```bash
git switch -c hotfix/critical-bug main
# 修正 → commit
git push -u origin hotfix/critical-bug
# PR作成 → レビュー簡略化してmerge → 即デプロイ
```

**hotfix 後は必ず同じ修正が develop 的ブランチ（将来導入時）にも反映されているか確認する。**

### revert of revert

一度 revert したコミットを復活させる場合:

```bash
git revert <revert-commit>  # revertをrevertする
```

または cherry-pick で元コミットを再適用。

---

## 9. 判断に迷ったら

- **`main` を壊しそうな不安を感じたら実行しない** — 一晩置くか、詳しい人に相談
- **force push の誘惑は振り切る** — ほぼ全てのケースで revert の方が安全
- **コミットメッセージが書きにくい＝コミットが大きすぎるサイン** — 分割を検討

---

## 10. 本番フリーズ運用（ADR-0016）

**本番に更新を出せない期間**は、PR の作成・レビュー・approve までは通常通り行い、
**`main` への merge を保留**する（プロセス凍結）。

- 本番への自動導線は **`main` への merge（Vercel 本番デプロイ）のみ**。merge しなければ本番に出ない。
- backend は元々 `main` push で自動デプロイされない（Cloud Run 手動、§4）。
- フリーズ中の merge 可否は **CTO 判断**。解除後にまとめて merge する。
- PR テンプレの「本番フリーズ確認」チェックで意図を明示する。

引き継ぎ者向けの実務フロー・環境変数・「触らない」一覧は
[docs/onboarding-handoff.md](onboarding-handoff.md) を参照。

---

**最終更新**: 2026-06-10（ADR-0016: ブランチ保護有効化 / Cloud Run 反映 / 本番フリーズ §10 追加）
