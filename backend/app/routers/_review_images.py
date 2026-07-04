"""レビュー画像 Storage 規約 (`review-images/{user_id}/{review_id}/`) の共有ヘルパ (2026-07-04)。

ADR-0003: レビュー画像は DB に保持せず Storage のパス規約のみで管理する。
list / 公開 URL 解決 / 回収 (削除) がこの規約を共有するため 1 箇所に集約する
(products.py の公開表示・admin_reviews.py のハード削除・将来 reviews.py の本人削除回収)。
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

REVIEW_IMAGES_BUCKET = "review-images"


def list_review_image_paths(admin, user_id: str, review_id: str) -> list[str]:
    """`{user_id}/{review_id}/` 配下のファイルパスを name 昇順で返す。

    安定した並びにするため name でソートし、`.emptyFolderPlaceholder` 等の
    dotfile は除外する。list 失敗は空配列 (best-effort、呼び出し側を壊さない)。
    """
    folder = f"{user_id}/{review_id}"
    try:
        entries = admin.storage.from_(REVIEW_IMAGES_BUCKET).list(folder)
    except Exception:
        logger.warning("failed to list review images for %s", review_id, exc_info=True)
        return []
    names = sorted(
        e["name"]
        for e in (entries or [])
        if isinstance(e, dict) and e.get("name") and not e["name"].startswith(".")
    )
    return [f"{folder}/{name}" for name in names]


def list_review_image_urls(admin, user_id: str, review_id: str) -> list[str]:
    """公開表示用: public URL 配列を返す。

    `review-images` は public bucket (review_images_select_all で anon SELECT 可)
    なので get_public_url で直リンクできる。
    """
    urls: list[str] = []
    for path in list_review_image_paths(admin, user_id, review_id):
        try:
            url = admin.storage.from_(REVIEW_IMAGES_BUCKET).get_public_url(path)
        except Exception:
            continue
        if url:
            urls.append(url)
    return urls


def remove_review_images(admin, user_id: str, review_id: str) -> None:
    """ハード削除時に Storage フォルダを回収する。

    best-effort: 失敗してもログのみ (行削除は既に確定しているため)。
    """
    paths = list_review_image_paths(admin, user_id, review_id)
    if not paths:
        return
    try:
        admin.storage.from_(REVIEW_IMAGES_BUCKET).remove(paths)
    except Exception:
        logger.warning(
            "failed to remove review images for %s", review_id, exc_info=True
        )
