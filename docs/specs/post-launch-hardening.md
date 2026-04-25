# Farmille v1 ローンチ後 UX + セキュリティ強化（Phase 12 索引）

**作成日**: 2026-04-25
**位置づけ**: **Phase 12 全体の索引**。詳細仕様は 12a / 12b / 12c の 3 ファイルに分割済

> **実装ステータス（2026-04-25）**: **Phase 12 全体保留中**。Ryoga 判断により v1 ローンチ後の優先度判定まで未着手。本索引と 12a/12b/12c の各 spec は将来再開時の参照用としてアップデート済。

---

## 0. なぜ 3 分割したか

Phase 12 はもともと「farmer の `/me/reviews` + 画像 UX 強化 + 認証/セキュリティ強化」をひとまとめにしていたが、以下の理由で **12a / 12b / 12c の 3 PR 構成** に分割:

- **依存関係の差**: 12a (auth refactor) は Q1 / Q6 と独立、12b (new features) は Q1 確定後、12c (farmer profile) は Q6=A 採用時のみ
- **review 負担**: 6-7 commits を 1 PR にまとめると review が重い。Phase 11 の a/b 分割と同じ運用感
- **着手順序**: 12a の `getSession→getUser` 置換と 12b の auth 周辺修正が衝突する可能性があるため、12a を先に merge する制約を明示化

---

## 1. 各 Phase の概要

| Phase | spec | 範囲 | 工数 | 依存 |
|---|---|---|---|---|
| **12a** | [`phase-12a-security-refactor.md`](./phase-12a-security-refactor.md) | `getSession→getUser` 置換（13 箇所）/ Storage RLS 監査 / ADR-0007 起票 / `launch-polish.md` §10.4 例外明文化（Q5=B）| 約 1 日 | なし、先行可 |
| **12b** | [`phase-12b-features.md`](./phase-12b-features.md) | `/me/reviews` ページ + BFF / 画像 10MB 化 / drag & drop sort | 約 2.5-3 日 | 12a merge 後（auth 衝突回避）/ Q1 確定 |
| **12c** | [`phase-12c-farmer-profile.md`](./phase-12c-farmer-profile.md) | farmer プロフィール必須化（初回レビュー投稿手前に profile gate）| 約 0.5-1 日 | Q6=A 採用時のみ起票 |

**全体工数**: Q6=A 採用時 約 3.5-5 日 / Q6=B/C 採用時 約 3.5-4 日

---

## 2. Ryoga 判断サマリ

凡例: ✅ 確定 / ⏸ 実装保留中 / ❓ 再開時に Ryoga 判断

| Q | 内容 | 状態 | 帰属 |
|---|---|---|---|
| Q1 | Storage バケット設定変更方法（Dashboard / `config.toml`）| ❓ 再開時 | 12b |
| Q2 | `/me/reviews` のページネーション → **20 件固定** | ✅ 確定 | 12b |
| Q3 | `getSession`→`getUser` 置換のスコープ → **全箇所統一** | ✅ 確定 | 12a |
| Q4 | drag & drop の a11y → **v1.5 送り** | ✅ 確定 | 12b |
| Q5 | `storage.list` 直叩き解消 → **B（spec 例外明文化）** | ✅ 確定 | 12a |
| Q6 | farmer プロフィール必須化の起票要否 | ⏸ 再開時 | 12c |

詳細は各 spec の §10 / §11 参照。

---

## 3. 着手順序ガイド（再開時）

1. **Q1 / Q6 を Ryoga 確定**（12b と 12c の起票要否を決める）
2. **12a 着手**（Q1 / Q6 と独立、即着手可）→ merge
3. **12b 着手**（Q1=A or B 確定後、12a の auth 改修と衝突しない状態で派生）→ merge
4. **Q6=A 採用時のみ 12c 着手**（独立着手可、12a / 12b いずれかの merge 後）

12a / 12b の並列化は理論上可能だが、`getSession→getUser` 置換が衝突するため非推奨。

---

## 4. 関連 spec / ADR

- `docs/specs/launch-polish.md`: Phase 11 (a/b) 仕様、§10.4 が 12a で例外条項追加対象
- `docs/specs/progressive-onboarding.md`: Phase 13 動的 nudge（v1.5 候補、12c の動的版に相当）
- `docs/decisions/0003-storage-rls-path-enforcement.md`: 既存 Storage RLS 設計
- `docs/decisions/0005-jwt-verification-strategy.md`: JWT 検証方針
- `docs/decisions/0007-storage-rls-audit.md`: 12a で起票予定（ADR-0006 は url-namespace-policy で取得済のため 0007 にずらし）

---

**以上（詳細は各 spec ファイル参照）**
