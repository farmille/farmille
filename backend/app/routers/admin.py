"""Admin BFF endpoints (ADR-0009 / spec maker-approval-admin §5).

`/v1/admin/*` 配下は `require_role("admin")` で第一防御する。書き込みは
service_role 経由のため RLS は第二防御に徹する。

提供エンドポイント:
- GET /v1/admin/summary
- GET /v1/admin/makers/pending
- POST /v1/admin/makers/{user_id}/approve
- POST /v1/admin/makers/{user_id}/reject
- POST /v1/admin/users/{user_id}/role
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import (
    AdminMakerOption,
    AdminMakersResponse,
    AdminRoleAssignPayload,
    AdminSummaryResponse,
    AdminUserListItem,
    AdminUserListResponse,
    PendingMakerItem,
    PendingMakersResponse,
    RejectMakerPayload,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()


ASSIGNABLE_ROLES: set[str] = {"admin", "ja_staff", "researcher"}


def _error(status_code: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"ok": False, "error": code})


def _maker_profile(row: dict[str, Any]) -> dict[str, Any]:
    """Supabase 1:1 join (`maker_profiles`) は dict / list どちらでも返り得る。"""
    raw = row.get("maker_profiles")
    if isinstance(raw, list):
        return raw[0] if raw else {}
    if isinstance(raw, dict):
        return raw
    return {}


@router.get("/summary", response_model=AdminSummaryResponse)
async def get_admin_summary(
    _user: dict = require_role("admin"),
) -> AdminSummaryResponse:
    """admin ダッシュボード初期表示用サマリ (spec §5.1 + admin-aglist v2 §3.4)。"""
    admin = get_supabase_admin()

    def _count(table: str, filters: list[tuple[str, Any]]) -> int:
        query = admin.table(table).select("id")
        for col, val in filters:
            query = query.eq(col, val)
        res = query.execute()
        return len(res.data or [])

    pending = _count("users", [("role", "maker"), ("status", "pending_review")])
    active = _count("users", [("role", "maker"), ("status", "active")])
    rejected = _count("users", [("role", "maker"), ("status", "rejected")])
    total = _count("users", [])

    # admin-aglist-alignment-v2.md §3.4: products カード追加
    products_total = _count("products", [])
    products_public_total = _count("products", [("is_public", True)])

    # レビュー承認フロー (2026-06-13): 承認待ちレビュー件数
    pending_reviews = _count("reviews", [("status", "pending")])

    return AdminSummaryResponse(
        pending_makers_count=pending,
        active_makers_count=active,
        rejected_makers_count=rejected,
        total_users_count=total,
        products_total=products_total,
        products_public_total=products_public_total,
        pending_reviews_count=pending_reviews,
    )


@router.get("/makers/pending", response_model=PendingMakersResponse)
async def list_pending_makers(
    _user: dict = require_role("admin"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PendingMakersResponse:
    """`role='maker' AND status='pending_review'` の一覧 (spec §5.2)。

    created_at ASC (先入れ先出し) で返す。`auth.users.email` は service_role で
    取得して各 row に付与する (B1 運営確認に必須)。
    """
    admin = get_supabase_admin()

    users_res = (
        admin.table("users")
        .select(
            "id, name, created_at, "
            "maker_profiles(company_name, prefecture, city, note)",
            count="exact",
        )
        .eq("role", "maker")
        .eq("status", "pending_review")
        .order("created_at", desc=False)
        .range(offset, offset + limit - 1)
        .execute()
    )
    rows = users_res.data or []
    total = users_res.count or 0

    items: list[PendingMakerItem] = []
    for r in rows:
        profile = _maker_profile(r)
        email = ""
        try:
            ar = admin.auth.admin.get_user_by_id(r["id"])
            user_obj = getattr(ar, "user", None) or ar
            email = getattr(user_obj, "email", None) or (
                user_obj.get("email", "") if isinstance(user_obj, dict) else ""
            ) or ""
        except Exception:
            logger.exception("failed to fetch auth email for user %s", r.get("id"))
        items.append(
            PendingMakerItem(
                user_id=r["id"],
                name=r.get("name") or "",
                email=email,
                company_name=profile.get("company_name"),
                prefecture=profile.get("prefecture"),
                city=profile.get("city"),
                note=profile.get("note"),
                created_at=r["created_at"],
            )
        )

    return PendingMakersResponse(makers=items, total=total)


@router.get("/makers", response_model=AdminMakersResponse)
async def list_makers(
    status: str = Query(
        default="active",
        description="フィルタする maker の status (active / pending_review / rejected)",
    ),
    _user: dict = require_role("admin"),
) -> AdminMakersResponse:
    """`role='maker' AND status=<filter>` の一覧 (spec admin-aglist-alignment-v2 §2.2)。

    F3 編集画面の maker_id ドロップダウン用。company_name は maker_profiles から、
    フォールバックは users.name。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("users")
        .select(
            "id, name, maker_profiles(company_name)",
        )
        .eq("role", "maker")
        .eq("status", status)
        .order("name", desc=False)
        .execute()
    )
    rows = res.data or []
    items: list[AdminMakerOption] = []
    for r in rows:
        profile = _maker_profile(r)
        items.append(
            AdminMakerOption(
                user_id=r["id"],
                name=r.get("name") or "",
                company_name=profile.get("company_name"),
            )
        )
    return AdminMakersResponse(makers=items)


