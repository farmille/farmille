# Farmille Progressive Onboarding 仕様 (Phase 13 / v1.5 候補)

**作成日**: 2026-04-25
**対象**: ユーザーの行動履歴に応じた動的 nudge（in-app 通知）による段階的オンボーディング
**作業ブランチ**: 未定（Phase 11 完了済 / Phase 12 実装保留中。launch 後のアナリティクス結果を見てから起票）
**実装担当**: worker
**位置づけ**: **v1 ローンチ後の拡張機能（v1.5 候補）**。launch 前に実装しない
**前提 Phase**: Phase 11（launch polish）完了、**v1 ローンチから少なくとも 2 週間経過してアナリティクスデータが溜まった後**

> **実装ステータス（2026-04-25）**: **保留中（v1.5 候補）**。Phase 11 で計画していた静的 nudge バナーは spec revision で Phase 12 に押し出され、その Phase 12 全体も保留に入った。本 Phase 13 起票は launch 後のデータドリブン判定に依存するため、それまで spec はあくまで初期構想として保管。

---

## 0. このドキュメントの位置づけ

### 0.1 なぜ launch 前に実装しないか

- 動的 nudge の内容 / タイミングを事前に決めても、実際のユーザー行動を観察する前では外す確率が高い
- Edge Functions を使う実装コストが高く、v1 の検証サイクルを遅らせるリスクがある
- v1 では maker `/maker/products` の空状態 CTA（Phase 11a 実装済）と、Phase 12c が起票されればその静的 farmer プロフィール prompt のみがカバー範囲。動的 nudge は v1.5 で初めて検討
- アナリティクス（`sign_up_complete` / `review_submit` / `product_create` 等）のデータが溜まってから、「どこで離脱するか」「何を促すべきか」を数値で決める方が設計が正しくなる

### 0.2 いつ起票するか

以下の条件が揃ったら起票検討:
1. v1 ローンチから 2 週間以上経過
2. アナリティクスで主要ユーザー行動（登録 → 初レビュー、登録 → 初資材登録）の funnel が見える
3. 静的 nudge バナーだけでは離脱が防げないことが数値で示される
4. Ryoga が「次の優先度」として判定する

---

## 1. ゴール（想定）

### 1.1 必達（起票時に確定）

- ユーザーのログイン回数 / 特定アクション有無に応じて、in-app メッセージが自動表示される
- メッセージは farmer / maker で内容が分岐する
- メッセージを消した履歴を記録し、同じメッセージを連続表示しない

### 1.2 例: 想定される nudge パターン

- **farmer 向け**:
  - 登録 3 日経過 + レビュー 0 件 → 「気になる資材にレビューを書いてみましょう」
  - レビュー 1 件投稿済 + 7 日経過 → 「他の資材も試してレビューを増やしましょう」
  - プロフィール住所未設定 → 「住所を登録すると作目提案の精度が上がります」（v1.5 で住所ベース提案機能を前提）
- **maker 向け**:
  - 登録 3 日経過 + 資材 0 件 → 「最初の資材を登録して、農家からのレビューを受け取りましょう」
  - 資材 1 件登録 + 14 日経過 + レビュー 0 件 → 「資材画像を追加すると検索に強くなります」

具体的な文言と発火条件は、ローンチ後のデータから決める（現時点ではあくまで候補例）。

---

## 2. 技術構成（想定）

### 2.1 アーキテクチャ候補 A: Supabase Edge Functions

- Edge Functions（Deno ランタイム）で cron 実行（例: 1 日 1 回 02:00 UTC）
- `users` / `reviews` / `products` を走査し、条件に合うユーザーに `nudges` テーブルへ行を INSERT
- Frontend は `/v1/me/nudges` を polling or realtime subscription で取得し、UI 表示
- メッセージを dismiss したら `nudges.dismissed_at` に書き込み

### 2.2 アーキテクチャ候補 B: BFF 同期判定

- ユーザーがログイン / ページ遷移するタイミングで BFF が条件を判定
- `/v1/me/nudges` を毎回計算して返す（DB 永続化なし）
- シンプルだが「最後に見せたのはいつか」を記憶できないため、同じ nudge が連続表示される

### 2.3 推奨

候補 A（Edge Functions + `nudges` テーブル永続化）。シンプルさでは B だが、UX 上「同じメッセージを出し続ける」のは不快なので A が妥当。

---

## 3. DB スキーマ変更（想定）

### 3.1 新規: `nudges` テーブル

```sql
CREATE TABLE nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,  -- e.g. "farmer_first_review_prompt"
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_url TEXT,        -- optional, CTA ボタンの遷移先
  cta_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ  -- user が消したらセット
);

CREATE INDEX nudges_user_active ON nudges(user_id) WHERE dismissed_at IS NULL;

-- RLS: 本人のみ SELECT / UPDATE 可
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY nudges_select_own ON nudges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY nudges_update_own ON nudges
  FOR UPDATE USING (user_id = auth.uid());
-- INSERT は service_role（Edge Functions）のみ
```

