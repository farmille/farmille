# Farmille 引き継ぎドキュメント（索引）

新しく Farmille に参画するエンジニア向けの引き継ぎ資料一式です。現 worker（Ryoga）から
別エンジニアへ開発を引き継ぐための土台として用意しています。

> このディレクトリ（`docs/handoff/`）は「引き継ぎ用にまとめ直した読み物」です。
> **意思決定の正（Single Source of Truth）は `docs/decisions/`（ADR）と `docs/specs/`** にあり、
> 矛盾を見つけたら ADR / spec を優先してください。

---

## まず何を読むべきか（推奨順）

1. **`docs/handoff/onboarding.md`** … 本体。プロダクト概要・技術スタック・ローカル起動・
   アーキテクチャ原則・デプロイ順序・既知の地雷・進行中の作業まで一通り。**最初に通読**してください。
2. **`docs/handoff/access-checklist.md`** … 着任初日に必要なアクセス権の棚卸し。
   「誰に何を依頼すれば動ける状態になるか」のチェックリスト。
3. リポジトリ既存ドキュメント（下表）を必要に応じて深掘り。

---

## リポジトリ内の主要ドキュメント早見表

| 目的 | ファイル |
|------|---------|
| 設計哲学・コーディング規約・型生成・依存監査 | `CLAUDE.md`（リポジトリ直下） |
| 非エンジニア向け全体像（核となる読み物） | `docs/farmille-system-overview-ja.md` |
| アーキテクチャ（レイヤー・データフロー・API一覧） | `docs/architecture.md` |
| DB論理設計（テーブル・RLS・トリガー） | `docs/database.md` |
| Git 運用ルール（ブランチ・コミット・PR・デプロイ相互作用） | `docs/git-workflow.md` |
| 意思決定の正（ADR 0001-0015） | `docs/decisions/`（一覧は onboarding.md §8） |
| 機能別 spec（実装契約） | `docs/specs/`（索引は onboarding.md §8） |
| デザイントークン（色/タイポ/余白/禁止事項） | `docs/design-tokens.md` |
| Next.js 改変版の重要注意 | `frontend/AGENTS.md` |
| 設計判断の思想辞書（スキル） | `.claude/skills/farmille-architecture-principles/SKILL.md` |

---

## 重要な前提（5秒で押さえる）

- **これは普通の Next.js ではない。** 改変版（v16.2.6）で訓練データと挙動が違う。コードを書く前に
  `frontend/node_modules/next/dist/docs/` の該当ガイドを読むのが規約（`frontend/AGENTS.md`）。
- **DOA（Data-Oriented Architecture）最優先。** UI は爆速で作り直せるが DB は不可逆。
- **BFF（FastAPI）が第一防御、RLS が第二防御。** frontend から `supabase.from/rpc` を呼ばない
  （`auth.*` / `storage.*` のみ例外）。
- **デプロイは順序厳守。** migration を先に適用してからアプリを出す（詳細は onboarding.md §7）。
- **frontend と backend のデプロイ系統は別。** main への push で自動更新されるのは Vercel（frontend）だけ。
  backend（Cloud Run）は手動デプロイ。

---

## 引き継ぎ完了の目安

- [ ] access-checklist.md の全項目に権限が付与され、ローカルで `make dev` が起動できる
- [ ] onboarding.md §9「既知の地雷」を理解した
- [ ] onboarding.md §7「デプロイ順序」を理解し、本番に触る前に Ryoga と一度ペアで流した
- [ ] §11 のステークホルダー窓口（誰に何を聞くか）を把握した
