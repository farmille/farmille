# Farmille farmer プロフィール必須化 仕様 (Phase 12c)

**作成日**: 2026-04-25
**対象**: farmer の初回レビュー投稿フロー手前にプロフィール（prefecture / city / 作目 1 件以上）入力 step を差し込み、プロフィール 0 件問題を即解消
**作業ブランチ**: `feat/post-launch-hardening-3-farmer-onboarding`（派生元: 12a or 12b merge 後の `main`、独立着手可）
**実装担当**: worker
**位置づけ**: 軽量受け入れ条件（`launch-polish.md` と同水準）
**前提 Phase**: Phase 11（launch polish）完了。12a / 12b との依存はないが、auth まわりの衝突を避けるため 12a merge 後を推奨

> **実装ステータス（2026-04-25）**: **保留中（条件付き起票）**。Q6=A 採用時のみ本 spec を起点に実装。Q6=B / C 採用時は本 spec 不要、Phase 13 progressive onboarding（動的 nudge）または別 Phase に統合。

---

## 0. ゴール / 縮退ライン

### 0.1 ゴール

**必達**:
- farmer（reviewer 系ロール）が初回レビューを投稿しようとするとき、プロフィール（最低限の必須項目）が未設定なら投稿フォームに進めず、プロフィール入力 step を経由させる
- 必須項目が揃っているとレビュー投稿フォームに直接進める
- maker / 既プロフィール完了済 farmer には影響なし

### 0.2 縮退ライン（落ちても v1.5 送り可）

- **プロフィール step での「あとで入力」スキップボタン**: v1 では必須化（スキップ不可）、v1.5 で 1 度のみ skip を許容する案も検討可

### 0.3 翌日送り（本 Phase 対象外）

- 動的 nudge（Phase 13 / v1.5）
- maker 側のプロフィール必須化（v1 では空状態 CTA でカバー、Phase 11a 実装済）

---

## 1. 画面一覧

| パス | 種別 | 変更内容 | 権限 |
|---|---|---|---|
| `/products/[id]` のレビュー投稿フォーム | Server + Client | プロフィール未完了 farmer に対しては、レビュー投稿フォームを **プロフィール入力 form** に差し替え（または直前にプロフィール step を挟む） | reviewer 系ロール |

新規ページなし。既存 `/products/[id]` の review-form 内部での分岐拡張。

---

## 2. データ書き込み方針（skill §1.3 厳守）

- プロフィール書き込みは BFF 経由（既存 `farmer_profiles` 書き込みパスを再利用）
- レビュー投稿は従来パスのまま

---

## 3. DB スキーマ変更

**migration なし**。`farmer_profiles` 行は「未設定 = 不在」で表現（Phase 11 launch-polish §0.3 翌日送り項目で確定済）。

---

## 4. FastAPI エンドポイント

### 4.1 既存 endpoint の再利用 or 拡張

- プロフィール完了判定: `GET /v1/onboarding/status`（既存）or `farmer_profiles` 行存在チェック
  - 「最低限の必須項目（prefecture / city / 作目 1 件以上）」が揃っているかの判定ロジックを追加する必要があるか検討
  - 既存 endpoint で十分なら拡張しない、不足なら `GET /v1/me/profile-completion` 等の新設を検討
- プロフィール書き込み: 既存の onboarding farmer form と同じ endpoint を使うか、新規 `PATCH /v1/me/farmer-profile` を作るか

**Q6=A 採用時の追加判断**:
- 既存 endpoint 流用 vs 新設は worker 判断 default で「既存流用」を推奨（YAGNI）
- 完了判定ロジックは BFF or Server Component どちらで持つか要確定

---

## 5. UI 仕様

### 5.1 プロフィール step の出し方（候補）

- **案 A**: review-form のレンダリング時に `getProfileStatus()` を呼び、未完了なら inline でプロフィール form に差し替える（同 page 内 modal or section 切替）
- **案 B**: review 投稿ボタン押下時に未完了検知 → `/onboarding/farmer?next=/products/{id}` へ redirect → 完了後元の page に戻す
- **案 C**: `/products/[id]/post-review` のような専用 step page を新設、未完了なら最初に profile step、完了なら直接 review form

**推奨**: A（最も軽量、既存 review-form の拡張で済む）。Q6=A 採用時に worker 判断で確定。

### 5.2 プロフィール step の必須項目

- prefecture（都道府県）
- city（市町村）
- 作目 1 件以上（既存の crops 階層から選択）

これらは Phase 4 の onboarding/farmer/_components/farmer-form.tsx に既存項目があるはず（Phase 11 launch-polish §5.1 の判定基準と整合させる）。

### 5.3 完了後の遷移

- プロフィール保存成功 → 同 page でレビュー投稿フォームに切り替え（A 案）
- 「あとで」キャンセル → 元の `/products/[id]` 表示に戻る（レビュー投稿は未完）

---

## 6. 触らないファイル

- `supabase/migrations/*`
- `backend/app/routers/{auth,crops,product_types,product_benefits,certifications,maker,products,reviews}.py`（既存 endpoint 流用、新規 endpoint 追加が必要なら `me.py` を 12b で新設後に拡張）
- `frontend/src/app/(auth)/*`
- `frontend/src/app/onboarding/*`（既存の onboarding flow は触らない、本 Phase は review 投稿フロー側に組み込む）
- `frontend/src/app/maker/*`
- `docs/specs/phase-12a-security-refactor.md` / `phase-12b-features.md`
- `.claude/`

---

## 7. 触るファイル（予想）