def _fetch_maker_status(admin: Any, user_id: UUID) -> tuple[str | None, str | None]:
    """Return (role, status) or (None, None) if not found."""
    res = (
        admin.table("users")
        .select("role, status")
        .eq("id", str(user_id))
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return None, None
    row = rows[0]
    return row.get("role"), row.get("status")


@router.post("/makers/{user_id}/approve")
async def approve_maker(
    user_id: UUID,
    _user: dict = require_role("admin"),
):
    """メーカーを **公開** (status='active') に遷移。

    2026-05-27 変更: 元 status を問わず (pending_review / rejected 含む) active に遷移可。
    公開/非公開トグルの「公開」側として動作。冪等 (既に active なら 409)。
    """
    admin = get_supabase_admin()
    role, status = _fetch_maker_status(admin, user_id)
    if role is None or role != "maker":
        return _error(404, "maker_not_found")
    if status == "active":
        return _error(409, "already_active")
    if status == "frozen":
        return _error(409, "maker_frozen")  # 凍結中は別途解凍が必要

    try:
        admin.table("users").update({"status": "active"}).eq(
            "id", str(user_id)
        ).execute()
    except Exception:
        logger.exception("failed to approve maker %s", user_id)
        return _error(500, "failed_to_approve_maker")

    return {"ok": True, "user_id": str(user_id), "status": "active"}


@router.post("/makers/{user_id}/unpublish")
async def unpublish_maker(
    user_id: UUID,
    _user: dict = require_role("admin"),
):
    """メーカーを **非公開** (status='pending_review') に戻す。

    2026-05-27 新規: 公開済 maker を一時的に非公開へ。signup 直後の状態と同じ。
    公開/非公開トグルの「非公開」側。reject (永久的取り下げ) とは別物。
    """
    admin = get_supabase_admin()
    role, status = _fetch_maker_status(admin, user_id)
    if role is None or role != "maker":
        return _error(404, "maker_not_found")
    if status == "pending_review":
        return _error(409, "already_pending")
    if status == "frozen":
        return _error(409, "maker_frozen")

    try:
        admin.table("users").update({"status": "pending_review"}).eq(
            "id", str(user_id)
        ).execute()
    except Exception:
        logger.exception("failed to unpublish maker %s", user_id)
        return _error(500, "failed_to_unpublish_maker")

    return {"ok": True, "user_id": str(user_id), "status": "pending_review"}


@router.post("/makers/{user_id}/reject")
async def reject_maker(
    user_id: UUID,
    payload: RejectMakerPayload,
    _user: dict = require_role("admin"),
):
    """メーカーを **取り下げ** (status='rejected') に遷移。spam / 規約違反向け。

    2026-05-27 変更: 元 status を問わず rejected に遷移可。reason はログ出力 (DB 保存は v1.5+)。
    """
    admin = get_supabase_admin()
    role, status = _fetch_maker_status(admin, user_id)
    if role is None or role != "maker":
        return _error(404, "maker_not_found")
    if status == "rejected":
        return _error(409, "already_rejected")
    if status == "frozen":
        return _error(409, "maker_frozen")

    actor_id = _user.get("sub") or _user.get("id") or "<unknown-admin>"
    reason_text = (payload.reason or "").strip() or "<no-reason-provided>"
    logger.info(
        "maker_rejected user_id=%s actor=%s prev_status=%s reason=%r",
        user_id,
        actor_id,
        status,
        reason_text,
    )

    try:
        admin.table("users").update({"status": "rejected"}).eq(
            "id", str(user_id)
        ).execute()
    except Exception:
        logger.exception("failed to reject maker %s", user_id)
        return _error(500, "failed_to_reject_maker")

    return {"ok": True, "user_id": str(user_id), "status": "rejected"}


@router.get("/makers/list")
async def list_all_makers(
    _user: dict = require_role("admin"),
    status: str | None = Query(
        default=None,
        description="active / pending_review / rejected / frozen / null (全件)",
    ),
):
    """admin/makers 画面用、全 status の maker をフル情報で返す。

    2026-05-27 新規。既存 `/makers/pending` は pending_review しか返さなかったため、
    3 状態トグル UI には不十分だった。
    """
    admin = get_supabase_admin()
    query = (
        admin.table("users")
        .select(
            "id, name, status, created_at, "
            "maker_profiles(company_name, prefecture, city, note)"
        )
        .eq("role", "maker")
    )
    if status:
        query = query.eq("status", status)
    res = query.order("created_at", desc=False).execute()
    rows = res.data or []

    items: list[dict[str, Any]] = []
    for r in rows:
        profile = _maker_profile(r)
        # email は admin.auth で 1 件取り
        email: str | None = None
        try:
            au = admin.auth.admin.get_user_by_id(str(r["id"]))
            email = getattr(au.user, "email", None) if au else None
        except Exception:
            pass
        items.append(
            {
                "user_id": r["id"],
                "name": r.get("name") or "",
                "email": email,
                "status": r.get("status"),
                "created_at": r["created_at"],
                "company_name": profile.get("company_name"),
                "prefecture": profile.get("prefecture"),
                "city": profile.get("city"),
                "note": profile.get("note"),
            }
        )

    return {"makers": items, "total": len(items)}


@router.get("/users", response_model=AdminUserListResponse)
async def list_admin_users(
    _user: dict = require_role("admin"),
    q: str | None = Query(default=None, description="name + email の部分一致"),
    role: str | None = Query(default=None, description="role 完全一致"),
    status: str | None = Query(default=None, description="status 完全一致"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=100),
) -> AdminUserListResponse:
    """B6 admin users 一覧 (spec maker-approval-admin.md §5.5、ADR-0009 整合)。

    - public.users から id / role / name / status / created_at を取得
    - auth.users から email を取得 (admin auth API 経由)
    - フィルタ: role / status / q (name + email 部分一致)
    - ソート: created_at DESC, id DESC
    - pagination: per_page = 50 デフォルト、max 100

    v1 では UI で role 変更のみ。frozen toggle / 削除は SQL 直 (v1.5+ で UI 化)。
    """
    admin = get_supabase_admin()

    query = admin.table("users").select(
        "id, role, name, status, created_at, deleted_at", count="exact"
    )
    # 2026-05-27: 削除済はデフォルト除外 (?include_deleted=true で見せる将来余地)
    query = query.is_("deleted_at", "null")
    if role:
        query = query.eq("role", role)
    if status:
        query = query.eq("status", status)
    if q:
        like = q.replace(",", "")
        query = query.ilike("name", f"%{like}%")
        # auth.users.email との OR は PostgREST では難しいため、name のみ frontend で対応。
        # email 検索が必要になれば v1.5+ で別 endpoint or full-text 化を検討。

    query = query.order("created_at", desc=True).order("id", desc=True)

    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end)

    res = query.execute()
    rows = res.data or []
    total = getattr(res, "count", None) or 0

    # 2026-05-27: pending 通報数を 1 query でまとめ取り (N+1 回避)
    report_counts: dict[str, int] = {}
    if rows:
        ids = [r["id"] for r in rows]
        try:
            rep_res = (
                admin.table("user_reports")
                .select("target_user_id")
                .in_("target_user_id", ids)
                .eq("status", "pending")
                .execute()
            )
            for row in rep_res.data or []:
                tid = row["target_user_id"]
                report_counts[tid] = report_counts.get(tid, 0) + 1
        except Exception:
            logger.warning("failed to aggregate report counts")

    # auth.users から email を 1 件ずつ取りに行く (admin auth API)。
    # N+1 を避けるため per_page=50 で抑える。
    items: list[AdminUserListItem] = []
    for r in rows:
        user_id = r["id"]
        email: str | None = None
        try:
            auth_user = admin.auth.admin.get_user_by_id(str(user_id))
            email = getattr(auth_user.user, "email", None) if auth_user else None
        except Exception:
            logger.warning("failed to fetch auth email for %s", user_id)
        items.append(
            AdminUserListItem(
                user_id=user_id,
                email=email,
                name=r.get("name") or "",
                role=r.get("role") or "unassigned",
                status=r.get("status") or "active",
                created_at=r["created_at"],
                pending_report_count=report_counts.get(user_id, 0),
                is_deleted=r.get("deleted_at") is not None,
            )
        )

    return AdminUserListResponse(
        users=items, total=total, page=page, per_page=per_page
    )


