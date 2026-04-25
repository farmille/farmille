"""画像 Storage path の検証ユーティリティ。

BFF が Supabase Storage の remove() を service_role で叩く際、
フロントから受け取った path が他人の領域を指していないことを第一防御として確認する。
Storage RLS の第 1 階層 UID 強制 (review_images_delete_owner /
product_images_delete_owner) は第二防御。

skill §3.2 「バリデーション」 + skill §1.3 「BFF 第一防御 / RLS 第二防御」の運用。

参照: docs/specs/image-edit-and-launch-ready.md §4.3
"""


def validate_review_image_path(path: str, user_id: str, review_id: str) -> bool:
    """review-images バケットの path が {user_id}/{review_id}/... 配下かを検証。

    Storage RLS は第 1 階層 UID のみ強制するため、BFF で第 2 階層 review_id も
    併せて検証する。traversal 文字列 ``..`` を含む path はセグメント検証後に拒否。
    """
    parts = path.split("/")
    return (
        len(parts) >= 3
        and parts[0] == user_id
        and parts[1] == review_id
        and ".." not in parts
    )


def validate_product_image_path(path: str, user_id: str) -> bool:
    """product-images バケットの path が {user_id}/... 配下かを検証。

    Phase 8 は ``{uid}/pending/...`` 固定だが、将来 ``{uid}/{product_id}/...`` に
    移行する可能性を残すため第 2 階層は緩く、第 1 階層 UID と traversal 不在のみを確認。
    """
    parts = path.split("/")
    return (
        len(parts) >= 2
        and parts[0] == user_id
        and ".." not in parts
    )