---

## 4. FastAPI エンドポイント（想定）

### 4.1 `GET /v1/me/nudges`

アクティブな nudge（`dismissed_at IS NULL`）を最新順に取得。

### 4.2 `POST /v1/me/nudges/{id}/dismiss`

nudge を dismiss（`dismissed_at = NOW()`）。

---

## 5. Edge Functions（想定）

### 5.1 `supabase/functions/generate_nudges/index.ts`

```typescript
// cron 日次実行。各ユーザーを走査し、条件に合致したら nudges INSERT。
// 同種の未 dismiss nudge がある場合は skip（重複防止）。
```

デプロイ: `supabase functions deploy generate_nudges`
cron 設定: Supabase Dashboard > Database > Cron（`pg_cron`）or Edge Functions schedules

---

## 6. UI（想定）

### 6.1 Nudge カード表示

- `/products` / `/maker/products` / `/me/reviews` の上部に、アクティブ nudge があれば表示
- 「閉じる」ボタンで dismiss
- CTA ボタン付き（`cta_url` へ遷移）

### 6.2 v1 既存の静的 UI との共存

本 Phase 13 が起票される時点で、以下の静的 UI が併存している可能性がある:

- **Phase 11a maker 空状態 CTA**（`/maker/products` の「最初の資材を登録する」、実装済）
- **Phase 12c farmer プロフィール prompt**（Q6=A 採用時のみ起票、実装保留中）

方針:
- 動的 nudge の方が文言を柔軟に調整できるため、同条件のものは段階的に動的側へ寄せる
- ただし maker 空状態 CTA のような「ページ自体の主要 UI として機能」しているものは削除しない（バナーとは別物）
- 移行期に静的 + 動的 nudge が同時に出ないよう、kind と表示位置で重複を抑制する合流ロジックが要る

---

## 7. 受け入れ条件（想定）

### 7.1 機能

- [ ] Edge Functions が cron で日次実行され、条件合致時に nudges INSERT
- [ ] 同じ kind の未 dismiss nudge がある場合、重複 INSERT されない
- [ ] ユーザーが nudge を dismiss すると UI から消え、再表示されない（同じ kind は少なくとも N 日は出ない、N は要決定）
- [ ] nudges の RLS で他人の nudge が見えない / 操作できない

### 7.2 UX

- [ ] 同時に複数 nudge がある場合、優先度順に 1 件のみ表示（全部積むと五月雨になる）
- [ ] CTA ボタンから意図した画面に遷移する

---

## 8. Ryoga 判断（起票時に確定）

- **Q1**: アーキテクチャは A（Edge Functions + `nudges` テーブル）/ B（BFF 同期判定）どちらか？
- **Q2**: 初期 nudge kind の候補（アナリティクス結果を見て決定）
- **Q3**: 文言は worker 提案 + Ryoga 確定か、マーケター任せか
- **Q4**: dismiss 後の再表示抑制期間（7 日 / 14 日 / 永久）
- **Q5**: Phase 11 静的バナーの移行方針（削除 / 吸収 / 共存）

---

## 9. 作業スケジュール（参考）

起票時に再見積もり。現時点の概算:

| Step | 内容 | 見込み |
|---|---|---|
| 1 | `nudges` テーブル migration + RLS | 半日 |
| 2 | BFF `/v1/me/nudges` + `dismiss` endpoint | 半日 |
| 3 | Edge Functions `generate_nudges` + cron 設定 | 1 日 |
| 4 | UI: NudgeCard component + 各ページ統合 | 1 日 |
| 5 | Phase 11 静的バナーの合流 or 削除 | 半日 |
| 6 | 検証（Edge Functions のローカルテスト + E2E） | 半日 |
| 合計 | | **約 3-4 日** |

---

## 10. 関連 Phase / ドキュメント

- `docs/specs/launch-polish.md` §5: Phase 11a maker 空状態 CTA（v1 で実装済の静的 UI）
- `docs/specs/phase-12c-farmer-profile.md`: Phase 12c の静的 farmer プロフィール prompt（保留中、Q6=A 採用時に起票。本 Phase 13 が動的版に相当）
- `docs/specs/post-launch-hardening.md`: Phase 12 全体の索引（12a/12b/12c 分割案）
- `docs/decisions/0005-jwt-verification-strategy.md`: JWT 検証方針（Edge Functions でも適用）
- `docs/decisions/0007-storage-rls-audit.md`: Storage RLS 一覧（Phase 12a で起票予定、保留中）
- アナリティクス結果（launch 後 2 週間分）: 条件設計の根拠データ

---

**以上（v1.5 起票時に再度精査）**