### 新規（条件次第）

- `frontend/src/app/products/[id]/_components/review-with-profile-gate.tsx`（A 案採用時、profile + review の段階表示 wrapper）
- `frontend/src/app/api/me/profile-completion/route.ts`（BFF proxy、必要なら）

### 既存修正

- `frontend/src/app/products/[id]/_components/review-form.tsx`（プロフィール未完了時の代替 UI、A 案採用時）
- `backend/app/routers/me.py`（12b で新設済、本 Phase で profile-completion endpoint を追加する場合のみ）

---

## 8. 受け入れ条件

### 8.1 機能

- [ ] プロフィール未完了 farmer がレビュー投稿しようとすると、プロフィール入力 step が表示される
- [ ] プロフィール step で必須項目（prefecture / city / 作目 1 件以上）を入力すると、レビュー投稿フォームに進める
- [ ] プロフィール完了済 farmer はそのままレビュー投稿フォームに到達
- [ ] maker や非ログインユーザには影響なし
- [ ] プロフィール保存と同時にレビュー投稿はしない（2 step を維持）

### 8.2 既存動作の維持

- [ ] Phase 7 既存のレビュー投稿フローが既プロフィール完了 farmer で動く
- [ ] Phase 9 既存のレビュー編集フローが影響を受けない（編集時はプロフィール step を挟まない）

### 8.3 ビルド / 検証

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` 警告なし
- [ ] `pnpm build` 全ルート生成成功
- [ ] backend `from app.main import app` 成功
- [ ] E2E 手動確認: 新規 farmer signup → 初回レビュー投稿 → プロフィール step → レビュー投稿成功

---

## 9. 設計上の注意

### 9.1 既存 onboarding/farmer form との重複回避

- onboarding/farmer/_components/farmer-form.tsx は signup 直後の onboarding 用
- 本 Phase では review 投稿前の「不足プロフィール補完」用に同じ form 部品を再利用するか、簡略版を作るか判断要
- 推奨: 既存 form を component 化して再利用（DRY）。ただし署名 / 必須項目の差分が大きいなら別 component 化も妥当

### 9.2 プロフィール完了判定の境界

- 「prefecture / city / 作目 1 件以上」を必須項目とするが、既存 farmer がいつ「未完了」になるかの判定が UX に影響
- launch-polish.md §5.1 で farmer プロフィール nudge バナー候補として議論された判定基準と一致させる
- 既存 farmer（Phase 4 onboarding を通った既ユーザ）は基本的に prefecture / city を入れている前提だが、作目を入れてないユーザもいる可能性。Q6=A 採用時に Ryoga 確認

### 9.3 アナリティクス

- Phase 11a で `review_submit` イベントは発火済
- 本 Phase で「プロフィール step に到達した」「プロフィール step を完了した」の 2 イベント追加を推奨（離脱率の可視化）
- イベント名: `profile_gate_shown` / `profile_gate_completed`

---

## 10. Ryoga 判断

凡例: ✅ 確定 / ⏸ 実装保留中 / ❓ 再開時に Ryoga 判断

- **Q6** ⏸: **farmer のレビュー投稿時プロフィール必須化の起票要否**:
  - 案 A: 本 Phase 12c として起票（推奨、+0.5-1 日の工数）
  - 案 B: Phase 13 progressive onboarding（動的 nudge）と統合
  - 案 C: 別 Phase 12.5 起票
  - 推奨: A（Phase 12 が「post-launch UX 強化」スコープに合致、Phase 13 まで先送りすると farmer のプロフィール 0 件問題がローンチ後しばらく続く）
  - **再開時 Ryoga 判断**（A 採用なら本 spec を起点に着手、B / C なら本 spec 廃案）

Q6=A 採用後の追加判断（worker 判断 default 可）:
- 必須項目セット（prefecture / city / 作目）の確定
- §5.1 案 A / B / C の選択（推奨: A）
- §4.1 endpoint 流用 vs 新設

---

## 11. 作業スケジュール + commit 方針

### 11.1 作業スケジュール

| Step | 内容 | 見込み |
|---|---|---|
| 1 | Q6=A 確定（Ryoga） | Ryoga 側 |
| 2 | プロフィール完了判定ロジック（既存 endpoint 流用 or 新設） | 1-2h |
| 3 | review-form のプロフィール gate UI（§5.1 A 案） | 半日 |
| 4 | アナリティクスイベント追加（`profile_gate_shown` / `profile_gate_completed`） | 30 分 |
| 5 | 検証（`pnpm tsc/lint/build`、E2E） | 1-2h |
| 合計 | | **約 0.5-1 日** |

### 11.2 commit 構成（1 commit）

```
1. feat(onboarding): progressive farmer profile prompt before first review submit
```

---

## 12. 関連 spec / ADR

- `docs/specs/phase-12a-security-refactor.md`: 12a の security/refactor（先行推奨）
- `docs/specs/phase-12b-features.md`: 12b の `/me/reviews` + `me.py` 新設（本 Phase の前提条件ではないが、`me.py` ができていれば endpoint 追加が楽）
- `docs/specs/progressive-onboarding.md`: Phase 13 動的 nudge（本 Phase は静的、Phase 13 が動的版）
- `docs/specs/launch-polish.md` §5.1: farmer プロフィール nudge バナー（spec revision で削除済、本 Phase で別形式で実装）
- `docs/specs/auth-flow.md`: Phase 4 onboarding の farmer form 設計

---

**以上（Q6=A 採用時に着手、それ以外は廃案）**
