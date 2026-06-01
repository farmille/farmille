# Farmille プロダクト定例デモ台本 (2026-05-27 / 5-7 分)

**環境**: dev Supabase + localhost:3000 (frontend) + localhost:8000 (backend)
**Supabase URL**: `chgrudbattvmcjxhaskh.supabase.co`
**前提**: `pnpm dev` (frontend) と `uv run uvicorn app.main:app --reload --port 8000` (backend) を起動済

データ:
- products 23件 (うち is_public=true: 15件)
- メーカー 3社 (ICL JAPAN / アグロ カネショウ / 愛知製鋼) + 既存 maker テストアカウント
- application_recipes 98件 / product_images 21件 / product_crops 28件

---

## 0. オープニング (30 秒)

> 「現状はベータ環境(dev Supabase)のデータでお見せします。本日見ていただきたいのは **(1) 農家向けの公開カタログ**、**(2) 運営・メーカー向けの管理画面**、**(3) アドミン権限のセキュリティ実装** の 3 つです。」

---

## 1. 公開カタログ — 農家視点 (90 秒)

`http://localhost:3000/`

- **ホーム** で AgList トーン(濃緑ヒーロー + Sprout ロゴ + 検索 pill)を 5 秒見せる
- 検索バーに **「BIOZ」** とタイプ → 結果に ICL JAPAN の BIOZ シリーズが出る
- 検索結果クリックで `/products` へ → カードグリッド表示
- `/products/[id]` の **BIOZ Diamond** を開く:
  - hero band + 商品名 + メーカー名(ICL JAPAN)
  - 適用作物 / 期待効果 / 注意事項 / 公式効果と Farmille 効果の対比
  - **application_recipes テーブル**(spec 必達)が下部に出る

**言うこと**:
> 「資材のラベル情報・公式効果を構造化して、農家向け平易な日本語(Farmille 効果)に翻訳しています。これは AI で自動翻訳ではなく、農学的監修を経たマスタデータです(DOA: Data-Oriented Architecture)。」

- `/manufacturers` でメーカー 3 + 既存社の一覧 → 「メーカー側からの登録 + admin 承認フロー」前提を強調

---

## 2. 管理画面 — 運営/メーカー視点 (120 秒)

### サインイン + MFA (45 秒、key セキュリティの見せ場)

`/login` で Ryoga admin アカウント(自分)でログイン:

1. メール + パスワード入力 → 「次のステップ: MFA 認証」リダイレクト
2. `/mfa/challenge` で TOTP 6 桁入力 → AAL2 取得
3. `/admin/products` へ着地