@router.post("/users/{user_id}/role")
async def assign_user_role(
    user_id: UUID,
    payload: AdminRoleAssignPayload,
    _user: dict = require_role("admin"),
):
    """admin / ja_staff / researcher への昇格 (spec §5.5)。

    `farmer` / `maker` は自己選択フロー (`/v1/auth/register-role`) に任せる。
    `unassigned` への降格は v1 アウト (SQL 直)。Pydantic Literal で 422 にも落ちる
    が、防御的に ASSIGNABLE_ROLES でも再判定する。

    既存 `register-role` のロールバックパターン (auth.py:40-62) を踏襲:
      1. 現ロールを SELECT で保持
      2. auth.users.app_metadata.role を更新
      3. public.users.role を更新
      4. 3. 失敗時は 1. で取った元ロールに auth を戻す
    """
    if payload.role not in ASSIGNABLE_ROLES:
        return _error(400, "invalid_target_role")

    admin = get_supabase_admin()

    res = (
        admin.table("users")
        .select("role")
        .eq("id", str(user_id))
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return _error(404, "user_not_found")
    previous_role = rows[0].get("role") or "unassigned"
    if previous_role == payload.role:
        return _error(409, "role_already_assigned")

    try:
        admin.auth.admin.update_user_by_id(
            str(user_id),
            {"app_metadata": {"role": payload.role}},
        )
    except Exception:
        logger.exception("failed to update auth metadata for %s", user_id)
        return _error(500, "failed_to_update_auth_metadata")

    try:
        upd = (
            admin.table("users")
            .update({"role": payload.role})
            .eq("id", str(user_id))
            .execute()
        )
        if not upd.data:
            raise RuntimeError("public.users row not found")
    except Exception:
        logger.exception("failed to update public.users for %s", user_id)
        try:
            admin.auth.admin.update_user_by_id(
                str(user_id),
                {"app_metadata": {"role": previous_role}},
            )
        except Exception:
            logger.exception("rollback failed for %s", user_id)
        return _error(500, "failed_to_update_users_table")

    return {"ok": True, "user_id": str(user_id), "role": payload.role}


# ─────────────────────────────────────────────────────────────────────
# 2026-05-27: freeze / soft-delete (B6 完成、ADR-0009 + status enum 拡張なし)
# ─────────────────────────────────────────────────────────────────────


@router.post("/users/{user_id}/freeze")
async def freeze_user(
    user_id: UUID,
    _user: dict = require_role("admin"),
):
    """user.status を active → frozen に切替 + auth.users を ban して login 禁止。

    2026-05-27 修正: 旧実装は public.users.status='frozen' しか触らず
    auth.users 側は無傷で login が通る不具合 → ban_duration を併用して
    既存 refresh token も失効させる。既存 access token は最大 1hr で expire。

    frozen 状態のユーザーは:
      - login 不可 (ban_duration が GoTrue 側で permanent 扱い)
      - 公開 /v1/products / /v1/manufacturers から消える (ADR-0009 既存実装)
      - /v1/admin/users では引き続き表示し、admin が「凍結解除」できる
    """
    admin = get_supabase_admin()
    # self / admin ガード: 自分や他 admin の凍結による全 admin ロックアウトを防ぐ
    if str(user_id) == get_user_id(_user):
        return _error(400, "cannot_modify_self")
    cur = (
        admin.table("users")
        .select("status, role")
        .eq("id", str(user_id))
        .limit(1)
        .execute()
    )
    rows = cur.data or []
    if not rows:
        return _error(404, "user_not_found")
    if rows[0].get("role") == "admin":
        return _error(403, "cannot_freeze_admin")
    if rows[0]["status"] == "frozen":
        return _error(409, "already_frozen")
    try:
        admin.table("users").update({"status": "frozen"}).eq("id", str(user_id)).execute()
    except Exception:
        logger.exception("failed to freeze user %s", user_id)
        return _error(500, "failed_to_freeze_user")

    # 2026-05-27 fix: auth.users 側も ban して login 禁止
    try:
        admin.auth.admin.update_user_by_id(
            str(user_id),
            {"ban_duration": "876000h"},  # ~100 years、unfreeze で "none" 戻し
        )
    except Exception:
        logger.exception("failed to ban auth user %s on freeze", user_id)
        # public.users.status は更新済。auth ban 失敗は warn だが return は ok
        # (UAT で発覚しやすい、prod では retry ジョブで救う想定)

    return {"ok": True, "user_id": str(user_id), "status": "frozen"}


@router.post("/users/{user_id}/unfreeze")
async def unfreeze_user(
    user_id: UUID,
    _user: dict = require_role("admin"),
):
    """user.status を frozen → active に戻す + auth ban 解除。"""
    admin = get_supabase_admin()
    cur = (
        admin.table("users")
        .select("status, deleted_at")
        .eq("id", str(user_id))
        .limit(1)
        .execute()
    )
    rows = cur.data or []
    if not rows:
        return _error(404, "user_not_found")
    # 削除済 (deleted_at) アカウントは解凍で復活させない
    if rows[0].get("deleted_at") is not None:
        return _error(409, "user_deleted")
    if rows[0]["status"] != "frozen":
        return _error(409, "not_frozen")
    try:
        admin.table("users").update({"status": "active"}).eq("id", str(user_id)).execute()
    except Exception:
        logger.exception("failed to unfreeze user %s", user_id)
        return _error(500, "failed_to_unfreeze_user")

    # 2026-05-27 fix: ban 解除
    try:
        admin.auth.admin.update_user_by_id(
            str(user_id),
            {"ban_duration": "none"},
        )
    except Exception:
        logger.exception("failed to unban auth user %s on unfreeze", user_id)

    return {"ok": True, "user_id": str(user_id), "status": "active"}


@router.post("/users/{user_id}/delete")
async def delete_user_account(
    user_id: UUID,
    _user: dict = require_role("admin"),
):
    """**ソフト削除 (ban + 非表示)**: users.deleted_at をセットし status='frozen' + auth ban。

    2026-06-01 設計確定 (デプロイ前レビュー): user_reports を監査ログとして保持する
    migration 設計に合わせ、ハード削除 (auth.users 物理削除 + CASCADE) をやめてソフト削除に
    統一する。users 行を残すことで:
      - user_reports (通報監査ログ) が FK CASCADE で消えない
      - status='frozen' により既存 ADR-0009 の公開フィルタ (products / get_product /
        manufacturers / home / reviews) からそのまま除外される
      - deleted_at が「単なる凍結」と「削除」を区別 (admin list は deleted_at で除外、
        /unfreeze は deleted_at が立っていれば復活を拒否)
      - auth.users は ban して login 禁止 (freeze と同じ ban_duration)

    凍結 (`/freeze`) との違い: 削除は deleted_at が立ち復活できない。GDPR 的な完全消去
    (PII erasure) が要る場合は別経路 (fast-follow)。復元 UI は v1 非対応。
    """
    admin = get_supabase_admin()
    uid = str(user_id)

    # self / admin ガード: 自分や他 admin の不可逆操作 (ロックアウト/監査喪失) を防ぐ
    if uid == get_user_id(_user):
        return _error(400, "cannot_delete_self")

    cur = admin.table("users").select("id, role").eq("id", uid).limit(1).execute()
    rows = cur.data or []
    if not rows:
        return _error(404, "user_not_found")
    if rows[0].get("role") == "admin":
        return _error(403, "cannot_delete_admin")

    # ソフト削除: users 行は残し deleted_at + status='frozen' をマーク。
    # reviews / products は物理削除せず、上記公開フィルタで非表示にする。
    try:
        admin.table("users").update(
            {
                "deleted_at": datetime.now(timezone.utc).isoformat(),
                "status": "frozen",
            }
        ).eq("id", uid).execute()
    except Exception:
        logger.exception("failed to soft-delete user %s", uid)
        return _error(500, "delete_failed")

    # auth.users を ban して login 禁止 (freeze と同じ手法、既存 token も refresh 失効)
    try:
        admin.auth.admin.update_user_by_id(uid, {"ban_duration": "876000h"})
    except Exception:
        logger.exception("failed to ban auth user %s on delete", uid)
        # deleted_at/status は更新済。ban 失敗は warn (prod では retry ジョブ想定)

    return {"ok": True, "user_id": uid}
