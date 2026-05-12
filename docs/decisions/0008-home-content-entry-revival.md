# ADR-0008: `/home` をコンテンツ閲覧入口として再定義

**Status**: Accepted
**作成日**: 2026-05-01
**確定日**: 2026-05-11
**起草**: worker session（Phase 18 spec 起草に伴う ADR 起票要請）
**決定者**: 酒井涼雅（CTO）
**関連**: ADR-0006（URL 名前空間 3 層分類）/ docs/specs/home.md（Phase 18）

---

## 1. コンテキスト

ADR-0006「URL 名前空間 3 層分類」は `/home` を「孤児 URL として完全削除」と確定した。根拠は「Farmille は道具型サービス（Twitter / Slack 型）であり、Salesforce 型のハブ dashboard は v1 スコープ外（CLAUDE.md / SKILL §1.4）」というもので、Phase 12 で `/home/page.tsx` を削除する計画だった。

一方、機能要件 `docs/requirements/farmille-v1-functional-requirements.md` §3.1「ホーム画面」は v1 で「やる」確定済みで、AgList の 5 軸ハブ構造 + アイハーブ風 UI 構成を持つ**コンテンツ閲覧入口**として「注目の資材」「最新記事」「自社記事広告枠」「検索バー」を提供する設計が固まっている。

この機能要件 §3.1 は ADR-0006 が想定していた「ロール別 dashboard」とは性質が異なる:
- ADR-0006 が排除した `/home` = ロール別ハブ（farmer 用 / maker 用などのロール固有ビュー）
- 機能要件 §3.1 が定義する `/home` = コンテンツ閲覧入口（ログイン状態に依存しない閲覧体験、ロール別分岐なし）

ADR-0006 の決定を覆さず、`/home` の意味を再定義する必要がある。

## 2. 決定

**Phase 18 で `/home` を「コンテンツ閲覧入口」として再定義する**。

具体的には:

1. `/`（未ログイン）と `/home`（ログイン済）は **同一の構造**を持ち、出し分けはヘッダーのログインボタン / アバターのみ
2. `/home` は **ロール別 dashboard 機能を持たない**（ADR-0006 の精神を継承）
3. `/home` 上で表示する内容は「注目の資材（手動キュレーション）」「最新記事」「自社記事広告枠」「検索バー」のみで、ロール固有のセクションは置かない
4. ログイン後のロール別着地は **`landingPathForRole(role)`**（既存 helper）が担当し、サインイン直後に `/home` に着地するのは「未確定ロール」と「farmer」のみ
5. maker は既存通り `/maker/products` に着地する（ロール別ハブ機能は維持）

## 3. 採用した代替案

### A. ADR-0006 を更新する（却下）
ADR は immutable な意思決定の積み重ねが運用慣行。Accepted ステータスの ADR を上書き編集すると、過去の決定根拠が失われる。

### B. ADR-0006 を Supersede する（却下）
ADR-0006 の他の決定（資材一覧 / 詳細 / signup / login の 3 層分類）は依然有効。Supersede は範囲過剰。

### C. 新規 ADR-0008 で `/home` の意味を再定義する（採用）
ADR-0006 の決定（ロール別 dashboard 不採用）を継承しつつ、`/home` を「コンテンツ閲覧入口」として再分類する。ADR-0006 の他の決定には影響しない。

## 4. 帰結

### Positive

- ADR-0006 の決定（ロール別 dashboard 不採用）が継承される
- `/home` は機能要件 §3.1 で確定したコンテンツ閲覧入口として明確な役割を持つ
- 過去の決定（ADR-0006）を改竄せず、新しい決定（ADR-0008）として積み重ねる ADR 運用の慣行を維持

### Negative

- ADR-0006 の `/home` 削除計画（Phase 12 予定）は実施しないことになる。Phase 11b で実施済の bypass はそのまま、Phase 12 削除は本 ADR で取消
- `/home/page.tsx` を Phase 18 で実装するため、Phase 11b の薄いラッパは削除して新実装に置換する必要がある

### Neutral

- ADR-0006 §`landingPathForRole(role)` helper は引き続き有効（ロール別着地ロジックの集約場所として機能）

## 5. 実施

- Phase 18 spec（`docs/specs/home.md`）が本 ADR を引用する形で `/home` を実装
- Phase 11b で残置された薄いラッパは Phase 18 で削除し、新規 home コンテンツページに置換
- ADR-0006 §`/home` の扱い」セクションは更新せず、本 ADR-0008 を「上書き決定」として参照するのみ（ADR の慣行）

## 6. 未解決事項

- なし（本 ADR は `/home` の意味再定義のみが対象）

---

> **2026-05-11 Accept**: Status を Accepted に確定。Phase 18 spec §11.1 の Ryoga 判断項は本 Phase 18 着手時に「ADR-0008 確定済」として解釈する。