**言うこと**:
> 「アドミンは全員 TOTP MFA 必須です(ADR-0012)。AAL1(パスワードだけ)では一切 /admin/* に入れません。Supabase Auth の AAL(Authenticator Assurance Level)を BFF 層と RLS 層の二重で検証しています。」

### admin/products (40 秒)

- 一覧で 23 件、検索/フィルタ/ページネーション動作
- 「公開中: 15件 / 非公開: 8件」のサマリ
- BIOZ Diamond をクリック → 編集画面
- **is_public toggle** を OFF → 保存 → 一覧に戻ると 14 件公開へ
- 戻して 15 件に戻す

### admin/makers (20 秒)

- 既存メーカー一覧(synthetic 3社含む)
- 承認待ち列があれば「却下→理由入力」フローを 1 秒だけ見せる
- 言うこと: 「メーカーは signup → admin 承認の 2 段階。zero-trust 設計」

### admin/users (30 秒)

- 自分以外のユーザを 1 件 role 変更(farmer ↔ ja_staff)
- 「通報」列にバッジ表示(test.m1 に 2 件)→ クリックすると `/admin/reports?status=pending` へ
- 1 ユーザを「凍結」してから「凍結解除」、もう 1 ユーザは「削除」(ソフト削除)
- 「ロールは admin が後から制御可。凍結は spam ユーザへの即時措置、削除は退会処理(復元可)」

### admin/reports (30 秒、目玉)

- queue に 3 件 pending(spam / inappropriate / abuse)
- 1 件選んで「処理する」→ 「解決済」or 「通報自体が spam」or 「却下」+ note 入力
- 「ユーザ対ユーザの通報をキュー化、admin が AAL2 で必ず判断、監査ログとして全件残る」

### admin/products 削除 (15 秒)

- 一覧の行末「削除」ボタンを 1 件試す(soft delete、CASCADE 回避)
- 「公開を一時的に止めるなら is_public toggle、データ整理なら削除。レビューや画像は残る(復元可)」

---

## 3. データモデル — 技術投資家向け (60 秒、必要なら)

`/admin/products/[id]` の編集画面で:

- products テーブルの 30+ 列(general_purpose / primary_compound / mode_of_action / ...)
- 関連テーブル: product_crops / product_certifications / product_benefit_relations / product_application_recipes
- spec link: `docs/specs/admin-aglist-alignment-v2.md`

**言うこと**:
> 「BS資材データを技術負債なしの正規化スキーマで保持(DOA 哲学)。後から AI レコメンドや農学者向け検索を載せても、データ層を作り直さない設計。」

---

## 4. クロージング (30 秒)

- 「次は実メーカー 3社(ICL JAPAN / アグロ カネショウ / 愛知製鋼)の窓口アカウント登録 → 残り 160+ 件の populated データ → prod 移行」
- 「現状は dev、prod は今週末-来週で migration A/B/C 適用 + PR #31 (2FA) merge 予定」

---

## デモ前 5 分チェックリスト

- [ ] backend (port 8000) `curl localhost:8000/healthz` → 200
- [ ] frontend (port 3000) `curl localhost:3000` → 200
- [ ] Ryoga admin で `/signin` → MFA → `/admin/products` 通る
- [ ] `/products` で 15件カード見える
- [ ] `/products/[id]` で application_recipes テーブル表示

## デモ中に押してはいけないリンク

- `/products/new` — maker only、admin だと「権限がありません」が出る
- 検索結果 0 件のクエリ(エンプティステートを練習してなければ避ける)
- `/admin/users` で **自分自身**の role 変更 / 凍結 / 削除(本人行は「操作不可」表示で UI ガード済)
- `/products/[id]` レビューの「このユーザーを通報」を **同じユーザに 2 回押す**(2 回目は `already_reported` 409)
- `/admin/products` で **奥田/Ryosei 関連の products** を誤って削除しない(復元 UI は v1.5+)

## トラブル時のリカバリ

- 500 が出たら `tail -100 /tmp/farmille-backend.log` で原因確認
- MFA TOTP が通らなければ → 1Password「Farmille dev TOTP」を再エンロールではなく、まず時刻ズレを確認(`ntpdate` 不要、Mac の時刻設定確認)
- products 一覧が空 → backend が dev Supabase に繋がってない、`.env` の `SUPABASE_URL` 確認

---

## 投資家向け差別化ポイント(質問されたら)

| 想定質問 | 回答 |
|---|---|
| AI レコメンドあるの? | v1 は AI なし(2026-04-29 会議で決定)。データが 2,000-3,000 件溜まってから AI 導入(品質担保のため) |
| メーカーの incentive? | 月 3000 円(検討中、PRD §9.3)。 v1 は協力メーカーは無料でデータ提供 → レビュー集まる |
| 競合は? | 既存の農業 EC(タキイ/サカタ) + 価格比較サイト。Farmille は **農家による定性レビュー** が差別化 |
| 投稿モデレーション? | レビュー投稿は public.users + farmer_profile 完了済のみ、admin が後から削除可 |

---

## このデモが NOT カバーしている範囲(正直に言う)

- レビュー投稿フロー(F3): UI はあるが投稿モデレーション弱、定例では触らない
- メーカー側ダッシュボード(B7 系): まだ MVP、見せない
- AI(Farmille AI): v1 対象外、データ蓄積後
- prod 環境: 今日は dev のみ
